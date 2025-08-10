/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/bananamilk0909',
        destination: '/',
      },
    ]
  },
}

export default nextConfig