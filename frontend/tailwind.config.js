/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        space: ['Space Mono', 'monospace'],
      },
      colors: {
        void: '#04060B',
        primary: '#0B0E14',
        cyan: '#06D6A0',
        amber: '#FFB627',
        rose: '#EF476F',
        violet: '#7B61FF',
        'accent-blue': '#118AB2',
      },
    },
  },
  plugins: [],
}
