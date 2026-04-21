import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

// BETA: 4 publicly accessible pages
const navItems = [
  { label: 'Home', path: '/', icon: HomeIcon },
  { label: 'KYC Verification', path: '/kyc', icon: VerifiedUserIcon },
  { label: 'Transfer Funds', path: '/automated-transfer', icon: AutorenewIcon },
  { label: 'Profile', path: '/profile', icon: PersonIcon },
];

// POST-BETA nav items (re-enable after beta phase):
// { label: 'Liquidity Pools', path: '/liquidity-pools', icon: SwapHorizIcon },
// { label: 'KYC Admin', path: '/kyc-admin', icon: AdminPanelSettingsIcon },
// { label: 'Admin Dashboard', path: '/admin-dashboard', icon: DashboardIcon },


const Header: React.FC = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: '#E5E8EF' }}>
      <nav className="w-full px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo — NivixPe brand */}
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-85 transition-opacity flex-shrink-0 relative z-10"
          >
            {/* Navy bird logo — transparent SVG on white background */}
            <img 
              src="/assets/logos/logo-icon-navy.svg" 
              alt="NivixPe Bird Symbol" 
              className="h-9 w-9 object-contain"
            />
            {/* Brand wordmark — dark on light bg */}
            <span className="font-display text-xl font-black tracking-tight" style={{ color: 'var(--color-navy-600)' }}>
              NIVIX<span style={{ color: 'var(--color-teal-500)' }}>PE</span>
            </span>
          </Link>

          {/* Desktop Navigation (Center) */}
          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 z-10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium font-display transition-all whitespace-nowrap`}
                  style={isActive ? {
                    backgroundColor: 'rgba(10,65,116,0.08)',
                    color: 'var(--color-navy-600)',
                    fontWeight: 700,
                  } : {
                    color: 'var(--color-ink-600)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--color-navy-600)';
                      e.currentTarget.style.backgroundColor = 'rgba(10,65,116,0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--color-ink-600)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon className="w-4 h-4" style={{ fontSize: '16px' }} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop Wallet Button (Right) */}
          <div className="hidden lg:flex items-center relative z-10">
            <WalletMultiButton />
          </div>

          {/* Mobile: compact wallet button + hamburger */}
          <div className="lg:hidden flex items-center gap-1">
            {/* Scaled-down wallet button for mobile */}
            <div style={{ transform: 'scale(0.78)', transformOrigin: 'right center' }} className="flex-shrink-0">
              <WalletMultiButton />
            </div>
            <button
              onClick={handleDrawerToggle}
              className="p-2 rounded-lg transition-colors flex-shrink-0"
              style={{ color: 'var(--color-ink-700)' }}
              aria-label="Toggle menu"
              type="button"
            >
              {mobileOpen ? (
                <CloseIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <>
          {/* Overlay */}
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleDrawerToggle}
          />
          
          {/* Sidebar */}
          <div className="lg:hidden fixed inset-y-0 right-0 z-50 w-80 shadow-xl transform transition-transform duration-300 ease-in-out bg-white"
            style={{ borderLeft: '1px solid #E5E8EF' }}
          >
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#E5E8EF' }}>
                <div className="flex items-center gap-2">
                  <img 
                    src="/assets/logos/logo-icon-navy.svg" 
                    alt="NivixPe Bird Symbol" 
                    className="h-8 w-8 object-contain"
                  />
                  <span className="text-xl font-black font-display" style={{ color: 'var(--color-navy-600)' }}>
                    NIVIX<span style={{ color: 'var(--color-teal-500)' }}>PE</span>
                  </span>
                </div>
                <button
                  onClick={handleDrawerToggle}
                  className="p-2 rounded-xl transition-colors"
                  style={{ color: 'var(--color-ink-500)' }}
                  type="button"
                  aria-label="Close menu"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.label}
                        to={item.path}
                        onClick={handleDrawerToggle}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium font-display transition-all duration-200 ${
                          isActive
                            ? 'text-white'
                            : ''
                        }`}
                        style={isActive ? {
                          backgroundColor: 'var(--color-navy-600)',
                        } : {
                          color: 'var(--color-ink-500)',
                        }}
                      >
                        <Icon className="w-5 h-5" style={{ fontSize: '20px' }} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Footer - Removed duplicate wallet button */}
              <div className="p-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
                <p className="text-xs text-center" style={{ color: 'var(--color-ink-500)' }}>
                  © {new Date().getFullYear()} NivixPe
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
