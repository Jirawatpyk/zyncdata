import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

// TECH DEBT D1: unsafe-eval/unsafe-inline required by Next.js runtime.
// Monitor Next.js releases for nonce-based CSP support to remove these.
// @see Epic 2 Retro — priority: LOW
const isDev = process.env.NODE_ENV === 'development'

// Local Supabase URLs for development (CSP connect-src)
const localSupabaseUrls = isDev ? ' http://127.0.0.1:54321 http://localhost:54321 ws://127.0.0.1:54321 ws://localhost:54321' : ''

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.sentry.io${localSupabaseUrls}`,
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      ...(isDev
        ? [
            {
              protocol: 'http' as const,
              hostname: '127.0.0.1',
              port: '54321',
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
})
