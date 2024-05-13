import jsrsasign, { hextob64 } from 'jsrsasign'

//
export const sha512HashAndSign = (verifiableData: string, privateKey: string) => {
  // Create a SHA-512 hash of the data
  const hashedData = jsrsasign.KJUR.crypto.Util.sha512(verifiableData)

  // Prepare the signature with RSA and PSS padding
  const sig = new jsrsasign.KJUR.crypto.Signature({
    alg: 'SHA512withRSAandMGF1',
    // @ts-expect-error
    prov: 'cryptojs/jsrsa'
  })

  // Initialize the signature object with the private key
  sig.init(privateKey)

  // Provide the hashed data to the signature object
  sig.updateString(hashedData)
  // sig.updateString(verifiableData)

  // Generate the signature in base64 format
  const signatureHex = sig.sign()
  const signatureBase64 = hextob64(signatureHex)
  return signatureBase64
}
