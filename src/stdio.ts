#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { TaxoMxApiClient, TaxoMxApiError } from './api/client.js';

// Parse command line arguments
function getToken(): string {
  const args = process.argv.slice(2);

  // Check for --token argument
  const tokenIndex = args.indexOf('--token');
  if (tokenIndex !== -1 && args[tokenIndex + 1]) {
    return args[tokenIndex + 1];
  }

  // Check environment variable
  if (process.env.TAXO_MX_TOKEN) {
    return process.env.TAXO_MX_TOKEN;
  }

  console.error('Error: Taxo MX token required');
  console.error('Provide via --token argument or TAXO_MX_TOKEN environment variable');
  process.exit(1);
}

// Tool definitions (same as HTTP server)
const TOOLS = [
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
      },
      required: ['rfc'],
    },
  },
  {
    name: 'get_categories',
    description: 'Retrieves all categories defined in Taxo for invoice classification.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
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

// Input schemas
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
});

const createTaxpayerSchema = z.object({
  accountantId: z.string(),
  rfc: z.string(),
  ciec: z.string(),
});

async function main() {
  const token = getToken();
  const client = new TaxoMxApiClient({ token });

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
        case 'get_monthly_tax_report': {
          const input = taxReportSchema.parse(args);
          result = await client.getMonthlyTaxReport(input.rfc, input.year, input.month);
          break;
        }
        case 'get_contacts': {
          const input = rfcSchema.parse(args);
          result = await client.getContacts(input.rfc);
          break;
        }
        case 'get_invoices': {
          const input = getInvoicesSchema.parse(args);
          const { rfc, ...filters } = input;
          result = await client.getInvoices(rfc, filters);
          break;
        }
        case 'get_categories': {
          result = await client.getCategories();
          break;
        }
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

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
