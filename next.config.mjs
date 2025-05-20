/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "prestigious-donkey-523.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "files.edgestore.dev",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/user-lists",
        destination: "/user-lists/subscriptions",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
