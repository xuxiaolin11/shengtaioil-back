import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#071A30',
          900: '#0B2340',
          800: '#123F73',
          700: '#1B5D94'
        },
        mist: '#EDF3F9',
        surface: '#F5F9FD',
        ink: '#102842',
        muted: '#5D6F84',
        duty: '#B12228',
        honor: '#D7B77B'
      },
      fontFamily: {
        sans: ['PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', 'sans-serif'],
        serif: ['STSong', 'Songti SC', 'Noto Serif SC', 'serif']
      }
    }
  },
  plugins: [tailwindcssAnimate]
}
