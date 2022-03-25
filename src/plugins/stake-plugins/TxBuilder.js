import { BigNumber } from 'ethers'

// @flow
export type TxCall = {
  contract: any,
  method: string,
  args: any[],
  estimateGas: () => Promise<BigNumber>
}

export const makeTxBuilder = () => {
  const txCalls: TxCall[] = []

  return {
    addCall(contract: any, method: string, args: any[]): TxCall {
      txCalls.push({
        contract,
        method,
        args,
        estimateGas: async () => {
          const lastArg = args[args.length - 1]
          if (typeof lastArg === 'object' && lastArg.gasLimit != null) {
            return lastArg.gasLimit
          }
          return await contract.estimateGas[method](...args)
        }
      })
    },
    getCalls(): TxCall[] {
      return txCalls
    }
  }
}
