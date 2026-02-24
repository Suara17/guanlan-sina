/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'spin-slower': 'spin 30s linear infinite',
        'spin-reverse': 'spin 15s linear infinite reverse',
        'spin-counter': 'spin 25s linear infinite reverse',
        dash: 'dash 20s linear infinite',
      },
      keyframes: {
        dash: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animationDelay: {
        500: '500ms',
        1000: '1000ms',
        1500: '1500ms',
      },
    },
  },
  plugins: [],
}
