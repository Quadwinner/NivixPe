import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';

const navItems = [
  { label: 'Home', path: '/', icon: HomeIcon },
  { label: 'Automated Transfer', path: '/automated-transfer', icon: AutorenewIcon },
  { label: 'Liquidity Pools', path: '/liquidity-pools', icon: SwapHorizIcon },
  { label: 'Profile', path: '/profile', icon: PersonIcon },
  { label: 'KYC Verification', path: '/kyc', icon: VerifiedUserIcon },
];

const Header: React.FC = () => {
  const location = useLocation();
  const { connected } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-border shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 text-text hover:text-accent transition-colors"
          >
            <AccountBalanceWalletIcon className="w-6 h-6" />
            <span className="text-xl font-bold tracking-tight">NIVIX PAY</span>
          </Link>

          {/* Desktop Navigation - Only visible on large screens */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center mx-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-accent text-white'
                      : 'text-text-muted hover:text-text hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side: Wallet Button (desktop) and Menu Toggle (mobile) */}
          <div className="flex items-center space-x-2">
            {/* Desktop Wallet Button */}
            <div className="hidden lg:block">
              <WalletMultiButton />
            </div>
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={handleDrawerToggle}
              className="lg:hidden p-2 rounded-xl text-text hover:bg-gray-100 transition-colors focus-ring"
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

      {/* Mobile Menu - Only visible when mobileOpen is true */}
      {mobileOpen && (
        <>
          {/* Mobile Menu Overlay */}
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleDrawerToggle}
          />
          
          {/* Mobile Menu Sidebar */}
          <div className="lg:hidden fixed inset-y-0 right-0 z-50 w-80 bg-surface shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="text-lg font-bold text-text">Menu</span>
                <button
                  onClick={handleDrawerToggle}
                  className="p-2 rounded-xl text-text hover:bg-gray-100 transition-colors"
                  type="button"
                  aria-label="Close menu"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.label}
                        to={item.path}
                        onClick={handleDrawerToggle}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-accent text-white'
                            : 'text-text-muted hover:text-text hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Wallet Button */}
              <div className="p-4 border-t border-border">
                <WalletMultiButton />
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
