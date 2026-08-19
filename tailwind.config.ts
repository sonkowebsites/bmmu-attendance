import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bmmu: {
          green: '#1C8A54',
          'green-dark': '#0F5C38',
          'green-deep': '#0A2E1F',
          black: '#121212',
          cream: '#F7F5EF',
          gold: '#C7A24A'
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif']
      },
      backgroundImage: {
        dome: "url('/dome-motif.svg')"
      }
    }
  },
  plugins: []
};

export default config;
