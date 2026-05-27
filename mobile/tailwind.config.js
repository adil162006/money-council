/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F5C518',
          dark: '#D4A80E',
          light: '#FDF3C0',
          pale: '#FFFBEA',
        },
        neutral: {
          900: '#1C1A14',
          700: '#3D3A30',
          500: '#7A7668',
          300: '#C8C4B8',
          100: '#F5F3EE',
        },
        success: {
          DEFAULT: '#2E7D52',
          bg: '#E8F5EE',
        },
        danger: {
          DEFAULT: '#C0392B',
          bg: '#FDECEA',
        },
        warning: {
          DEFAULT: '#E67E22',
          bg: '#FEF3E7',
        },
        info: {
          DEFAULT: '#2980B9',
          bg: '#EAF4FB',
        },
      },
      fontFamily: {
        sans: ['DMSans_400Regular', 'sans-serif'],
        'sans-medium': ['DMSans_500Medium', 'sans-serif'],
        'sans-semibold': ['DMSans_600SemiBold', 'sans-serif'],
        'sans-bold': ['DMSans_700Bold', 'sans-serif'],
        mono: ['DMMono_400Regular', 'monospace'],
        'mono-medium': ['DMMono_500Medium', 'monospace'],
        'mono-semibold': ['DMMono_600SemiBold', 'monospace'],
        'mono-bold': ['DMMono_700Bold', 'monospace'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '20px',
      },
      boxShadow: {
        card: '0px 2px 8px rgba(28, 26, 20, 0.07)',
        modal: '0px -4px 20px rgba(28, 26, 20, 0.12)',
      }
    },
  },
  plugins: [],
}