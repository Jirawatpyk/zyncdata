import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib'

// Create a TOTP instance with required plugins for v13+
const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
})

/**
 * Generate a TOTP code from a secret.
 * Used for MFA verification in E2E tests.
 */
export async function generateTotpCode(secret: string): Promise<string> {
  return totp.generate({ secret })
}

/**
 * Verify a TOTP code against a secret.
 */
export async function verifyTotpCode(token: string, secret: string): Promise<boolean> {
  const result = await totp.verify(token, { secret })
  return result.valid
}

/**
 * Extract TOTP secret from an otpauth:// URI.
 * The QR code encodes a URI like: otpauth://totp/zyncdata:user@email.com?secret=XXX&issuer=zyncdata
 */
export function extractSecretFromUri(uri: string): string | null {
  const match = uri.match(/secret=([A-Z2-7]+)/i)
  return match ? match[1] : null
}
