// @flow

import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { connect } from 'react-redux'

import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { type RootState } from '../../types/reduxTypes.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { TransactionListTop } from '../themed/TransactionListTop.js'

type TopProps = {
  walletId: string,
  loading: boolean,
  isEmpty: boolean,
  searching: boolean,
  toggleTransactionSearching: (isSearching: boolean) => void,
  onSearchTransaction: (searchString: string) => void
}

function TopComponent(props: TopProps) {
  return props.loading ? (
    <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} size="large" />
  ) : (
    <TransactionListTop
      walletId={props.walletId}
      isEmpty={props.isEmpty}
      searching={props.searching}
      toggleTransactionSearching={props.toggleTransactionSearching}
      onSearchTransaction={props.onSearchTransaction}
    />
  )
}

export function EmptyLoader() {
  const styles = getStyles(useTheme())
  return (
    <View style={styles.emptyLoader}>
      <ActivityIndicator size="large" />
    </View>
  )
}

export function SectionHeader(props: { title?: string }) {
  const styles = getStyles(useTheme())
  return (
    <Gradient style={styles.headerContainer}>
      <EdgeText style={styles.headerDate}>{props.title || ''}</EdgeText>
    </Gradient>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  emptyLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: theme.rem(10)
  },
  headerContainer: {
    paddingLeft: theme.rem(2),
    paddingVertical: theme.rem(0.5)
  },
  headerDate: {
    fontSize: theme.rem(0.75),
    fontFamily: theme.fontFaceBold
  }
}))

export const Top = connect((state: RootState, ownProps: { walletId: string }): { loading: boolean } => ({
  loading: !state.ui.wallets.byId[ownProps.walletId]
}))(TopComponent)
