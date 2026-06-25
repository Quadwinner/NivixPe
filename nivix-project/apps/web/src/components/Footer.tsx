import React from 'react';

import LinkedInIcon from '@mui/icons-material/LinkedIn';

const Footer: React.FC = () => {
  return (
    <footer className="mt-auto" style={{ backgroundColor: 'var(--color-ink-900)', color: 'var(--color-ink-300)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {/* Clean SVG logo — transparent, no square border */}
              <img 
                src="/assets/logos/logo-icon-teal.svg" 
                alt="NivixPe Bird Symbol" 
                className="h-8 w-8 object-contain"
              />
              <h3 className="text-xl font-black font-display text-white tracking-tight">
                NIVIX<span style={{ color: 'var(--color-teal-400)' }}>PE</span>
              </h3>
            </div>
            <p className="text-sm mb-2 font-body leading-relaxed" style={{ color: 'var(--color-ink-400)' }}>
              Blockchain-powered cross-border payments with near-zero fees and sub-2 second settlement.
            </p>
            <p className="text-sm font-body" style={{ color: 'var(--color-ink-500)' }}>
              © {new Date().getFullYear()} NivixPe Private Limited
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 font-display uppercase tracking-wider" style={{ fontSize: '11px', letterSpacing: '0.12em' }}>Quick Links</h4>
            <div className="space-y-2">
              <span className="block text-sm font-body" style={{ color: 'var(--color-ink-400)' }}>
                Documentation <span className="text-gray-500 text-xs">(Coming soon)</span>
              </span>
              <span className="block text-sm font-body" style={{ color: 'var(--color-ink-400)' }}>
                API Reference <span className="text-gray-500 text-xs">(Coming soon)</span>
              </span>
              <span className="block text-sm font-body" style={{ color: 'var(--color-ink-400)' }}>
                Support <span className="text-gray-500 text-xs">(Coming soon)</span>
              </span>
            </div>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 font-display uppercase tracking-wider" style={{ fontSize: '11px', letterSpacing: '0.12em' }}>Legal</h4>
            <div className="space-y-2">
              <span className="block text-sm font-body" style={{ color: 'var(--color-ink-400)' }}>
                Privacy Policy <span className="text-gray-500 text-xs">(Coming soon)</span>
              </span>
              <span className="block text-sm font-body" style={{ color: 'var(--color-ink-400)' }}>
                Terms of Service <span className="text-gray-500 text-xs">(Coming soon)</span>
              </span>
              <span className="block text-sm font-body" style={{ color: 'var(--color-ink-400)' }}>
                Compliance <span className="text-gray-500 text-xs">(Coming soon)</span>
              </span>
            </div>
          </div>
          
          {/* Social Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 font-display uppercase tracking-wider" style={{ fontSize: '11px', letterSpacing: '0.12em' }}>Connect With Us</h4>
            <div className="flex space-x-3">
              {/* X (Twitter) */}
              <a
                href="https://x.com/NivixPe_Pvt"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg transition-all duration-200"
                aria-label="NivixPe on X"
                style={{ color: 'var(--color-ink-400)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.backgroundColor = 'var(--color-ink-700)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-ink-400)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {/* X logo SVG */}
                <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="https://www.instagram.com/nivixpe/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg transition-all duration-200"
                aria-label="NivixPe on Instagram"
                style={{ color: 'var(--color-ink-400)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.backgroundColor = 'var(--color-ink-700)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-ink-400)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {/* Instagram logo SVG */}
                <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/nivixpe-pvt-ltd"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg transition-all duration-200"
                aria-label="NivixPe on LinkedIn"
                style={{ color: 'var(--color-ink-400)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.backgroundColor = 'var(--color-ink-700)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-ink-400)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <LinkedInIcon style={{ fontSize: '20px' }} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6" style={{ borderTop: '1px solid var(--color-ink-700)' }}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs font-body" style={{ color: 'var(--color-ink-500)' }}>
              Built on <span className="font-semibold" style={{ color: 'var(--color-teal-300)' }}>Solana</span> blockchain ·
              KYC powered by <span className="font-semibold text-white">Hyperledger Fabric</span>
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-display font-semibold" 
                style={{ backgroundColor: 'rgba(0, 196, 140, 0.15)', color: 'var(--color-success)', fontSize: '10px', letterSpacing: '0.04em' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                SOLANA MAINNET
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
