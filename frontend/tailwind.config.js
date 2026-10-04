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
        space: {
          950: '#030712',
          900: '#050B18',
          850: '#071226',
          800: '#0e1a38',
          700: '#1e2b48',
          600: '#2b3b5e',
        },
        nasa: {
          blue: '#0b3d91',
          red: '#fc3d21',
          cyan: '#38BDF8',
          violet: '#8B5CF6',
          highlight: '#E0F2FE',
          amber: '#ffaa00',
          emerald: '#00e676',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        tight: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        accent: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
}
