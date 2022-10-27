import { makeAaveEthBorrowPlugin, makeAaveKovBorrowPlugin, makeAaveMaticBorrowPlugin } from '../borrow-plugins/plugins/aave'
import { BorrowPlugin } from '../borrow-plugins/types'

export const borrowPlugins: BorrowPlugin[] = [makeAaveEthBorrowPlugin(), makeAaveKovBorrowPlugin(), makeAaveMaticBorrowPlugin()]

interface BorrowPluginQuery {
  borrowPluginId?: string
  currencyPluginId?: string
}

export function queryBorrowPlugins(query: BorrowPluginQuery): BorrowPlugin[] {
  const { borrowPluginId, currencyPluginId } = query
  let plugins = borrowPlugins

  if (borrowPluginId != null) {
    plugins = plugins.filter(borrowPlugin => borrowPlugin.borrowInfo.borrowPluginId === borrowPluginId)
  }
  if (currencyPluginId != null) {
    plugins = plugins.filter(borrowPlugin => borrowPlugin.borrowInfo.currencyPluginId === currencyPluginId)
  }

  return plugins
}
