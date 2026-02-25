import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#0095f6',
      },
    },
  },
  plugins: [],
};

export default config;
