module.exports = {
  content: ["./website/**/*.{html,js}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          // ...remaining color definitions
        },
        // ...other color extensions
        darkbg: '#0f172a',
        darkcard: '#1e293b',
      }
    }
  },
  plugins: [],
}