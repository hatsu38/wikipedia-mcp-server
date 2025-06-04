# wikipedia-mcp-server

[![npm version](https://img.shields.io/npm/v/wikipedia-mcp-server.svg)](https://www.npmjs.com/package/wikipedia-mcp-server)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 概要

Wikipedia MCP Serverは、[Model Context Protocol (MCP)](https://github.com/modelcontextprotocol) に準拠したWikipedia検索APIサーバーです。MCP対応AIやエージェントから、Wikipediaの検索・記事取得・ランダム記事取得が多言語で利用できます。

---

## MCPクライアントでの利用方法

MCPクライアント（例: Cursor, Claude Desktop等）の設定ファイルに、以下のように追記してください（詳細は各クライアントのドキュメントを参照）。

```json
{
  "mcpServers": {
    "wikipedia": {
      "command": "npx",
      "args": [
        "-y",
        "wikipedia-mcp-server"
      ]
    }
  }
}
```

---

## ツール一覧

### `search_wikipedia` - Wikipedia記事検索

- キーワードでWikipedia記事を検索します。
- **パラメータ:**
  - `query` (string): 検索キーワード
  - `lang` (string, default: "ja"): 言語コード（例: "ja", "en"）
  - `limit` (number, default: 5): 取得件数

### `get_wikipedia_article` - 記事詳細取得

- Wikipedia記事の詳細情報を取得します。
- **パラメータ:**
  - `title` (string): 記事タイトル
  - `lang` (string, default: "ja"): 言語コード
  - `include_content` (boolean, default: false): 本文(wikitext)を含めるか

### `get_random_wikipedia` - ランダム記事取得

- ランダムなWikipedia記事を取得します。
- **パラメータ:**
  - `lang` (string, default: "ja"): 言語コード
  - `count` (number, default: 5): 取得件数

---

## 注意事項

- Wikipedia APIの仕様変更等により、取得できる情報が変わる場合があります。
- AIやMCPクライアント経由で取得した情報の取り扱いにはご注意ください。

---

## ライセンス

MIT

---

## 作者

hatsu38
