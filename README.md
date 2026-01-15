# Taxo MX MCP Server

MCP (Model Context Protocol) server for [Taxo Impuestos MX](https://taxo.co) - Mexico's tax platform. Enables AI assistants to interact with SAT data, CFDI documents, tax reports, and compliance information.

## Features

- Extract and retrieve SAT compliance opinions (Opinión de Cumplimiento)
- Extract and retrieve tax status certificates (Constancia de Situación Fiscal)
- Extract CFDI documents (issued, received, or all)
- Get monthly tax reports (ISR, IVA)
- Query invoices with advanced filters
- Manage taxpayers and contacts

## Quick Start

### Claude Desktop (Remote)

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "taxo-mx": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://squid-app-xqdzx.ondigitalocean.app/mcp/YOUR_TOKEN"
      ]
    }
  }
}
```

### Claude Desktop (Local)

```json
{
  "mcpServers": {
    "taxo-mx": {
      "command": "npx",
      "args": ["taxo-mx-mcp", "--token", "YOUR_TOKEN"]
    }
  }
}
```

Or with environment variable:

```json
{
  "mcpServers": {
    "taxo-mx": {
      "command": "npx",
      "args": ["taxo-mx-mcp"],
      "env": {
        "TAXO_MX_TOKEN": "YOUR_TOKEN"
      }
    }
  }
}
```

## Available Tools

### Compliance Opinion (Opinión de Cumplimiento)

| Tool | Description |
|------|-------------|
| `extract_compliance_opinion` | Request extraction for a taxpayer by RFC |
| `extract_compliance_opinion_by_accountant` | Request extraction for all clients of an accountant |
| `extract_compliance_opinion_all` | Request extraction for all valid taxpayers |
| `get_compliance_opinion` | Get the latest compliance opinion for a taxpayer |

### Tax Status Certificate (Constancia de Situación Fiscal)

| Tool | Description |
|------|-------------|
| `extract_tax_status` | Request extraction for a taxpayer by RFC |
| `extract_tax_status_by_accountant` | Request extraction for all clients of an accountant |
| `extract_tax_status_all` | Request extraction for all valid taxpayers |
| `get_tax_status` | Get the latest tax status certificate for a taxpayer |

### CFDI (Electronic Invoices)

| Tool | Description |
|------|-------------|
| `extract_cfdi` | Extract CFDI for a taxpayer (all, issued, or received) |
| `extract_cfdi_by_accountant` | Extract CFDI for all clients of an accountant |

### Reports & Documents

| Tool | Description |
|------|-------------|
| `get_monthly_tax_report` | Get monthly tax report (ISR, IVA, etc.) |
| `get_invoices` | Query invoices with filters |
| `get_contacts` | Get taxpayer contacts |
| `get_categories` | Get invoice categories |

### Taxpayer Management

| Tool | Description |
|------|-------------|
| `create_taxpayer` | Create a new taxpayer under an accountant |

## HTTP Server

Run the HTTP server for remote access:

```bash
npm run start:http
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `BASE_URL` | Public URL | `http://localhost:3000` |

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/mcp` | POST | MCP endpoint (requires `Authorization: Bearer` header) |
| `/mcp/:token` | POST | MCP endpoint (token in URL) |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run stdio server
npm start

# Run HTTP server
npm run start:http

# Watch mode
npm run dev
```

## License

MIT
