/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true, serverExternalPackages: ['@napi-rs/canvas', 'pdfjs-dist', 'tesseract.js'] }
export default nextConfig
