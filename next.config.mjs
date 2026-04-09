/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Vercel 배포 시 ESLint 에러 무시
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Vercel 배포 시 TypeScript 에러 무시
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
