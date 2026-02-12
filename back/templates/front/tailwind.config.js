/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      screens: {
        'full-list': '1200px',
      },
      colors: {
        primary: 'var(--custom-primary)',
        secondary: 'var(--custom-secondary)',
        tertiary: 'var(--custom-tertiary)',
        quaternary: '#F4F1EC',
        'secondary-nature': '#475B52',
        'light-gray': '#E2E8F0',
        success: 'var(--custom-success)',
        danger: 'var(--custom-danger)',
        disabled: '#94A3B8',
      },
      fontSize: {
        '2xs': '.625rem',
      },
    },
  },
  plugins: [],
};
