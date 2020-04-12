# Fee Units

There are several ways to measure transaction size. Some include:

- Legacy size, which excludes the segwit portion.
- Virtual size, which is legacy size + segwit size / 4.
- Total size, which includes both the segwit and non-segwit portions.

These metrics will be the same for non-segwit transactions, but they will be different for segwit transactions. Plus, some systems use weight units which are 4x virtual size. This is a big problem, since many sources talk about fees per byte, but don't explain how those bytes are calculated.

For example, LTC transaction 262b585ea9215b70bee0a74b220f45f5a29eb38225c91d48eba3477f82a48a94 has:

- legacy size:  298 bytes
- segwit size:  431 bytes
- total size:   729 bytes
- virtual size: 406 bytes (rounded up from 405.75)
- 4x weight:   1624 bytes (rounded up from 1623)

## Ecosystem usage

### Full nodes

Miners care about the weight, since that's what limits block size.

The Bitcoin JSON-RPC protocol has an [`estimatesmartfee` method](https://bitcoin.org/en/developer-reference#estimatesmartfee). This returns BTC per kVB.

The ElectrumX protocol uses `estimatesmartfee` under the hood, so it is also in units of BTC per kVB.

### Blockchair

Blockchair reports the transaction total size for its "size" metric, and the 4x virtual size for its "weight" metric. It reports the fees as follows:

- "fee per kB" uses total size
- "fee per kWU" uses 4x virtual size
- "fee per kVB" uses virtual size
