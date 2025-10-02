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
        hostname: "fantribe.b-cdn.net",
      },
      {
        protocol: "https",
        hostname: "cdn.fantribe.io",
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
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
}

export default nextConfig
