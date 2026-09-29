/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "umraniyesanayisitesi.com",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "adjjzjojyowyqwkjmane.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "ugnyldayssftqvpoyywm.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
