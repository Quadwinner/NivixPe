import { config } from '../config';

export interface KycInitiateResult {
  sessionToken: string;
  vendorRef: string;
  vendor: string;
}

export interface KycVendorResult {
  vendorRef: string;
  status: 'approved' | 'rejected' | 'review';
  riskScore: number;
}

// Hosting/vendor-agnostic KYC. Swap implementations via config.kycVendor — the rest
// of the app only depends on this interface (Sumsub / HyperVerge adapters slot in later).
export interface KycProvider {
  name: string;
  initiate(userId: string): Promise<KycInitiateResult>;
  verifyWebhook(signature: string | undefined, rawBody: string): boolean;
  parseWebhook(body: any): KycVendorResult;
}

// Local/sandbox provider — no real vendor creds needed. Mimics a Sumsub-style flow
// so the full register -> KYC -> verified pipeline is testable end to end locally.
export class MockKycProvider implements KycProvider {
  name = 'mock';

  async initiate(userId: string): Promise<KycInitiateResult> {
    return {
      sessionToken: `mock-sess-${userId}`,
      vendorRef: `mock-${userId}`,
      vendor: this.name,
    };
  }

  verifyWebhook(): boolean {
    // Sandbox: accept all. The real adapter verifies an HMAC against config.kyc.webhookSecret.
    return true;
  }

  parseWebhook(body: any): KycVendorResult {
    return {
      vendorRef: body.vendorRef ?? `mock-${body.userId}`,
      status: body.status ?? 'approved',
      riskScore: typeof body.riskScore === 'number' ? body.riskScore : 20,
    };
  }
}

export function createKycProvider(): KycProvider {
  // Until real vendor credentials are wired, everything uses the sandbox mock.
  void config.kycVendor;
  return new MockKycProvider();
}
