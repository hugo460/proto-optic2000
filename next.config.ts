import type { NextConfig } from 'next';
import { legacyRedirects } from './src/lib/legacy-redirects';
const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  async headers() {
    return [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }] }];
  },
  async redirects() {
    return legacyRedirects.map(redirect => ({ ...redirect, permanent: false }));
  },
};
export default nextConfig;
