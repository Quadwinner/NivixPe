import React, { useState } from 'react';
import {
  Check,
  Copy,
  Clock,
  Download,
  Printer,
  Share2,
  Home,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface RecipientDetails {
  name: string;
  accountNumber: string;
  ifscCode: string;
  email: string;
  phone: string;
}

interface TransferReceipt {
  transactionId: string;
  timestamp: string;
  recipient: RecipientDetails;
  amount: number;
  processingTime: string;
  transactionHashes: {
    mint: string;
    burn: string;
  };
  payoutId: string;
  cashgramLink?: string;
  payoutProvider?: string;
  sessionId: string;
}

interface SuccessReceiptProps {
  receipt: TransferReceipt;
  onSendAnother: () => void;
  onGoHome: () => void;
}

const SuccessReceipt: React.FC<SuccessReceiptProps> = ({
  receipt,
  onSendAnother,
  onGoHome
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownloadReceipt = () => {
    const receiptData = {
      transferDetails: {
        transactionId: receipt.transactionId,
        timestamp: receipt.timestamp,
        amount: `${receipt.amount} USDC`,
        processingTime: receipt.processingTime,
        status: 'Completed'
      },
      recipient: {
        name: receipt.recipient.name,
        accountNumber: receipt.recipient.accountNumber,
        ifscCode: receipt.recipient.ifscCode,
        email: receipt.recipient.email,
        phone: receipt.recipient.phone
      },
      blockchain: {
        mintTransaction: receipt.transactionHashes.mint,
        burnTransaction: receipt.transactionHashes.burn,
        payoutId: receipt.payoutId,
        cashgramLink: receipt.cashgramLink || null,
        payoutProvider: receipt.payoutProvider || null,
        sessionId: receipt.sessionId
      },
      meta: {
        service: 'Nivix Automated Transfer',
        downloadedAt: new Date().toISOString(),
        version: '1.0'
      }
    };

    const jsonContent = JSON.stringify(receiptData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `nivix-transfer-receipt-${receipt.transactionId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Transfer Receipt - ${receipt.transactionId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .success { color: #4caf50; }
            .section { margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .label { font-weight: bold; }
            .value { font-family: monospace; }
            .divider { border-top: 1px solid #ccc; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Transfer Successful</h1>
            <h2 class="success">Nivix Automated Transfer</h2>
          </div>

          <div class="section">
            <h3>Transfer Details</h3>
            <div class="detail-row">
              <span class="label">Transaction ID:</span>
              <span class="value">${receipt.transactionId}</span>
            </div>
            <div class="detail-row">
              <span class="label">Amount Sent:</span>
              <span class="value">${receipt.amount} USDC</span>
            </div>
            <div class="detail-row">
              <span class="label">Processing Time:</span>
              <span class="value">${receipt.processingTime}</span>
            </div>
            <div class="detail-row">
              <span class="label">Timestamp:</span>
              <span class="value">${new Date(receipt.timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="section">
            <h3>Recipient Information</h3>
            <div class="detail-row">
              <span class="label">Name:</span>
              <span class="value">${receipt.recipient.name}</span>
            </div>
            <div class="detail-row">
              <span class="label">Account Number:</span>
              <span class="value">***${receipt.recipient.accountNumber.slice(-4)}</span>
            </div>
            <div class="detail-row">
              <span class="label">IFSC Code:</span>
              <span class="value">${receipt.recipient.ifscCode}</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="section">
            <h3>Blockchain Transactions</h3>
            <div class="detail-row">
              <span class="label">Mint TX:</span>
              <span class="value">${receipt.transactionHashes.mint}</span>
            </div>
            <div class="detail-row">
              <span class="label">Burn TX:</span>
              <span class="value">${receipt.transactionHashes.burn}</span>
            </div>
            <div class="detail-row">
              <span class="label">Payout ID:</span>
              <span class="value">${receipt.payoutId}</span>
            </div>
            ${receipt.cashgramLink ? `
            <div class="detail-row">
              <span class="label">Cashgram Link:</span>
              <span class="value">${receipt.cashgramLink}</span>
            </div>
            ` : ''}
          </div>

          <div class="section" style="text-align: center; margin-top: 40px;">
            <p style="color: #666;">Generated by Nivix Automated Transfer System</p>
            <p style="color: #666; font-size: 12px;">Printed on ${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Money Transfer Successful',
      text: `Successfully sent ${receipt.amount} USDC to ${receipt.recipient.name} via Nivix`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      handleCopy(window.location.href, 'URL');
    }
  };

  const SR_SH1 = '0 1px 2px rgba(4,33,64,.04), 0 1px 3px rgba(4,33,64,.06)';
  const SR_GRAD = 'linear-gradient(135deg, #0A4174 0%, #0C7075 100%)';

  const CopyRow: React.FC<{ label: string; value: string; copyKey: string; mono?: boolean }> = ({
    label,
    value,
    copyKey,
    mono = true,
  }) => (
    <div
      className="flex items-center justify-between gap-4 border-b py-3.5 last:border-b-0"
      style={{ borderColor: 'rgba(4,33,64,0.07)' }}
    >
      <span className="font-display shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
        {label}
      </span>
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`min-w-0 break-all text-right text-[13px] font-semibold text-ink-800 ${
            mono ? 'font-mono' : ''
          }`}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => handleCopy(value, copyKey)}
          aria-label={`Copy ${label}`}
          className="shrink-0 rounded-lg p-1.5 text-ink-400 outline-none transition-colors hover:bg-ink-50 hover:text-navy-600 focus-visible:ring-4 focus-visible:ring-[rgba(10,65,116,0.14)]"
        >
          {copied === copyKey ? (
            <Check size={14} strokeWidth={3} style={{ color: '#06845F' }} />
          ) : (
            <Copy size={14} />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {/* ── Success header ── */}
      <div className="mb-8 text-center">
        <span
          aria-hidden="true"
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-white"
          style={{
            background: 'linear-gradient(135deg, #00C48C 0%, #0F9688 100%)',
            boxShadow: '0 8px 24px rgba(0,196,140,0.28)',
          }}
        >
          <Check size={30} strokeWidth={3} />
        </span>
        <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink-900">
          Money sent
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-ink-500">
          {receipt.recipient.name} will receive the payout in their bank account. Keep this receipt
          for your records.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <span
            className="font-display inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{
              backgroundColor: 'rgba(0,196,140,0.10)',
              borderColor: 'rgba(0,196,140,0.28)',
              color: '#06845F',
            }}
          >
            <Check size={12} strokeWidth={3} />
            Completed
          </span>
          <span
            className="font-display inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{
              backgroundColor: 'rgba(12,112,117,0.09)',
              borderColor: 'rgba(12,112,117,0.24)',
              color: '#0C7075',
            }}
          >
            <Clock size={12} />
            {receipt.processingTime}
          </span>
        </div>
      </div>

      {/* ── Amount ── */}
      <div
        className="mb-6 rounded-2xl border p-6 text-center"
        style={{
          background: 'linear-gradient(180deg, rgba(225,245,245,0.55) 0%, #FFFFFF 100%)',
          borderColor: 'rgba(12,112,117,0.22)',
        }}
      >
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
          Amount sent
        </p>
        <p className="font-mono mt-2 text-[38px] font-bold leading-none text-teal-600">
          {receipt.amount.toFixed(2)}
        </p>
        <p className="font-display mt-2 text-[13px] font-semibold text-ink-500">
          to {receipt.recipient.name}
        </p>
        <p className="font-mono mt-1 text-[12px] text-ink-400">
          ••••{receipt.recipient.accountNumber.slice(-4)} · {receipt.recipient.ifscCode}
        </p>
      </div>

      {/* ── References ── */}
      <div
        className="mb-6 rounded-2xl border border-[rgba(4,33,64,0.08)] bg-white px-5 py-2"
        style={{ boxShadow: SR_SH1 }}
      >
        <CopyRow label="Transaction ID" value={receipt.transactionId} copyKey="txid" />
        <CopyRow label="Payout ID" value={receipt.payoutId} copyKey="payout" />
        <CopyRow label="Session" value={receipt.sessionId} copyKey="session" />
        {receipt.payoutProvider && (
          <CopyRow
            label="Provider"
            value={receipt.payoutProvider}
            copyKey="provider"
            mono={false}
          />
        )}
        <div
          className="flex items-center justify-between gap-4 border-b py-3.5 last:border-b-0"
          style={{ borderColor: 'rgba(4,33,64,0.07)' }}
        >
          <span className="font-display shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
            Completed
          </span>
          <span className="text-right text-[13px] font-semibold text-ink-800">
            {new Date(receipt.timestamp).toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── On-chain proof ── */}
      <div
        className="mb-6 rounded-2xl border border-[rgba(4,33,64,0.08)] bg-white p-5"
        style={{ boxShadow: SR_SH1 }}
      >
        <p className="font-display mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
          On-chain proof
        </p>

        <div className="space-y-3">
          {[
            { label: 'Mint transaction', hash: receipt.transactionHashes.mint },
            { label: 'Burn transaction', hash: receipt.transactionHashes.burn },
          ]
            .filter((item) => item.hash)
            .map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                style={{ backgroundColor: '#F4F6F9' }}
              >
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.1em] text-ink-400">
                    {item.label}
                  </p>
                  <p className="font-mono mt-0.5 truncate text-[12px] text-ink-700">
                    {item.hash.substring(0, 18)}…{item.hash.slice(-8)}
                  </p>
                </div>
                <a
                  href={`https://explorer.solana.com/tx/${item.hash}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-navy-600 outline-none transition-colors hover:bg-white focus-visible:ring-4 focus-visible:ring-[rgba(10,65,116,0.14)]"
                >
                  View
                  <ExternalLink size={12} />
                </a>
              </div>
            ))}
        </div>
      </div>

      {/* ── Cashgram ── */}
      {receipt.cashgramLink && (
        <a
          href={receipt.cashgramLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 flex items-center justify-between gap-3 rounded-2xl border p-4 outline-none transition-colors hover:bg-teal-50/40 focus-visible:ring-4 focus-visible:ring-[rgba(12,112,117,0.18)]"
          style={{ borderColor: 'rgba(12,112,117,0.24)' }}
        >
          <span className="text-[13px] font-semibold text-ink-800">
            Recipient claim link (Cashgram)
          </span>
          <ExternalLink size={15} className="shrink-0 text-teal-600" />
        </a>
      )}

      {/* ── Actions ── */}
      <div
        className="flex flex-col gap-3 border-t pt-7 sm:flex-row"
        style={{ borderColor: 'rgba(4,33,64,0.08)' }}
      >
        <button
          type="button"
          onClick={handleDownloadReceipt}
          className="font-display inline-flex h-[52px] items-center justify-center gap-2 rounded-xl border border-[rgba(4,33,64,0.14)] bg-white px-5 text-sm font-semibold text-ink-700 outline-none transition-colors hover:bg-ink-50 focus-visible:ring-4 focus-visible:ring-[rgba(10,65,116,0.14)]"
          style={{ boxShadow: SR_SH1 }}
        >
          <Download size={16} />
          Download
        </button>

        <button
          type="button"
          onClick={handlePrintReceipt}
          className="font-display inline-flex h-[52px] items-center justify-center gap-2 rounded-xl border border-[rgba(4,33,64,0.14)] bg-white px-5 text-sm font-semibold text-ink-700 outline-none transition-colors hover:bg-ink-50 focus-visible:ring-4 focus-visible:ring-[rgba(10,65,116,0.14)]"
          style={{ boxShadow: SR_SH1 }}
        >
          <Printer size={16} />
          Print
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="font-display inline-flex h-[52px] items-center justify-center gap-2 rounded-xl border border-[rgba(4,33,64,0.14)] bg-white px-5 text-sm font-semibold text-ink-700 outline-none transition-colors hover:bg-ink-50 focus-visible:ring-4 focus-visible:ring-[rgba(10,65,116,0.14)]"
          style={{ boxShadow: SR_SH1 }}
        >
          <Share2 size={16} />
          Share
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onGoHome}
          className="font-display inline-flex h-[52px] items-center justify-center gap-2 rounded-xl border border-[rgba(4,33,64,0.14)] bg-white px-6 text-sm font-semibold text-ink-700 outline-none transition-colors hover:bg-ink-50 focus-visible:ring-4 focus-visible:ring-[rgba(10,65,116,0.14)]"
          style={{ boxShadow: SR_SH1 }}
        >
          <Home size={16} />
          Back home
        </button>

        <button
          type="button"
          onClick={onSendAnother}
          className="font-display inline-flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white outline-none transition-all hover:-translate-y-px focus-visible:ring-4 focus-visible:ring-[rgba(10,65,116,0.24)]"
          style={{ background: SR_GRAD, boxShadow: '0 4px 14px rgba(10,65,116,0.24)' }}
        >
          Send another transfer
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
};

export default SuccessReceipt;
