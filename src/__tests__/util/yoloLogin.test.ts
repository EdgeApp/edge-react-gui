import { hasYoloAccountLogin, makeYoloOtpOptions } from '../../util/yoloLogin'

describe('makeYoloOtpOptions', () => {
  it('should ignore a missing key', () => {
    expect(makeYoloOtpOptions(null)).toEqual({})
    expect(makeYoloOtpOptions(undefined)).toEqual({})
  })

  it('should ignore a blank key', () => {
    expect(makeYoloOtpOptions('')).toEqual({})
    expect(makeYoloOtpOptions('   ')).toEqual({})
    expect(makeYoloOtpOptions('\n\t')).toEqual({})
  })

  it('should pass through a base32 secret', () => {
    expect(makeYoloOtpOptions('JBSWY3DPEHPK3PXP')).toEqual({
      otpKey: 'JBSWY3DPEHPK3PXP'
    })
  })

  it('should accept a lower-case or padded secret', () => {
    expect(makeYoloOtpOptions('jbswy3dpehpk3pxp')).toEqual({
      otpKey: 'jbswy3dpehpk3pxp'
    })
    expect(makeYoloOtpOptions('JBSWY3DPEHPK3PXP====')).toEqual({
      otpKey: 'JBSWY3DPEHPK3PXP===='
    })
  })

  it('should strip the spaces an authenticator app displays', () => {
    expect(makeYoloOtpOptions(' JBSW Y3DP EHPK 3PXP ')).toEqual({
      otpKey: 'JBSWY3DPEHPK3PXP'
    })
  })

  it('should treat a 6-digit value as a generated code', () => {
    expect(makeYoloOtpOptions('123456')).toEqual({ otp: '123456' })
    expect(makeYoloOtpOptions('123 456')).toEqual({ otp: '123456' })
  })

  it('should throw on a key that is not base32', () => {
    expect(() => makeYoloOtpOptions('not-base32!')).toThrow(/YOLO_OTP_KEY/)
  })

  it('should throw on a truncated key', () => {
    expect(() => makeYoloOtpOptions('JBSWY3DPEHPK3PX')).toThrow(/YOLO_OTP_KEY/)
  })
})

describe('hasYoloAccountLogin', () => {
  const env = (
    YOLO_USERNAME: string | null,
    YOLO_PASSWORD: string | null,
    YOLO_PIN: string | null
  ): {
    YOLO_USERNAME: string | null
    YOLO_PASSWORD: string | null
    YOLO_PIN: string | null
  } => ({
    YOLO_USERNAME,
    YOLO_PASSWORD,
    YOLO_PIN
  })

  it('should be false with nothing configured', () => {
    expect(hasYoloAccountLogin(env(null, null, null))).toBe(false)
  })

  it('should be true for a PIN alone, for light accounts', () => {
    expect(hasYoloAccountLogin(env(null, null, '1234'))).toBe(true)
    expect(hasYoloAccountLogin(env(null, 'pw', '1234'))).toBe(true)
  })

  it('should be false for a password with no username to go with it', () => {
    expect(hasYoloAccountLogin(env(null, 'pw', null))).toBe(false)
  })

  it('should be false with a username but no credential', () => {
    expect(hasYoloAccountLogin(env('bob', null, null))).toBe(false)
  })

  it('should treat blank credentials as absent', () => {
    expect(hasYoloAccountLogin(env('bob', '', ''))).toBe(false)
    expect(hasYoloAccountLogin(env(null, null, ''))).toBe(false)
  })

  it('should be true for a username plus a password', () => {
    expect(hasYoloAccountLogin(env('bob', 'pw', null))).toBe(true)
  })

  it('should be true for a username plus a PIN', () => {
    expect(hasYoloAccountLogin(env('bob', null, '1234'))).toBe(true)
  })
})
