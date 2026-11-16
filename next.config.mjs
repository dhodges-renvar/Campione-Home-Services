/** @type {import('next').NextConfig} */
const build = (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7);
const built = new Date().toISOString().slice(0, 16).replace('T', ' ');

export default {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_BUILD: build, NEXT_PUBLIC_BUILT_AT: built },
  async headers() {
    return [
      {
        // pages revalidate every load, so a new deploy shows up without a hard refresh
        source: '/((?!_next/static|icon-|manifest).*)',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-cache, must-revalidate' },
        ],
      },
      {
        // hashed build assets can cache forever — their names change every deploy
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};
