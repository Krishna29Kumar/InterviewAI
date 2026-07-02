/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--color-bg, #09090e)',
          card: 'var(--color-card, #131326)',
        },
        border: {
          DEFAULT: 'var(--color-border, rgba(255, 255, 255, 0.08))',
        },
        darkBg: '#09090e',
        darkCard: '#131326',
        darkBorder: 'rgba(255, 255, 255, 0.08)',
        neonBlue: '#00f0ff',
        neonPurple: '#ab22ff',
        accentPink: '#ff2a85',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-blue': '0 0 15px rgba(0, 240, 255, 0.3)',
        'neon-purple': '0 0 15px rgba(171, 34, 255, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-light': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
