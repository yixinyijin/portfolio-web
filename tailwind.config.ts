import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { colors: { primary: { 50: '#f0f9ff', 500: '#0ea5e9', 600: '#0284c7' } } } },
  plugins: [],
}
export default config
