import { ethers } from 'ethers'

import erc20Abi from '../abi/ERC20_ABI.json'
import abi from '../abi/THORCHAIN_SWAP_ABI'

// Copied from edge-exchange-plugins

const getEvmCheckSumAddress = (assetAddress: string): string => {
  // if (assetAddress === ETHAddress) return ETHAddress
  return ethers.utils.getAddress(assetAddress.toLowerCase())
}

export const getEvmApprovalData = async (params: { contractAddress: string; assetAddress: string; nativeAmount: string }): Promise<string | undefined> => {
  const { contractAddress, assetAddress, nativeAmount } = params
  const contract = new ethers.Contract(assetAddress, erc20Abi, ethers.providers.getDefaultProvider())

  const bnNativeAmount = ethers.BigNumber.from(nativeAmount)
  const approveTx = await contract.populateTransaction.approve(contractAddress, bnNativeAmount, {
    gasLimit: '500000',
    gasPrice: '20'
  })
  return approveTx.data
}

export const getEvmTokenData = async (params: {
  memo: string
  // usersSendingAddress: string,
  assetAddress: string
  contractAddress: string
  vaultAddress: string
  amountToSwapWei: number
}): Promise<string> => {
  // const isETH = assetAddress === ETHAddress
  const {
    // usersSendingAddress,
    assetAddress,
    contractAddress,
    memo,
    vaultAddress,
    amountToSwapWei
  } = params

  // initialize contract
  const contract = new ethers.Contract(contractAddress, abi, ethers.providers.getDefaultProvider())

  // Dummy gasPrice that we won't actually use
  const gasPrice = ethers.BigNumber.from('50')

  // setup contract params
  const contractParams: any[] = [vaultAddress, getEvmCheckSumAddress(assetAddress), amountToSwapWei.toFixed(), memo, { gasPrice }]

  // call the deposit method on the thorchain router.
  const tx = await contract.populateTransaction.deposit(...contractParams)
  if (tx.data == null) throw new Error('No data in tx object')
  return tx.data
}
