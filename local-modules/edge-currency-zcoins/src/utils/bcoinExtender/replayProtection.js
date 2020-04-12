export const patchTransaction = function (bcoin) {
  const txProto = bcoin.primitives.TX.prototype
  const signature = txProto.signature

  // Patch `signature` to recive `hashType` as either a number or a Fork Object
  // The fork object can have the following props (all are optional):
  // {
  //   SIGHASH_FORKID = 0x00,
  //   forcedMinVersion = 0,
  //   forkId = 0x00,
  //   type = null
  // }
  txProto.signature = function (index, prev, value, key, type, version) {
    if (typeof type === 'object') {
      const {
        SIGHASH_FORKID = 0x00,
        forcedMinVersion = 0,
        forkId = 0x00,
        type: forkedType = bcoin.script.hashType.ALL
      } = type
      type = forkedType | SIGHASH_FORKID | (forkId * 256)
      if (forcedMinVersion) version = forcedMinVersion
    }

    return signature.call(this, index, prev, value, key, type, version)
  }

  txProto.signatureHashV0 = function (index, prev, type) {
    if ((type & 0x1f) === bcoin.script.hashType.SINGLE) {
      // Bitcoind used to return 1 as an error code:
      // it ended up being treated like a hash.
      if (index >= this.outputs.length) {
        return Buffer.from(bcoin.utils.encoding.ONE_HASH)
      }
    }

    // Remove all code separators.
    prev = prev.removeSeparators()

    // Calculate buffer size.
    const size = this.hashSize(index, prev, type)
    const bw = bcoin.utils.StaticWriter.pool(size)

    bw.writeU32(this.version)

    // Serialize inputs.
    if (type & bcoin.script.hashType.ANYONECANPAY) {
      // Serialize only the current
      // input if ANYONECANPAY.
      const input = this.inputs[index]

      // Count.
      bw.writeVarint(1)

      // Outpoint.
      input.prevout.toWriter(bw)

      // Replace script with previous
      // output script if current index.
      bw.writeVarBytes(prev.toRaw())
      bw.writeU32(input.sequence)
    } else {
      bw.writeVarint(this.inputs.length)
      for (let i = 0; i < this.inputs.length; i++) {
        const input = this.inputs[i]

        // Outpoint.
        input.prevout.toWriter(bw)

        // Replace script with previous
        // output script if current index.
        if (i === index) {
          bw.writeVarBytes(prev.toRaw())
          bw.writeU32(input.sequence)
          continue
        }

        // Script is null.
        bw.writeVarint(0)

        // Sequences are 0 if NONE or SINGLE.
        switch (type & 0x1f) {
          case bcoin.script.hashType.NONE:
          case bcoin.script.hashType.SINGLE:
            bw.writeU32(0)
            break
          default:
            bw.writeU32(input.sequence)
            break
        }
      }
    }

    // Serialize outputs.
    switch (type & 0x1f) {
      case bcoin.script.hashType.NONE: {
        // No outputs if NONE.
        bw.writeVarint(0)
        break
      }
      case bcoin.script.hashType.SINGLE: {
        const output = this.outputs[index]

        // Drop all outputs after the
        // current input index if SINGLE.
        bw.writeVarint(index + 1)

        for (let i = 0; i < index; i++) {
          // Null all outputs not at
          // current input index.
          bw.writeI64(-1)
          bw.writeVarint(0)
        }

        // Regular serialization
        // at current input index.
        output.toWriter(bw)

        break
      }
      default: {
        // Regular output serialization if ALL.
        bw.writeVarint(this.outputs.length)
        for (const output of this.outputs) {
          output.toWriter(bw)
        }
        break
      }
    }

    bw.writeU32(this.locktime)

    // Append the hash type.
    bw.writeU32(type)

    const { serializers = {} } =
      this.network && bcoin.networks[this.network]
        ? bcoin.networks[this.network]
        : {}
    const sigHash = serializers.signatureHash
      ? serializers.signatureHash(bw.render())
      : bcoin.crypto.digest.hash256(bw.render())
    return sigHash
  }

  txProto.signatureHashV1 = function (index, prev, value, type) {
    const input = this.inputs[index]
    let prevouts = bcoin.utils.encoding.ZERO_HASH
    let sequences = bcoin.utils.encoding.ZERO_HASH
    let outputs = bcoin.utils.encoding.ZERO_HASH

    const { serializers = {} } =
      this.network && bcoin.networks[this.network]
        ? bcoin.networks[this.network]
        : {}
    if (!(type & bcoin.script.hashType.ANYONECANPAY)) {
      if (this._hashPrevouts) {
        prevouts = this._hashPrevouts
      } else {
        const bw = bcoin.utils.StaticWriter.pool(this.inputs.length * 36)

        for (const input of this.inputs) {
          input.prevout.toWriter(bw)
        }

        prevouts = serializers.signatureHash
          ? serializers.signatureHash(bw.render())
          : bcoin.crypto.digest.hash256(bw.render())

        if (!this.mutable) {
          this._hashPrevouts = prevouts
        }
      }
    }

    if (
      !(type & bcoin.script.hashType.ANYONECANPAY) &&
      (type & 0x1f) !== bcoin.script.hashType.SINGLE &&
      (type & 0x1f) !== bcoin.script.hashType.NONE
    ) {
      if (this._hashSequence) {
        sequences = this._hashSequence
      } else {
        const bw = bcoin.utils.StaticWriter.pool(this.inputs.length * 4)

        for (const input of this.inputs) {
          bw.writeU32(input.sequence)
        }

        sequences = serializers.signatureHash
          ? serializers.signatureHash(bw.render())
          : bcoin.crypto.digest.hash256(bw.render())

        if (!this.mutable) {
          this._hashSequence = sequences
        }
      }
    }

    if (
      (type & 0x1f) !== bcoin.script.hashType.SINGLE &&
      (type & 0x1f) !== bcoin.script.hashType.NONE
    ) {
      if (this._hashOutputs) {
        outputs = this._hashOutputs
      } else {
        let size = 0

        for (const output of this.outputs) {
          size += output.getSize()
        }

        const bw = bcoin.utils.StaticWriter.pool(size)

        for (const output of this.outputs) {
          output.toWriter(bw)
        }

        outputs = serializers.signatureHash
          ? serializers.signatureHash(bw.render())
          : bcoin.crypto.digest.hash256(bw.render())

        if (!this.mutable) {
          this._hashOutputs = outputs
        }
      }
    } else if ((type & 0x1f) === bcoin.script.hashType.SINGLE) {
      if (index < this.outputs.length) {
        const output = this.outputs[index]
        outputs = serializers.signatureHash
          ? serializers.signatureHash(output.toRaw())
          : bcoin.crypto.digest.hash256(output.toRaw())
      }
    }

    const size = 156 + prev.getVarSize()
    const bw = bcoin.utils.StaticWriter.pool(size)

    bw.writeU32(this.version)
    bw.writeBytes(prevouts)
    bw.writeBytes(sequences)
    bw.writeHash(input.prevout.hash)
    bw.writeU32(input.prevout.index)
    bw.writeVarBytes(prev.toRaw())
    bw.writeI64(value)
    bw.writeU32(input.sequence)
    bw.writeBytes(outputs)
    bw.writeU32(this.locktime)
    bw.writeU32(type)

    return serializers.signatureHash
      ? serializers.signatureHash(bw.render())
      : bcoin.crypto.digest.hash256(bw.render())
  }
}
