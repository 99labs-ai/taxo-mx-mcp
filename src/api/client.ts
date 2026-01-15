export class TaxoMxApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'TaxoMxApiError';
  }
}

export interface TaxoMxClientOptions {
  token: string;
  appBaseUrl?: string;
  demoBaseUrl?: string;
}

export class TaxoMxApiClient {
  private token: string;
  private appBaseUrl: string;
  private demoBaseUrl: string;

  constructor(options: TaxoMxClientOptions) {
    this.token = options.token;
    this.appBaseUrl = options.appBaseUrl || 'https://app.taxo.co';
    this.demoBaseUrl = options.demoBaseUrl || 'https://demo.taxo.co';
  }

  private async request<T>(
    baseUrl: string,
    path: string,
    options: {
      method?: 'GET' | 'POST';
      body?: unknown;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body } = options;
    const url = `${baseUrl}${path}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorDetails: unknown;
      try {
        errorDetails = await response.json();
      } catch {
        errorDetails = await response.text();
      }
      throw new TaxoMxApiError(
        response.status,
        `API request failed: ${response.statusText}`,
        errorDetails
      );
    }

    return response.json() as Promise<T>;
  }

  // ============================================
  // Opinión de Cumplimiento (Compliance Opinion)
  // ============================================

  async extractComplianceOpinionByRfc(rfc: string): Promise<unknown> {
    return this.request(this.appBaseUrl, '/api/extractions/oc/client', {
      method: 'POST',
      body: { rfc },
    });
  }

  async extractComplianceOpinionByAccountant(accountantId: string): Promise<unknown> {
    return this.request(this.appBaseUrl, '/api/extractions/oc/accountant', {
      method: 'POST',
      body: { accountant_id: accountantId },
    });
  }

  async extractComplianceOpinionAll(): Promise<unknown> {
    return this.request(this.appBaseUrl, '/api/extractions/oc/extract-all', {
      method: 'POST',
    });
  }

  async getComplianceOpinion(rfc: string): Promise<unknown> {
    return this.request(this.appBaseUrl, `/api/extractions/oc/client/${rfc}`);
  }

  // ============================================
  // Constancia de Situación Fiscal (Tax Status Certificate)
  // ============================================

  async extractTaxStatusByRfc(rfc: string): Promise<unknown> {
    return this.request(this.appBaseUrl, '/api/extractions/csf/client', {
      method: 'POST',
      body: { rfc },
    });
  }

  async extractTaxStatusByAccountant(accountantId: string): Promise<unknown> {
    return this.request(this.appBaseUrl, '/api/extractions/csf/accountant', {
      method: 'POST',
      body: { accountant_id: accountantId },
    });
  }

  async extractTaxStatusAll(): Promise<unknown> {
    return this.request(this.appBaseUrl, '/api/extractions/csf/extract-all', {
      method: 'POST',
    });
  }

  async getTaxStatus(rfc: string): Promise<unknown> {
    return this.request(this.appBaseUrl, `/api/extractions/csf/client/${rfc}`);
  }

  // ============================================
  // CFDI (Electronic Invoices)
  // ============================================

  async extractCfdiByRfc(params: {
    rfc: string;
    startDate: string;
    endDate: string;
    extractionType: 'all' | 'issued' | 'received';
  }): Promise<unknown> {
    return this.request(this.appBaseUrl, '/api/extractions/cfdi/client', {
      method: 'POST',
      body: {
        rfc: params.rfc,
        start_date: params.startDate,
        end_date: params.endDate,
        extraction_type: params.extractionType,
      },
    });
  }

  async extractCfdiByAccountant(params: {
    accountantId: string;
    startDate: string;
    endDate: string;
  }): Promise<unknown> {
    return this.request(this.appBaseUrl, '/api/extractions/cfdi/accountant', {
      method: 'POST',
      body: {
        accountant_id: params.accountantId,
        start_date: params.startDate,
        end_date: params.endDate,
      },
    });
  }

  // ============================================
  // Tax Reports
  // ============================================

  async getMonthlyTaxReport(rfc: string, year: string, month: string): Promise<unknown> {
    return this.request(
      this.demoBaseUrl,
      `/api/v1/tax-reports/monthly/${rfc}/${year}/${month}`
    );
  }

  // ============================================
  // Contacts
  // ============================================

  async getContacts(rfc: string): Promise<unknown> {
    return this.request(this.demoBaseUrl, `/api/v1/contacts/${rfc}`);
  }

  // ============================================
  // Invoices / Documents
  // ============================================

  async getInvoices(
    rfc: string,
    filters?: {
      type?: string;
      year?: string;
      month?: string;
      status?: string;
      search?: string;
      category?: string;
      dates?: string;
      issuer?: string;
      paymentType?: string;
      paymentWay?: string;
    }
  ): Promise<unknown> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const query = params.toString();
    const path = `/api/v1/invoices/${rfc}${query ? `?${query}` : ''}`;
    return this.request(this.demoBaseUrl, path);
  }

  // ============================================
  // Categories
  // ============================================

  async getCategories(): Promise<unknown> {
    return this.request(this.demoBaseUrl, '/api/categorization/categories');
  }

  // ============================================
  // Taxpayer Management
  // ============================================

  async createTaxpayer(
    accountantId: string,
    rfc: string,
    ciec: string
  ): Promise<unknown> {
    return this.request(
      this.appBaseUrl,
      `/api/v1/accountant/${accountantId}/clients`,
      {
        method: 'POST',
        body: { rfc, ciec },
      }
    );
  }
}
