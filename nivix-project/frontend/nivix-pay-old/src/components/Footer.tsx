import React from 'react';
import { Link } from 'react-router-dom';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';

const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <h3 className="text-lg font-bold text-text mb-3">NIVIX Protocol</h3>
            <p className="text-sm text-text-muted mb-2">
              A Hybrid Blockchain Payment Solution
            </p>
            <p className="text-sm text-text-muted">
              © {new Date().getFullYear()} Nivix Protocol
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-text mb-3">Quick Links</h4>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-text-muted hover:text-accent transition-colors">
              Documentation
              </a>
              <a href="#" className="block text-sm text-text-muted hover:text-accent transition-colors">
              API Reference
              </a>
              <a href="#" className="block text-sm text-text-muted hover:text-accent transition-colors">
              Support
              </a>
            </div>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-text mb-3">Legal</h4>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-text-muted hover:text-accent transition-colors">
              Privacy Policy
              </a>
              <a href="#" className="block text-sm text-text-muted hover:text-accent transition-colors">
              Terms of Service
              </a>
              <a href="#" className="block text-sm text-text-muted hover:text-accent transition-colors">
              Compliance
              </a>
            </div>
          </div>
          
          {/* Social Links */}
          <div>
            <h4 className="text-sm font-semibold text-text mb-3">Connect With Us</h4>
            <div className="flex space-x-3">
              <a
                href="#"
                className="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-gray-50 transition-all duration-200"
                aria-label="GitHub"
              >
                <GitHubIcon className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-gray-50 transition-all duration-200"
                aria-label="LinkedIn"
              >
                <LinkedInIcon className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-gray-50 transition-all duration-200"
                aria-label="Twitter"
              >
                <TwitterIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
