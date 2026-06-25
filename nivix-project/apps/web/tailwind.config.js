/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      /* ════════════════════════════════════════════
         NIVIXPE DESIGN TOKENS — Tailwind Layer
      ════════════════════════════════════════════ */
      colors: {
        /* Navy Blue Primary */
        navy: {
          50:  '#E8F0F8',
          100: '#C2D5ED',
          200: '#96B6E0',
          300: '#6A97D3',
          400: '#3A78C4',
          500: '#1A5FA3',
          600: '#0A4174', /* ★ Primary CTA */
          700: '#073155',
          800: '#042140',
          900: '#001D39',
        },
        /* Ocean Teal Secondary */
        teal: {
          50:  '#E1F5F5',
          100: '#B3E6E7',
          200: '#7DD0D3',
          300: '#44B9BE',
          400: '#0F9688',
          500: '#0C7075', /* ★ Secondary CTA / On-chain */
          600: '#094F54',
          700: '#072E33',
          800: '#041B1E',
          900: '#05161A',
        },
        /* Deep Blue Connector */
        deep: {
          200: '#7BBDE8',
          300: '#49769F',
          400: '#294D61',
          600: '#0F2A3A',
          900: '#040D14',
        },
        /* Ink Neutral */
        ink: {
          0:   '#FFFFFF',
          50:  '#F4F6F9',
          100: '#E8EBF1',
          200: '#CDD2DD',
          300: '#A6AEBB',
          400: '#78839A',
          500: '#56607A',
          600: '#3D4560',
          700: '#2A3148',
          800: '#1C2535',
          900: '#0A0E14',
          950: '#05070D',
        },
        /* Semantic Colors */
        success:  '#00C48C',
        warning:  '#FFB800',
        error:    '#FF4D4F',
        info:     '#7BBDE8',
        onchain:  '#0F9688',

        /* Backward compat aliases */
        background: '#F4F6F9',
        surface: '#FFFFFF',
        border: '#CDD2DD',
        accent: {
          DEFAULT: '#0A4174',
          50:  '#E8F0F8',
          100: '#C2D5ED',
          200: '#96B6E0',
          300: '#6A97D3',
          400: '#3A78C4',
          500: '#1A5FA3',
          600: '#0A4174',
          700: '#073155',
          800: '#042140',
          900: '#001D39',
        },
        text: {
          DEFAULT: '#1C2535',
          muted: '#56607A',
        },
      },
      fontFamily: {
        /* NivixPe Typography System */
        display: ['Sora', 'system-ui', 'sans-serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
        mono:    ['Space Mono', 'Fira Code', 'monospace'],
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-hero': ['52px', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-h1':   ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-h2':   ['24px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-h3':   ['18px', { lineHeight: '1.4', fontWeight: '500' }],
        'body-lg':      ['16px', { lineHeight: '1.75', fontWeight: '400' }],
        'body-default': ['14px', { lineHeight: '1.75', fontWeight: '400' }],
        'caption':      ['12px', { lineHeight: '1.5', fontWeight: '400' }],
        'label':        ['11px', { lineHeight: '1.2', letterSpacing: '0.12em', fontWeight: '600' }],
        'amount':       ['26px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
      },
      spacing: {
        /* Base-4 Spacing Scale */
        '1':  '4px',
        '2':  '8px',
        '3':  '12px',
        '4':  '16px',
        '5':  '20px',
        '6':  '24px',
        '8':  '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      borderRadius: {
        'xs':   '2px',
        'sm':   '4px',
        'md':   '8px',
        'lg':   '12px',
        'xl':   '16px',
        'pill': '999px',
        '2xl':  '24px',
      },
      boxShadow: {
        'soft':     '0 1px 3px 0 rgba(10, 14, 20, 0.08), 0 1px 2px 0 rgba(10, 14, 20, 0.04)',
        'md':       '0 4px 6px -1px rgba(10, 14, 20, 0.08), 0 2px 4px -1px rgba(10, 14, 20, 0.04)',
        'premium':  '0 4px 20px rgba(10, 65, 116, 0.08)',
        'card':     '0 1px 3px rgba(10, 14, 20, 0.05), 0 10px 30px rgba(10, 14, 20, 0.03)',
        'glow':     '0 0 20px rgba(10, 65, 116, 0.25)',
        'glow-teal':'0 0 20px rgba(12, 112, 117, 0.25)',
        'elevated': '0 8px 30px rgba(10, 14, 20, 0.12)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #001D39, #0A4174, #294D61, #0C7075, #0F9688)',
        'hero-gradient':  'linear-gradient(135deg, #001D39 0%, #0A4174 40%, #0C7075 100%)',
        'navy-gradient':  'linear-gradient(135deg, #0A4174, #073155)',
        'teal-gradient':  'linear-gradient(135deg, #0C7075, #0F9688)',
        'surface-gradient': 'linear-gradient(180deg, #F4F6F9 0%, #FFFFFF 100%)',
      },
      transitionDuration: {
        '200': '200ms',
      },
      screens: {
        'xs': '375px',
        'sm': '376px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      maxWidth: {
        'content': '1100px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      }
      addUtilities(newUtilities)
    }
  ],
}
