import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Wikipedia APIのベースURL
const WIKIPEDIA_API_BASE = "https://ja.wikipedia.org/w/api.php";

// Wikipedia API レスポンス型定義

// 検索API用
interface WikipediaSearchResult {
  ns: number;
  title: string;
  pageid: number;
  size: number;
  wordcount: number;
  snippet: string;
  timestamp: string;
}
interface WikipediaSearchResponse {
  query?: {
    search: WikipediaSearchResult[];
  };
}

// 記事詳細API用
interface WikipediaPageCategory {
  ns: number;
  title: string;
}
interface WikipediaPageLink {
  ns: number;
  title: string;
}
interface WikipediaPageImage {
  ns: number;
  title: string;
}
interface WikipediaPageRevision {
  '*': string;
}
interface WikipediaPage {
  pageid: number;
  ns: number;
  title: string;
  touched: string;
  length: number;
  missing?: boolean;
  categories?: WikipediaPageCategory[];
  links?: WikipediaPageLink[];
  images?: WikipediaPageImage[];
  revisions?: WikipediaPageRevision[];
}
interface WikipediaArticleResponse {
  query?: {
    pages: {
      [pageid: string]: WikipediaPage;
    };
  };
}

// ランダム記事API用
interface WikipediaRandomArticle {
  id: number;
  ns: number;
  title: string;
}
interface WikipediaRandomResponse {
  query?: {
    random: WikipediaRandomArticle[];
  };
}

// Wikipedia APIリクエスト関数
async function wikipediaRequest<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Wikipedia MCP Server/0.0.1 (https://github.com/hatsu38/wikipedia-mcp-server)',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    throw new Error(`Wikipedia API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// サーバのインスタンス作成
const server = new McpServer({
  name: "mcp-wikipedia-api",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Wikipedia記事検索ツール
server.tool(
  "search_wikipedia",
  "Search Wikipedia articles by keyword（キーワードでWikipedia記事を検索する）",
  {
    query: z.string().describe("Search keyword"),
    lang: z.string().default("ja").describe("Language code (ja, en, etc.)"),
    limit: z.number().default(5).describe("Number of search results")
  },
  async ({ query, lang, limit }) => {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://${lang}.wikipedia.org/w/api.php?format=json&action=query&list=search&srsearch=${encodedQuery}&srlimit=${limit}&srprop=snippet|size|wordcount|timestamp`;
      
      const data = await wikipediaRequest<WikipediaSearchResponse>(url);
      
      if (!data.query?.search || data.query.search.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `検索結果が見つかりませんでした: "${query}"`,
            },
          ],
        };
      }
      
      const results = data.query.search.map((result: any) => {
        return `**${result.title}**\n${result.snippet?.replace(/<[^>]*>/g, '') || '説明なし'}\n記事サイズ: ${result.size}文字 | 単語数: ${result.wordcount}\nURL: https://${lang}.wikipedia.org/wiki/${encodeURIComponent(result.title)}\n`;
      }).join('\n---\n\n');
      
      return {
        content: [
          {
            type: "text",
            text: `Wikipedia検索結果 (${data.query.search.length}件):\n\n${results}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Wikipedia検索に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Wikipedia記事の詳細情報取得ツール
server.tool(
  "get_wikipedia_article",
  "Get detailed information about a Wikipedia article（Wikipedia記事の詳細情報を取得する）",
  {
    title: z.string().describe("Article title"),
    lang: z.string().default("ja").describe("Language code (ja, en, etc.)"),
    include_content: z.boolean().default(false).describe("Include article content (wikitext)")
  },
  async ({ title, lang, include_content }) => {
    try {
      const encodedTitle = encodeURIComponent(title);
      let props = "info|categories|links|images";
      if (include_content) {
        props += "|revisions&rvprop=content";
      }
      
      const url = `https://${lang}.wikipedia.org/w/api.php?format=json&action=query&prop=${props}&titles=${encodedTitle}`;
      
      const data = await wikipediaRequest<WikipediaArticleResponse>(url);
      
      const pages = data.query?.pages;
      if (!pages) {
        throw new Error("記事が見つかりません");
      }
      
      const pageId = Object.keys(pages)[0];
      const page = pages[pageId];
      
      if (page.missing) {
        return {
          content: [
            {
              type: "text",
              text: `記事が見つかりませんでした: "${title}"`,
            },
          ],
        };
      }
      
      let result = `**${page.title}**\n\n`;
      result += `記事ID: ${page.pageid}\n`;
      result += `最終更新: ${page.touched}\n`;
      result += `記事サイズ: ${page.length}文字\n`;
      result += `URL: https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title)}\n\n`;
      
      // カテゴリ情報
      if (page.categories && page.categories.length > 0) {
        result += `**カテゴリ:**\n`;
        page.categories.slice(0, 10).forEach((cat: any) => {
          result += `- ${cat.title.replace('Category:', '')}\n`;
        });
        result += '\n';
      }
      
      // リンク情報（最初の10件のみ）
      if (page.links && page.links.length > 0) {
        result += `**関連記事 (最初の10件):**\n`;
        page.links.slice(0, 10).forEach((link: any) => {
          result += `- ${link.title}\n`;
        });
        result += '\n';
      }
      
      // 画像情報（最初の5件のみ）
      if (page.images && page.images.length > 0) {
        result += `**使用画像 (最初の5件):**\n`;
        page.images.slice(0, 5).forEach((img: any) => {
          result += `- ${img.title}\n`;
        });
        result += '\n';
      }
      
      // 記事内容（要求された場合のみ）
      if (include_content && page.revisions && page.revisions[0]) {
        const content = page.revisions[0]['*'];
        result += `**記事内容 (最初の500文字):**\n`;
        result += content.substring(0, 500) + (content.length > 500 ? '...' : '');
      }
      
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `記事取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// ランダム記事取得ツール
server.tool(
  "get_random_wikipedia",
  "Get random Wikipedia articles（ランダムなWikipedia記事を取得する）",
  {
    lang: z.string().default("ja").describe("Language code (ja, en, etc.)"),
    count: z.number().default(5).describe("Number of random articles to get")
  },
  async ({ lang, count }) => {
    try {
      const url = `https://${lang}.wikipedia.org/w/api.php?format=json&action=query&list=random&rnnamespace=0&rnlimit=${count}`;
      
      const data = await wikipediaRequest<WikipediaRandomResponse>(url);
      
      if (!data.query?.random || data.query.random.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "ランダム記事を取得できませんでした",
            },
          ],
        };
      }
      
      const results = data.query.random.map((article: any) => {
        return `**${article.title}**\nURL: https://${lang}.wikipedia.org/wiki/${encodeURIComponent(article.title)}`;
      }).join('\n\n');
      
      return {
        content: [
          {
            type: "text",
            text: `ランダム記事 (${data.query.random.length}件):\n\n${results}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `ランダム記事取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

async function main() {
  // MCPサーバーの起動
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Wikipedia MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
