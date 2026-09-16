import { base32 } from 'rfc4648'

export interface YoloOtpOptions {
  otp?: string
  otpKey?: string
}

/**
 * Turns the raw `YOLO_OTP_KEY` setting into the OTP fields that the
 * `EdgeContext` login methods accept.
 *
 * A missing or blank setting returns an empty object, so accounts without
 * 2FA keep logging in exactly as they did before. A bad setting throws,
 * since quietly dropping it would surface later as an `OtpError` that looks
 * like the account itself is broken.
 */
export function makeYoloOtpOptions(
  rawOtpKey: string | null | undefined
): YoloOtpOptions {
  if (rawOtpKey == null) return {}

  // Authenticator apps and our own login UI print secrets in space-separated
  // groups, so accept a key pasted in that form:
  const otpKey = rawOtpKey.replace(/\s/g, '')
  if (otpKey === '') return {}

  // A 6-digit value is a generated code, not the secret behind it. Base32 has
  // no digits below 2, so this can never collide with a real key:
  if (/^\d{6}$/.test(otpKey)) return { otp: otpKey }

  // The core base32-decodes the key deep inside the login request, where a
  // failure is hard to place. Decode it here to fail with the name attached:
  try {
    base32.parse(otpKey, { loose: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`YOLO_OTP_KEY is not a valid base32 secret: ${message}`)
  }

  return { otpKey }
}
