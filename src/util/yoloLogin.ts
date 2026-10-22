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

/**
 * True when the YOLO settings would start an auto-login.
 *
 * The login scene owns the auto-login, so the router has to send us there
 * instead of the welcome carousel. A device with no login stash is exactly
 * the case `YOLO_OTP_KEY` exists for, and that is the case the carousel
 * would otherwise swallow.
 *
 * Without a username a PIN still logs into the device's first local user,
 * which is how light accounts sign in.
 */
export function hasYoloAccountLogin(env: {
  YOLO_USERNAME: string | null
  YOLO_PASSWORD: string | null
  YOLO_PIN: string | null
}): boolean {
  const { YOLO_USERNAME, YOLO_PASSWORD, YOLO_PIN } = env
  const hasPassword = YOLO_PASSWORD != null && YOLO_PASSWORD !== ''
  const hasPin = YOLO_PIN != null && YOLO_PIN !== ''

  // A password needs the username that goes with it:
  if (YOLO_USERNAME == null) return hasPin
  return hasPassword || hasPin
}
