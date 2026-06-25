import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createKycProvider } from '../kyc/provider';
import {
  upsertKycSession,
  applyVendorResult,
  getKycStatus,
  findUserIdByVendorRef,
} from '../kyc/service';

const provider = createKycProvider();

// Authenticated KYC routes
export const kycRouter = Router();

// Start verification — returns a vendor session token for the frontend SDK.
kycRouter.post('/kyc/initiate', requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  const init = await provider.initiate(userId);
  await upsertKycSession(userId, init.vendor, init.vendorRef);
  return res.json({ sessionToken: init.sessionToken, vendor: init.vendor });
});

// Current KYC status (from the Postgres mirror).
kycRouter.get('/kyc/status', requireAuth, async (req, res) => {
  return res.json(await getKycStatus(req.user!.sub));
});

// Vendor webhook (no JWT — authenticated by signature).
export const kycWebhookRouter = Router();

kycWebhookRouter.post('/webhooks/kyc', async (req, res) => {
  const signature = req.header('x-signature');
  if (!provider.verifyWebhook(signature, JSON.stringify(req.body))) {
    return res.status(401).json({ error: 'bad_signature' });
  }

  const result = provider.parseWebhook(req.body);
  const userId = (await findUserIdByVendorRef(result.vendorRef)) ?? req.body.userId;
  if (!userId) return res.status(400).json({ error: 'unknown_applicant' });

  await applyVendorResult(userId, result, req.body.pii);
  return res.json({ ok: true });
});
