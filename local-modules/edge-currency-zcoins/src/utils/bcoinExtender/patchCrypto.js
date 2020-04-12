import { Buffer } from 'buffer'

import { assert } from 'chai'
import { nfkd } from 'unorm'

const SEED_SALT = Buffer.from('Bitcoin seed', 'ascii')

export const patchSecp256k1 = function (bcoin, secp256k1) {
  const privateKey = bcoin.hd.PrivateKey.prototype
  const publicKey = bcoin.hd.PublicKey.prototype

  publicKey.derive = async function (index, hardened) {
    assert.equal(typeof index, 'number')

    if (index >>> 0 !== index) {
      throw new Error('Index out of range.')
    }

    if (index & bcoin.hd.common.HARDENED || hardened) {
      throw new Error('Cannot derive hardened.')
    }

    if (this.depth >= 0xff) {
      throw new Error('Depth too high.')
    }

    const id = this.getID(index)
    const cache = bcoin.hd.common.cache.get(id)

    if (cache) return cache

    const bw = bcoin.utils.StaticWriter.pool(37)

    bw.writeBytes(this.publicKey)
    bw.writeU32BE(index)

    const data = bw.render()

    const hash = bcoin.crypto.digest.hmac('sha512', data, this.chainCode)
    const left = hash.slice(0, 32)
    const right = hash.slice(32, 64)

    let key
    try {
      const result = secp256k1.publicKeyTweakAdd(this.publicKey, left, true)
      if (typeof result.then === 'function') {
        key = await Promise.resolve(result)
        key = Buffer.from(key)
      } else {
        key = result
      }
    } catch (e) {
      return this.derive(index + 1)
    }

    if (this.fingerPrint === -1) {
      const fp = bcoin.crypto.digest.hash160(this.publicKey)
      this.fingerPrint = fp.readUInt32BE(0, true)
    }

    const child = new bcoin.hd.PublicKey()
    child.network = this.network
    child.depth = this.depth + 1
    child.parentFingerPrint = this.fingerPrint
    child.childIndex = index
    child.chainCode = right
    child.publicKey = key

    bcoin.hd.common.cache.set(id, child)

    return child
  }

  privateKey.derive = async function (index, hardened) {
    assert.equal(typeof index, 'number')

    if (index >>> 0 !== index) {
      throw new Error('Index out of range.')
    }

    if (this.depth >= 0xff) {
      throw new Error('Depth too high.')
    }

    if (hardened) {
      index |= bcoin.hd.common.HARDENED
      index >>>= 0
    }
    if (!this.publicKey) {
      const result = secp256k1.publicKeyCreate(this.privateKey, true)
      if (typeof result.then === 'function') {
        this.publicKey = await Promise.resolve(result)
        this.publicKey = Buffer.from(this.publicKey)
      } else {
        this.publicKey = result
      }
    }
    const id = this.getID(index)
    const cache = bcoin.hd.common.cache.get(id)

    if (cache) return cache

    const bw = bcoin.utils.StaticWriter.pool(37)

    if (index & bcoin.hd.common.HARDENED) {
      bw.writeU8(0)
      bw.writeBytes(this.privateKey)
      bw.writeU32BE(index)
    } else {
      bw.writeBytes(this.publicKey)
      bw.writeU32BE(index)
    }

    const data = bw.render()

    const hash = bcoin.crypto.digest.hmac('sha512', data, this.chainCode)
    const left = hash.slice(0, 32)
    const right = hash.slice(32, 64)

    let key
    try {
      const result = secp256k1.privateKeyTweakAdd(this.privateKey, left)
      if (typeof result.then === 'function') {
        key = await Promise.resolve(result)
        key = Buffer.from(key)
      } else {
        key = result
      }
    } catch (e) {
      return this.derive(index + 1)
    }

    if (this.fingerPrint === -1) {
      const fp = bcoin.crypto.digest.hash160(this.publicKey)
      this.fingerPrint = fp.readUInt32BE(0, true)
    }

    const child = new bcoin.hd.PrivateKey()
    child.network = this.network
    child.depth = this.depth + 1
    child.parentFingerPrint = this.fingerPrint
    child.childIndex = index
    child.chainCode = right
    child.privateKey = key
    const result = secp256k1.publicKeyCreate(key, true)
    if (typeof result.then === 'function') {
      child.publicKey = await Promise.resolve(result)
      child.publicKey = Buffer.from(child.publicKey)
    } else {
      child.publicKey = result
    }

    bcoin.hd.common.cache.set(id, child)

    return child
  }

  privateKey.toPublic = async function () {
    let key = this._hdPublicKey

    if (!key) {
      key = new bcoin.hd.PublicKey()
      key.network = this.network
      key.depth = this.depth
      key.parentFingerPrint = this.parentFingerPrint
      key.childIndex = this.childIndex
      key.chainCode = this.chainCode
      if (!this.publicKey) {
        const result = secp256k1.publicKeyCreate(this.privateKey, true)
        if (typeof result.then === 'function') {
          this.publicKey = await Promise.resolve(result)
          this.publicKey = Buffer.from(this.publicKey)
        } else {
          this.publicKey = result
        }
      }

      key.publicKey = this.publicKey
      this._hdPublicKey = key
    }

    return key
  }

  privateKey.xpubkey = async function () {
    const pubKey = await this.toPublic()
    return pubKey.xpubkey()
  }

  privateKey.fromReader = function (br, network) {
    const version = br.readU32BE()

    this.network = bcoin.network.fromPrivate(version, network)
    this.depth = br.readU8()
    this.parentFingerPrint = br.readU32BE()
    this.childIndex = br.readU32BE()
    this.chainCode = br.readBytes(32)
    assert(br.readU8() === 0)
    this.privateKey = br.readBytes(32)
    this.publicKey = null

    br.verifyChecksum()
    return this
  }

  privateKey.fromSeed = async function (seed, network) {
    assert(Buffer.isBuffer(seed))

    if (
      seed.length * 8 < bcoin.hd.common.MIN_ENTROPY ||
      seed.length * 8 > bcoin.hd.common.MAX_ENTROPY
    ) {
      throw new Error('Entropy not in range.')
    }

    const hash = bcoin.crypto.digest.hmac('sha512', seed, SEED_SALT)
    const left = hash.slice(0, 32)
    const right = hash.slice(32, 64)

    // Only a 1 in 2^127 chance of happening.
    if (!bcoin.crypto.secp256k1.privateKeyVerify(left)) {
      throw new Error('Master private key is invalid.')
    }

    this.network = bcoin.network.get(network)
    this.depth = 0
    this.parentFingerPrint = 0
    this.childIndex = 0
    this.chainCode = right
    this.privateKey = left
    const result = secp256k1.publicKeyCreate(this.privateKey, true)
    if (typeof result.then === 'function') {
      this.publicKey = await Promise.resolve(result)
      this.publicKey = Buffer.from(this.publicKey)
    } else {
      this.publicKey = result
    }

    return this
  }

  privateKey.derivePath = async function (path) {
    const indexes = bcoin.hd.common.parsePath(path, true)

    let key = this

    for (const index of indexes) {
      key = await key.derive(index)
    }

    return key
  }
}

export const patchPbkdf2 = function (bcoin, pbkdf2) {
  const privateKey = bcoin.hd.PrivateKey.prototype
  privateKey.fromMnemonic = async function (mnemonic, network) {
    const passphrase = mnemonic.passphrase

    const phrase = nfkd(mnemonic.getPhrase())
    const passwd = nfkd('mnemonic' + passphrase)

    let derived = await pbkdf2.deriveAsync(
      Buffer.from(phrase, 'utf8'),
      Buffer.from(passwd, 'utf8'),
      2048,
      64,
      'sha512'
    )
    derived = Buffer.from(derived)
    return this.fromSeed(derived, network)
  }
}
