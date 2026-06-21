/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@sincpro/mobile-ui/tailwind.preset")],
  content: [
    "./App.tsx",
    "./sincpro_mobile_distribution/**/*.{ts,tsx}",
    "./node_modules/@sincpro/mobile/**/*.js",
    "./node_modules/@sincpro/mobile-ui/**/*.js",
    "./node_modules/@sincpro/mobile-odoo/**/*.js",
  ],
  theme: { extend: {} },
};
