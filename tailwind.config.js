/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.vue',
    './main.ts',
    './components/**/*.{vue,ts}',
    './services/**/*.{ts}',
    './types.ts'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

