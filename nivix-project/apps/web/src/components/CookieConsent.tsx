import React, { useState, useEffect } from 'react';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-navy-900 text-white border-t border-navy-700 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-body text-center sm:text-left">
            We use analytics cookies to improve your experience.
          </p>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={handleAccept}
              className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white font-display font-semibold text-sm rounded-lg transition-colors"
            >
              Accept
            </button>
            <button
              onClick={handleDecline}
              className="px-6 py-2 border-2 border-white/20 hover:border-white/40 text-white font-display font-semibold text-sm rounded-lg transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
