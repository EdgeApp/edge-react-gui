// @flow

import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { connect } from 'react-redux'

import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { type RootState } from '../../types/reduxTypes.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { TransactionListTop } from '../themed/TransactionListTop.js'

function TopComponent(props: { loading: boolean, isEmpty: boolean }) {
  return props.loading ? <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} size="large" /> : <TransactionListTop isEmpty={props.isEmpty} />
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

// Spacer only
export function SectionFooter() {
  const theme = useTheme()
  return <View style={{ height: theme.rem(0.5) }} />
}

const getStyles = cacheStyles((theme: Theme) => ({
  emptyLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: theme.rem(10)
  },
  headerContainer: {
    paddingHorizontal: theme.rem(1.5),
    marginBottom: theme.rem(0.125)
  },
  headerDate: {
    marginVertical: theme.rem(0.5),
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))

export const Top = connect((state: RootState, ownProps: { walletId: string }): { loading: boolean } => ({
  loading: !state.ui.wallets.byId[ownProps.walletId]
}))(TopComponent)
