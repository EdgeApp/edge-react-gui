import { ethers } from 'ethers'
import { base32, base64 } from 'rfc4648'

/**
 * Sample WalletConnect requests for the developer scene, so the request
 * modal can be exercised without a dapp.
 *
 * Every request is built for the wallet that receives it, since the
 * plugins refuse requests for other accounts or chains. The contracts
 * are Ethereum mainnet ones, so an Ethereum wallet shows the most.
 */
export interface WcSample {
  title: string
  namespace: 'algorand' | 'eip155'
  /** Where WalletConnect would say the request came from. */
  dAppOrigin: string
  makePayload: (address: string, chainId: string) => WcSamplePayload
}

export interface WcSamplePayload {
  method: string
  params: unknown[]
}

const SAMPLE_ORIGIN = 'https://sample.example'

// Ethereum mainnet contracts:
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const STETH = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'
const UNI = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
const KYBER_ROUTER = '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5'
const UNISWAP_ROUTER = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'
const UNIVERSAL_ROUTER = '0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af'
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3'
const BURN = '0x000000000000000000000000000000000000dEaD'
const DELEGATEE = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

const HUNDRED_USDC = '100000000'
const MILLI_ETH = '1000000000000000'
const MIN_WETH_OUT = '30000000000000000'
const MAX_UINT160 = ethers.BigNumber.from(2).pow(160).sub(1).toString()

const tokenAbi = new ethers.utils.Interface([
  'function approve(address spender, uint256 amount)'
])
const kyberAbi = new ethers.utils.Interface([
  'function swap((address callTarget, address approveTarget, bytes targetData, (address srcToken, address dstToken, address[] srcReceivers, uint256[] srcAmounts, address[] feeReceivers, uint256[] feeAmounts, address dstReceiver, uint256 amount, uint256 minReturnAmount, uint256 flags, bytes permit) desc, bytes clientData) execution)'
])
const lidoAbi = new ethers.utils.Interface([
  'function submit(address _referral)'
])
const uniswapAbi = new ethers.utils.Interface([
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params)',
  'function multicall(uint256 deadline, bytes[] data)',
  'function unwrapWETH9(uint256 amountMinimum, address recipient)'
])

const nowSeconds = (): number => Math.floor(Date.now() / 1000)
const toHex = (text: string): string =>
  ethers.utils.hexlify(ethers.utils.toUtf8Bytes(text))

const transaction = (
  from: string,
  to: string,
  data: string,
  value?: string
): WcSamplePayload => ({
  method: 'eth_sendTransaction',
  params: [{ from, to, data, value }]
})

const typedData = (
  address: string,
  data: {
    types: Record<string, Array<{ name: string; type: string }>>
    primaryType: string
    domain: object
    message: object
  }
): WcSamplePayload => ({
  method: 'eth_signTypedData_v4',
  params: [address, JSON.stringify(data)]
})

const DOMAIN_TYPE = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' }
]

const signIn = (
  domain: string,
  address: string,
  chainId: string,
  statement?: string
): WcSamplePayload => {
  const lines = [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    ...(statement == null ? [''] : [statement, '']),
    `URI: https://${domain}`,
    'Version: 1',
    `Chain ID: ${chainId}`,
    'Nonce: 8f3c2a9b1e7d',
    `Issued At: ${new Date().toISOString()}`,
    `Expiration Time: ${new Date(Date.now() + 3600000).toISOString()}`
  ]
  return { method: 'personal_sign', params: [toHex(lines.join('\n')), address] }
}

export const wcSamples: WcSample[] = [
  {
    title: 'Send 0.001 ETH',
    namespace: 'eip155',
    dAppOrigin: SAMPLE_ORIGIN,
    makePayload: address =>
      transaction(
        address,
        BURN,
        '0x',
        ethers.BigNumber.from(MILLI_ETH).toHexString()
      )
  },
  {
    title: 'Unlimited USDC approval',
    namespace: 'eip155',
    dAppOrigin: SAMPLE_ORIGIN,
    makePayload: address =>
      transaction(
        address,
        USDC,
        tokenAbi.encodeFunctionData('approve', [
          PERMIT2,
          ethers.constants.MaxUint256
        ])
      )
  },
  {
    title: 'KyberSwap swap (ERC-7730)',
    namespace: 'eip155',
    dAppOrigin: 'https://kyberswap.com',
    makePayload: address =>
      transaction(
        address,
        KYBER_ROUTER,
        kyberAbi.encodeFunctionData('swap', [
          {
            callTarget: BURN,
            approveTarget: BURN,
            targetData: '0x',
            desc: {
              srcToken: USDC,
              dstToken: WETH,
              srcReceivers: [],
              srcAmounts: [],
              feeReceivers: [],
              feeAmounts: [],
              dstReceiver: address,
              amount: HUNDRED_USDC,
              minReturnAmount: MIN_WETH_OUT,
              flags: 0,
              permit: '0x'
            },
            clientData: '0x'
          }
        ])
      )
  },
  {
    title: 'Lido stake with 0.001 ETH (ERC-7730)',
    namespace: 'eip155',
    dAppOrigin: 'https://stake.lido.fi',
    makePayload: address =>
      transaction(
        address,
        STETH,
        lidoAbi.encodeFunctionData('submit', [ethers.constants.AddressZero]),
        ethers.BigNumber.from(MILLI_ETH).toHexString()
      )
  },
  {
    title: 'Uniswap multicall (ERC-7730 inside)',
    namespace: 'eip155',
    dAppOrigin: 'https://app.uniswap.org',
    makePayload: address =>
      transaction(
        address,
        UNISWAP_ROUTER,
        uniswapAbi.encodeFunctionData('multicall', [
          nowSeconds() + 1800,
          [
            uniswapAbi.encodeFunctionData('exactInputSingle', [
              {
                tokenIn: USDC,
                tokenOut: WETH,
                fee: 500,
                recipient: UNISWAP_ROUTER,
                amountIn: HUNDRED_USDC,
                amountOutMinimum: MIN_WETH_OUT,
                sqrtPriceLimitX96: 0
              }
            ]),
            uniswapAbi.encodeFunctionData('unwrapWETH9', [
              MIN_WETH_OUT,
              address
            ])
          ]
        ])
      )
  },
  {
    title: 'Unknown contract call',
    namespace: 'eip155',
    dAppOrigin: SAMPLE_ORIGIN,
    makePayload: address =>
      transaction(address, BURN, '0xdeadbeef' + '00'.repeat(32))
  },
  {
    title: 'Sign a text message',
    namespace: 'eip155',
    dAppOrigin: SAMPLE_ORIGIN,
    makePayload: address => ({
      method: 'personal_sign',
      params: [
        toHex(
          'Hello from Edge! Please sign this message to prove you own this address. It costs nothing and sends nothing.'
        ),
        address
      ]
    })
  },
  {
    title: 'Sign-In with Ethereum',
    namespace: 'eip155',
    dAppOrigin: SAMPLE_ORIGIN,
    makePayload: (address, chainId) =>
      signIn(
        'sample.example',
        address,
        chainId,
        'Sign in to the sample dapp with your wallet.'
      )
  },
  {
    title: 'Sign-In for another site',
    namespace: 'eip155',
    dAppOrigin: 'https://phishing.example',
    makePayload: (address, chainId) =>
      signIn('app.uniswap.org', address, chainId)
  },
  {
    title: 'Unlimited USDC permit (typed data)',
    namespace: 'eip155',
    dAppOrigin: 'https://app.uniswap.org',
    makePayload: (address, chainId) =>
      typedData(address, {
        types: {
          EIP712Domain: DOMAIN_TYPE,
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' }
          ]
        },
        primaryType: 'Permit',
        domain: {
          name: 'USD Coin',
          version: '2',
          chainId: Number(chainId),
          verifyingContract: USDC
        },
        message: {
          owner: address,
          spender: UNIVERSAL_ROUTER,
          value: ethers.constants.MaxUint256.toString(),
          nonce: 0,
          deadline: nowSeconds() + 1800
        }
      })
  },
  {
    title: 'Permit2 batch (typed data)',
    namespace: 'eip155',
    dAppOrigin: 'https://app.uniswap.org',
    makePayload: (address, chainId) =>
      typedData(address, {
        types: {
          EIP712Domain: DOMAIN_TYPE.filter(field => field.name !== 'version'),
          PermitBatch: [
            { name: 'details', type: 'PermitDetails[]' },
            { name: 'spender', type: 'address' },
            { name: 'sigDeadline', type: 'uint256' }
          ],
          PermitDetails: [
            { name: 'token', type: 'address' },
            { name: 'amount', type: 'uint160' },
            { name: 'expiration', type: 'uint48' },
            { name: 'nonce', type: 'uint48' }
          ]
        },
        primaryType: 'PermitBatch',
        domain: {
          name: 'Permit2',
          chainId: Number(chainId),
          verifyingContract: PERMIT2
        },
        message: {
          details: [
            {
              token: USDC,
              amount: MAX_UINT160,
              expiration: nowSeconds() + 30 * 24 * 3600,
              nonce: 0
            },
            {
              token: DAI,
              amount: '5000000000000000000000',
              expiration: nowSeconds() + 30 * 24 * 3600,
              nonce: 1
            }
          ],
          spender: UNIVERSAL_ROUTER,
          sigDeadline: nowSeconds() + 1800
        }
      })
  },
  {
    title: 'UNI delegation (ERC-7730 typed data)',
    namespace: 'eip155',
    dAppOrigin: 'https://www.tally.xyz',
    makePayload: (address, chainId) =>
      typedData(address, {
        types: {
          EIP712Domain: DOMAIN_TYPE.filter(field => field.name !== 'version'),
          Delegation: [
            { name: 'delegatee', type: 'address' },
            { name: 'nonce', type: 'uint256' },
            { name: 'expiry', type: 'uint256' }
          ]
        },
        primaryType: 'Delegation',
        domain: {
          name: 'Uniswap',
          chainId: Number(chainId),
          verifyingContract: UNI
        },
        message: {
          delegatee: DELEGATEE,
          nonce: 0,
          expiry: nowSeconds() + 365 * 24 * 3600
        }
      })
  },
  {
    title: 'Typed data without a summary',
    namespace: 'eip155',
    dAppOrigin: SAMPLE_ORIGIN,
    makePayload: (address, chainId) =>
      typedData(address, {
        types: {
          EIP712Domain: DOMAIN_TYPE,
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' }
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' }
          ]
        },
        primaryType: 'Mail',
        domain: {
          name: 'Ether Mail',
          version: '1',
          chainId: Number(chainId),
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
        },
        message: {
          from: { name: 'Cow', wallet: address },
          to: { name: 'Bob', wallet: BURN },
          contents: 'Hello, Bob!'
        }
      })
  },
  {
    title: 'Unreadable bytes',
    namespace: 'eip155',
    dAppOrigin: SAMPLE_ORIGIN,
    makePayload: address => ({
      method: 'personal_sign',
      params: ['0xfffe00' + 'a5'.repeat(29), address]
    })
  },
  {
    title: 'Algorand payment with rekey + asset transfer',
    namespace: 'algorand',
    dAppOrigin: SAMPLE_ORIGIN,
    makePayload: address => makeAlgorandPayload(address)
  }
]

// ---------------------------------------------------------------------
// Algorand
// ---------------------------------------------------------------------

const ALGORAND_GENESIS_HASH = 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8='
const ALGORAND_USDC_ASSET = 31566704

/**
 * Two ungrouped transactions: a payment that also rekeys the account,
 * and an asset transfer the dapp marks as not ours to sign.
 */
function makeAlgorandPayload(address: string): WcSamplePayload {
  const sender = base32.parse(address, { loose: true }).slice(0, 32)
  const recipient = new Uint8Array(32).fill(0x11)
  const newKey = new Uint8Array(32).fill(0x22)
  const common = {
    fee: 1000,
    fv: 50000000,
    lv: 50001000,
    gen: 'mainnet-v1.0',
    gh: base64.parse(ALGORAND_GENESIS_HASH),
    snd: sender
  }
  const payment = encodeMsgpackMap({
    ...common,
    type: 'pay',
    rcv: recipient,
    amt: 100000,
    rekey: newKey
  })
  const assetTransfer = encodeMsgpackMap({
    ...common,
    type: 'axfer',
    arcv: recipient,
    aamt: 1000000,
    xaid: ALGORAND_USDC_ASSET
  })
  return {
    method: 'algo_signTxn',
    params: [
      [
        {
          txn: base64.stringify(payment),
          message: 'Pay 0.1 ALGO, and hand the account to a new key'
        },
        { txn: base64.stringify(assetTransfer), signers: [] }
      ]
    ]
  }
}

type MsgpackValue = number | string | Uint8Array

/**
 * Encodes a flat map the way Algorand does: keys sorted, empty values left
 * out, and each number in its shortest form.
 */
function encodeMsgpackMap(fields: Record<string, MsgpackValue>): Uint8Array {
  const keys = Object.keys(fields)
    .filter(key => !isEmptyValue(fields[key]))
    .sort()
  const out: number[] = [0x80 | keys.length]
  for (const key of keys) {
    pushString(out, key)
    const value = fields[key]
    if (typeof value === 'string') pushString(out, value)
    else if (typeof value === 'number') pushUint(out, value)
    else {
      out.push(0xc4, value.length)
      for (const byte of value) out.push(byte)
    }
  }
  return Uint8Array.from(out)
}

function isEmptyValue(value: MsgpackValue): boolean {
  return (
    value === 0 ||
    value === '' ||
    (typeof value !== 'string' &&
      typeof value !== 'number' &&
      value.length === 0)
  )
}

function pushString(out: number[], text: string): void {
  out.push(0xa0 | text.length)
  for (let i = 0; i < text.length; ++i) out.push(text.charCodeAt(i))
}

function pushUint(out: number[], value: number): void {
  if (value < 0x80) out.push(value)
  else if (value < 0x100) out.push(0xcc, value)
  else if (value < 0x10000) out.push(0xcd, value >>> 8, value & 0xff)
  else if (value < 0x100000000) out.push(0xce, ...bytes32(value))
  else {
    out.push(0xcf, ...bytes32(Math.floor(value / 0x100000000)))
    out.push(...bytes32(value % 0x100000000))
  }
}

const bytes32 = (value: number): number[] => [
  (value >>> 24) & 0xff,
  (value >>> 16) & 0xff,
  (value >>> 8) & 0xff,
  value & 0xff
]
