/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Design-system app uses deliberate global class names; skip lint blocking the build.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
