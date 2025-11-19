import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  
  // 可选：如果你需要部署到子目录，取消注释下面这行
  // basePath: '/your-subdirectory',
  
  // 可选：自定义导出目录（默认是 'out'）
  // distDir: 'dist',
};

export default nextConfig;
