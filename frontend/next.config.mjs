/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Design-system app uses deliberate global class names; skip lint blocking the build.
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    // Konva (the Workplace floor-plan engine) optionally requires the native `canvas`
    // package for Node-side rendering. We only ever render Konva in the browser (dynamic
    // import with ssr:false), so tell webpack to ignore the optional dependency.
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },
};

export default nextConfig;
