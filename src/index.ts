#!/usr/bin/env node

import express, { Request, Response } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { TaxoMxApiClient, TaxoMxApiError } from './api/client.js';

function getPort(): number {
  const port = process.env.PORT;
  return port ? parseInt(port, 10) : 3000;
}

function getBaseUrl(): string {
  return process.env.BASE_URL || `http://localhost:${getPort()}`;
}

// ============================================
// Tool Definitions
// ============================================

const TOOLS = [
  // Compliance Opinion (Opinión de Cumplimiento)
  {
    name: 'extract_compliance_opinion',
    description:
      'Requests extraction of SAT compliance opinion (Opinión de Cumplimiento) for a taxpayer by RFC. This is an async operation.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        rfc: {
          type: 'string',
          description: 'Taxpayer RFC (Registro Federal de Contribuyentes)',
        },
      },
      required: ['rfc'],
    },
  },
  {
    name: 'extract_compliance_opinion_by_accountant',
    description:
      'Requests extraction of compliance opinions for all taxpayers of an accountant. This is an async operation.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        accountantId: {
          type: 'string',
          description: 'Internal accountant ID',
        },
      },
      required: ['accountantId'],
    },
  },
  {
    name: 'extract_compliance_opinion_all',
    description:
      'Requests extraction of compliance opinions for all valid taxpayers in the platform. This is an async operation.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_compliance_opinion',
    description:
      'Retrieves the SAT compliance opinion (Opinión de Cumplimiento) for a taxpayer. Returns the latest extracted opinion.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        rfc: {
          type: 'string',
          description: 'Taxpayer RFC',
        },
      },
      required: ['rfc'],
    },
  },

  // Tax Status Certificate (Constancia de Situación Fiscal)
  {
    name: 'extract_tax_status',
    description:
      'Requests extraction of tax status certificate (Constancia de Situación Fiscal) for a taxpayer by RFC. This is an async operation.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        rfc: {
          type: 'string',
          description: 'Taxpayer RFC',
        },
      },
      required: ['rfc'],
    },
  },
  {
    name: 'extract_tax_status_by_accountant',
    description:
      'Requests extraction of tax status certificates for all taxpayers of an accountant. This is an async operation.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        accountantId: {
          type: 'string',
          description: 'Internal accountant ID',
        },
      },
      required: ['accountantId'],
    },
  },
  {
    name: 'extract_tax_status_all',
    description:
      'Requests extraction of tax status certificates for all valid taxpayers. This is an async operation.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_tax_status',
    description:
      'Retrieves the tax status certificate (Constancia de Situación Fiscal) for a taxpayer. Returns the latest extracted certificate.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        rfc: {
          type: 'string',
          description: 'Taxpayer RFC',
        },
      },
      required: ['rfc'],
    },
  },

  // CFDI (Electronic Invoices)
  {
    name: 'extract_cfdi',
    description:
      'Requests extraction of CFDI (electronic invoices) for a taxpayer. Can extract issued, received, or all invoices within a date range. This is an async operation.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        rfc: {
          type: 'string',
          description: 'Taxpayer RFC',
        },
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format',
        },
        extractionType: {
          type: 'string',
          enum: ['all', 'issued', 'received'],
          description: 'Type of invoices to extract: all, issued (emitidos), or received (recibidos)',
        },
      },
      required: ['rfc', 'startDate', 'endDate', 'extractionType'],
    },
  },
  {
    name: 'extract_cfdi_by_accountant',
    description:
      'Requests extraction of CFDI for all clients of an accountant within a date range. This is an async operation.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        accountantId: {
          type: 'string',
          description: 'Internal accountant ID',
        },
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format',
        },
      },
      required: ['accountantId', 'startDate', 'endDate'],
    },
  },

  // Tax Reports
  {
    name: 'get_monthly_tax_report',
    description:
      'Retrieves the monthly tax report for a taxpayer. Includes ISR, IVA, and other tax calculations.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        rfc: {
          type: 'string',
          description: 'Taxpayer RFC',
        },
        year: {
          type: 'string',
          description: 'Year (e.g., "2025")',
        },
        month: {
          type: 'string',
          description: 'Month in MM format (e.g., "04" for April)',
        },
      },
      required: ['rfc', 'year', 'month'],
    },
  },

  // Contacts
  {
    name: 'get_contacts',
    description: 'Retrieves the contacts associated with a taxpayer.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        rfc: {
          type: 'string',
          description: 'Taxpayer RFC',
        },
      },
      required: ['rfc'],
    },
  },

  // Invoices / Documents
  {
    name: 'get_invoices',
    description:
      'Retrieves invoices/documents for a taxpayer with optional filters. Supports filtering by type, date, status, category, and more.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        rfc: {
          type: 'string',
          description: 'Taxpayer RFC',
        },
        type: {
          type: 'string',
          description: 'Invoice type filter',
        },
        year: {
          type: 'string',
          description: 'Filter by year',
        },
        month: {
          type: 'string',
          description: 'Filter by month',
        },
        status: {
          type: 'string',
          description: 'Invoice status filter',
        },
        category: {
          type: 'string',
          description: 'Category filter',
        },
        search: {
          type: 'string',
          description: 'Search term',
        },
        issuer: {
          type: 'string',
          description: 'Filter by issuer',
        },
        paymentType: {
          type: 'string',
          description: 'Payment type filter',
        },
        paymentWay: {
          type: 'string',
          description: 'Payment method filter',
        },
      },
      required: ['rfc'],
    },
  },

  // Categories
  {
    name: 'get_categories',
    description: 'Retrieves all categories defined in Taxo for invoice classification.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },

  // Taxpayer Management
  {
    name: 'create_taxpayer',
    description:
      'Creates a new taxpayer under an accountant. Requires the RFC and CIEC (SAT password) to enable document extraction.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        accountantId: {
          type: 'string',
          description: 'Internal accountant ID',
        },
        rfc: {
          type: 'string',
          description: 'Taxpayer RFC',
        },
        ciec: {
          type: 'string',
          description: 'CIEC password for SAT access',
        },
      },
      required: ['accountantId', 'rfc', 'ciec'],
    },
  },
];

// ============================================
// Input Schemas
// ============================================

const rfcSchema = z.object({ rfc: z.string() });
const accountantIdSchema = z.object({ accountantId: z.string() });

const extractCfdiSchema = z.object({
  rfc: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  extractionType: z.enum(['all', 'issued', 'received']),
});

const extractCfdiAccountantSchema = z.object({
  accountantId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

const taxReportSchema = z.object({
  rfc: z.string(),
  year: z.string(),
  month: z.string(),
});

const getInvoicesSchema = z.object({
  rfc: z.string(),
  type: z.string().optional(),
  year: z.string().optional(),
  month: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  issuer: z.string().optional(),
  paymentType: z.string().optional(),
  paymentWay: z.string().optional(),
});

const createTaxpayerSchema = z.object({
  accountantId: z.string(),
  rfc: z.string(),
  ciec: z.string(),
});

// ============================================
// Server Factory
// ============================================

function createServer(client: TaxoMxApiClient): Server {
  const server = new Server(
    {
      name: 'taxo-mx-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: unknown;

      switch (name) {
        // Compliance Opinion
        case 'extract_compliance_opinion': {
          const input = rfcSchema.parse(args);
          result = await client.extractComplianceOpinionByRfc(input.rfc);
          break;
        }
        case 'extract_compliance_opinion_by_accountant': {
          const input = accountantIdSchema.parse(args);
          result = await client.extractComplianceOpinionByAccountant(input.accountantId);
          break;
        }
        case 'extract_compliance_opinion_all': {
          result = await client.extractComplianceOpinionAll();
          break;
        }
        case 'get_compliance_opinion': {
          const input = rfcSchema.parse(args);
          result = await client.getComplianceOpinion(input.rfc);
          break;
        }

        // Tax Status
        case 'extract_tax_status': {
          const input = rfcSchema.parse(args);
          result = await client.extractTaxStatusByRfc(input.rfc);
          break;
        }
        case 'extract_tax_status_by_accountant': {
          const input = accountantIdSchema.parse(args);
          result = await client.extractTaxStatusByAccountant(input.accountantId);
          break;
        }
        case 'extract_tax_status_all': {
          result = await client.extractTaxStatusAll();
          break;
        }
        case 'get_tax_status': {
          const input = rfcSchema.parse(args);
          result = await client.getTaxStatus(input.rfc);
          break;
        }

        // CFDI
        case 'extract_cfdi': {
          const input = extractCfdiSchema.parse(args);
          result = await client.extractCfdiByRfc(input);
          break;
        }
        case 'extract_cfdi_by_accountant': {
          const input = extractCfdiAccountantSchema.parse(args);
          result = await client.extractCfdiByAccountant(input);
          break;
        }

        // Tax Reports
        case 'get_monthly_tax_report': {
          const input = taxReportSchema.parse(args);
          result = await client.getMonthlyTaxReport(input.rfc, input.year, input.month);
          break;
        }

        // Contacts
        case 'get_contacts': {
          const input = rfcSchema.parse(args);
          result = await client.getContacts(input.rfc);
          break;
        }

        // Invoices
        case 'get_invoices': {
          const input = getInvoicesSchema.parse(args);
          const { rfc, ...filters } = input;
          result = await client.getInvoices(rfc, filters);
          break;
        }

        // Categories
        case 'get_categories': {
          result = await client.getCategories();
          break;
        }

        // Taxpayer Management
        case 'create_taxpayer': {
          const input = createTaxpayerSchema.parse(args);
          result = await client.createTaxpayer(
            input.accountantId,
            input.rfc,
            input.ciec
          );
          break;
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof TaxoMxApiError) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  error: true,
                  statusCode: error.statusCode,
                  message: error.message,
                  details: error.details,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      if (error instanceof Error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  error: true,
                  message: error.message,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                error: true,
                message: 'An unknown error occurred',
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

// ============================================
// HTTP Server (Stateless Mode)
// ============================================

async function main() {
  const port = getPort();
  const baseUrl = getBaseUrl();

  const app = express();

  // CORS middleware
  app.use((req: Request, res: Response, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', server: 'taxo-mx-mcp', version: '1.0.0' });
  });

  // MCP endpoint handler - stateless mode
  const handleMcpRequest = async (req: Request, res: Response, pathToken?: string) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed. Use POST for MCP requests.' });
      return;
    }

    // Token from URL path takes priority, then Authorization header
    let token = pathToken;
    if (!token) {
      const authHeader = req.headers['authorization'] as string;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      res.status(401).json({
        error: 'Authentication required',
        hint: 'Provide token in URL path (/mcp/YOUR_TOKEN) or Authorization: Bearer header',
      });
      return;
    }

    // Create fresh transport and server for each request (stateless mode)
    const client = new TaxoMxApiClient({ token });
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless mode
    });

    const server = createServer(client);
    await server.connect(transport);

    await transport.handleRequest(req, res);

    // Clean up after request completes
    await transport.close();
  };

  // MCP endpoint with token in URL path
  app.all('/mcp/:token', async (req: Request, res: Response) => {
    await handleMcpRequest(req, res, req.params.token);
  });

  // MCP endpoint with header auth
  app.all('/mcp', async (req: Request, res: Response) => {
    await handleMcpRequest(req, res);
  });

  app.listen(port, () => {
    console.log(`Taxo MX MCP Server running on ${baseUrl} (stateless mode)`);
    console.log(`MCP endpoint: ${baseUrl}/mcp`);
    console.log(`Health check: ${baseUrl}/health`);
    console.log('');
    console.log('Provide token via Authorization: Bearer header or URL path (/mcp/YOUR_TOKEN)');
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
