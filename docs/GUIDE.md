# Taxo MX MCP - Documentation

Connect AI assistants to Mexico's tax system (SAT) via the Taxo API.

**Server URL:** `https://squid-app-xqdzx.ondigitalocean.app`

## Quick Start

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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

Replace `YOUR_TOKEN` with your Taxo API token from [taxo.co](https://taxo.co).

### Other MCP Clients

```
POST https://squid-app-xqdzx.ondigitalocean.app/mcp/YOUR_TOKEN
Content-Type: application/json
```

---

## Available Tools

### extract_compliance_opinion

Request extraction of SAT compliance opinion (Opinión de Cumplimiento) for a taxpayer. This is an async operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rfc` | string | Yes | Taxpayer RFC (Registro Federal de Contribuyentes) |

**Returns:** Extraction task initiated. Results delivered via webhook.

**Example prompt:** "Extract the compliance opinion for RFC GAGC841128A87"

---

### extract_compliance_opinion_by_accountant

Request extraction of compliance opinions for all taxpayers of an accountant. This is an async operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountantId` | string | Yes | Internal accountant ID |

**Returns:** Extraction tasks initiated for all clients.

**Example prompt:** "Extract compliance opinions for all clients of accountant 2896"

---

### extract_compliance_opinion_all

Request extraction of compliance opinions for all valid taxpayers in the platform. This is an async operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | - | - | No parameters required |

**Returns:** Extraction tasks initiated for all taxpayers.

**Example prompt:** "Extract compliance opinions for all taxpayers"

---

### get_compliance_opinion

Retrieve the SAT compliance opinion (Opinión de Cumplimiento) for a taxpayer. Returns the latest extracted opinion.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rfc` | string | Yes | Taxpayer RFC |

**Returns:** Latest compliance opinion data (positive/negative status, validity date, details).

**Example prompt:** "Get the compliance opinion for RFC GAGC841128A87"

---

### extract_tax_status

Request extraction of tax status certificate (Constancia de Situación Fiscal) for a taxpayer. This is an async operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rfc` | string | Yes | Taxpayer RFC |

**Returns:** Extraction task initiated. Results delivered via webhook.

**Example prompt:** "Extract the tax status certificate for RFC GAGC841128A87"

---

### extract_tax_status_by_accountant

Request extraction of tax status certificates for all taxpayers of an accountant. This is an async operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountantId` | string | Yes | Internal accountant ID |

**Returns:** Extraction tasks initiated for all clients.

**Example prompt:** "Extract tax status certificates for all clients of accountant 2896"

---

### extract_tax_status_all

Request extraction of tax status certificates for all valid taxpayers. This is an async operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | - | - | No parameters required |

**Returns:** Extraction tasks initiated for all taxpayers.

**Example prompt:** "Extract tax status certificates for all taxpayers"

---

### get_tax_status

Retrieve the tax status certificate (Constancia de Situación Fiscal) for a taxpayer. Returns the latest extracted certificate.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rfc` | string | Yes | Taxpayer RFC |

**Returns:** Tax status certificate data (fiscal regime, address, economic activities, tax obligations).

**Example prompt:** "Get the tax status for RFC GAGC841128A87"

---

### extract_cfdi

Request extraction of CFDI (electronic invoices) for a taxpayer within a date range. This is an async operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rfc` | string | Yes | Taxpayer RFC |
| `startDate` | string | Yes | Start date in YYYY-MM-DD format |
| `endDate` | string | Yes | End date in YYYY-MM-DD format |
| `extractionType` | string | Yes | `all`, `issued`, or `received` |

**Extraction Types:**
- `all` - All invoices (issued and received)
- `issued` - Only invoices issued by the taxpayer (emitidos)
- `received` - Only invoices received by the taxpayer (recibidos)

**Returns:** Extraction task initiated. CFDI documents delivered via webhook.

**Example prompt:** "Extract all CFDI for RFC MAMC6210097Q1 from May 1-11, 2025"

---

### extract_cfdi_by_accountant

Request extraction of CFDI for all clients of an accountant within a date range. This is an async operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountantId` | string | Yes | Internal accountant ID |
| `startDate` | string | Yes | Start date in YYYY-MM-DD format |
| `endDate` | string | Yes | End date in YYYY-MM-DD format |

**Returns:** Extraction tasks initiated for all clients.

**Example prompt:** "Extract CFDI for all clients of accountant 9553 from September 25-30, 2025"

---

### get_monthly_tax_report

Retrieve the monthly tax report for a taxpayer. Includes ISR, IVA, and other tax calculations.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rfc` | string | Yes | Taxpayer RFC |
| `year` | string | Yes | Year (e.g., "2025") |
| `month` | string | Yes | Month in MM format (e.g., "04" for April) |

**Returns:** Monthly tax report with ISR, IVA, retentions, and payment calculations.

**Example prompt:** "Get the tax report for RFC GAGC841128A87, April 2025"

---

### get_contacts

Retrieve the contacts associated with a taxpayer.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rfc` | string | Yes | Taxpayer RFC |

**Returns:** List of contacts (clients, suppliers) associated with the taxpayer.

**Example prompt:** "Get the contacts for RFC GAGC841128A87"

---

### get_invoices

Retrieve invoices/documents for a taxpayer with optional filters.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rfc` | string | Yes | Taxpayer RFC |
| `type` | string | No | Invoice type filter |
| `year` | string | No | Filter by year |
| `month` | string | No | Filter by month |
| `status` | string | No | Invoice status filter |
| `category` | string | No | Category filter |
| `search` | string | No | Search term |
| `issuer` | string | No | Filter by issuer |
| `paymentType` | string | No | Payment type filter |
| `paymentWay` | string | No | Payment method filter |

**Returns:** List of invoices matching the filters.

**Example prompt:** "Get all invoices for RFC GAGC841128A87 from 2025"

---

### get_categories

Retrieve all categories defined in Taxo for invoice classification.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | - | - | No parameters required |

**Returns:** List of available categories for invoice classification.

**Example prompt:** "What categories are available for classifying invoices?"

---

### create_taxpayer

Create a new taxpayer under an accountant. Requires RFC and CIEC (SAT password) to enable document extraction.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountantId` | string | Yes | Internal accountant ID |
| `rfc` | string | Yes | Taxpayer RFC |
| `ciec` | string | Yes | CIEC password for SAT access |

**Returns:** Created taxpayer details.

**Example prompt:** "Create a new taxpayer with RFC ZAHM8212203I2 under accountant 2896"

---

## Async Operations & Webhooks

Many tools are **asynchronous**. They initiate an extraction task and results are delivered to your webhook.

### Synchronous Tools (immediate response)

- `get_compliance_opinion`
- `get_tax_status`
- `get_monthly_tax_report`
- `get_contacts`
- `get_invoices`
- `get_categories`
- `create_taxpayer`

### Asynchronous Tools (results via webhook)

- `extract_compliance_opinion`
- `extract_compliance_opinion_by_accountant`
- `extract_compliance_opinion_all`
- `extract_tax_status`
- `extract_tax_status_by_accountant`
- `extract_tax_status_all`
- `extract_cfdi`
- `extract_cfdi_by_accountant`

### Webhook Setup

1. Log in to [taxo.co](https://taxo.co)
2. Go to API settings
3. Configure your webhook endpoint URL
4. Your endpoint receives POST requests with extraction results

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/mcp` | POST | MCP endpoint (requires `Authorization: Bearer` header) |
| `/mcp/:token` | POST | MCP endpoint (token in URL) |

### Direct API Example

```bash
curl -X POST https://squid-app-xqdzx.ondigitalocean.app/mcp/YOUR_TOKEN \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

---

## Get Your API Token

Sign up at [taxo.co](https://taxo.co) to get your API token.
