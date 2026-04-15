import React from 'react';

import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';

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
              <a
                href="/"
                className="p-2 rounded-lg transition-all duration-200"
                aria-label="NivixPe on GitHub"
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
                <GitHubIcon style={{ fontSize: '20px' }} />
              </a>
              <a
                href="/"
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
              <a
                href="/"
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
                <TwitterIcon style={{ fontSize: '20px' }} />
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
