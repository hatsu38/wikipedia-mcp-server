# wikipedia-mcp-server

[![npm version](https://img.shields.io/npm/v/wikipedia-mcp-server.svg)](https://www.npmjs.com/package/wikipedia-mcp-server)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Overview

Wikipedia MCP Server is a [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol) compatible server that provides Wikipedia search and article retrieval tools for AI agents and MCP clients. You can search, get details, and fetch random articles from Wikipedia in multiple languages via MCP tools.

---

## How to Use with MCP Clients

Add the following configuration to your MCP client (e.g., Cursor, Claude Desktop) to use this server. (See your client's documentation for details.)

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

## Tools

### `search_wikipedia` - Search Wikipedia articles

- Search Wikipedia articles by keyword.
- **Parameters:**
  - `query` (string): Search keyword
  - `lang` (string, default: "ja"): Language code (e.g., "ja", "en")
  - `limit` (number, default: 5): Number of results

### `get_wikipedia_article` - Get article details

- Get detailed information about a Wikipedia article.
- **Parameters:**
  - `title` (string): Article title
  - `lang` (string, default: "ja"): Language code
  - `include_content` (boolean, default: false): Include article content (wikitext)

### `get_random_wikipedia` - Get random articles

- Get random Wikipedia articles.
- **Parameters:**
  - `lang` (string, default: "ja"): Language code
  - `count` (number, default: 5): Number of articles

---

## Notes

- The information obtained via this server is subject to Wikipedia API changes.
- Please handle the acquired data appropriately, especially when using with AI services.

---

## License

MIT

---

## Author

hatsu38
