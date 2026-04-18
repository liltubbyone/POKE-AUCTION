/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['raw.githubusercontent.com', 'assets.pokemon.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
}

export default nextConfig
