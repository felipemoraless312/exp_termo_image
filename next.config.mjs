/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite probar desde el celular en la red local aunque cambie la IP de la PC (solo afecta a `next dev`).
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.*.*'],
  experimental: {
    // Las imágenes térmicas se suben con Server Actions (varias de hasta 20 MB cada una pasan por aquí).
    serverActions: { bodySizeLimit: '60mb' },
  },
}

export default nextConfig
