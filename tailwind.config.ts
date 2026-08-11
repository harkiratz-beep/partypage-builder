import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm, family-friendly base. Themes override --accent at runtime.
        page:    '#faf7f2',
        surface: '#ffffff',
        ink:     '#1f1b16',
        muted:   '#6f665c',
        line:    '#e7e0d6',
        accent:  'var(--accent)',
      },
      maxWidth: {
        shell: '520px',
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
};

export default config;
