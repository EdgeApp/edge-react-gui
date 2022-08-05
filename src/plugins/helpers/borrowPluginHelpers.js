// @flow

import { makeAaveBorrowPlugin, makeAaveKovanBorrowPlugin, makeAaveLocalhostPlugin } from '../borrow-plugins'
import { type BorrowPlugin } from '../borrow-plugins/types'

const borrowPlugins: BorrowPlugin[] = [makeAaveBorrowPlugin(), makeAaveKovanBorrowPlugin(), makeAaveLocalhostPlugin()]

type BorrowPluginQuery = {
  borrowPluginId?: string,
  currencyPluginId?: string
}

export function queryBorrowPlugins(query: BorrowPluginQuery): BorrowPlugin[] {
  const { borrowPluginId, currencyPluginId } = query
  let plugins = borrowPlugins

  if (borrowPluginId != null) {
    plugins = plugins.filter(borrowPlugin => borrowPlugin.borrowInfo.pluginId === borrowPluginId)
  }
  if (currencyPluginId != null) {
    plugins = plugins.filter(borrowPlugin => borrowPlugin.borrowInfo.currencyPluginId === currencyPluginId)
  }

  return plugins
}
