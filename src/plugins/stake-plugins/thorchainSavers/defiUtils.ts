import { ethers } from 'ethers'

import erc20Abi from '../../abi/ERC20_ABI.json'
import abi from '../../abi/THORCHAIN_SWAP_ABI'

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

export const getEvmDepositWithExpiryData = async (params: {
  memo: string
  // usersSendingAddress: string,
  assetAddress: string
  contractAddress: string
  vaultAddress: string
  amountToDepositWei: number
  expiry: number
}): Promise<string> => {
  // const isETH = assetAddress === ETHAddress
  const {
    // usersSendingAddress,
    assetAddress,
    contractAddress,
    memo,
    vaultAddress,
    amountToDepositWei,
    expiry
  } = params

  // initialize contract
  const contract = new ethers.Contract(contractAddress, abi, ethers.providers.getDefaultProvider())

  // setup contract params
  const contractParams: any[] = [vaultAddress, assetAddress, amountToDepositWei.toFixed(), memo, expiry]

  // call the deposit method on the thorchain router.
  const tx = await contract.populateTransaction.depositWithExpiry(...contractParams)
  if (tx.data == null) throw new Error('No data in tx object')
  return tx.data
}
