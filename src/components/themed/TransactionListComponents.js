// @flow

import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { useSelector } from '../../types/reactRedux.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { TransactionListTop } from '../themed/TransactionListTop.js'

type Props = {
  walletId: string,
  isEmpty: boolean,
  searching: boolean,
  onChangeSortingState: (isSearching: boolean) => void,
  onSearchTransaction: (searchString: string) => void
}

export const Top = (props: Props) => {
  const loading = useSelector(state => !state.ui.wallets.byId[props.walletId])

  return loading ? (
    <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} size="large" />
  ) : (
    <TransactionListTop
      walletId={props.walletId}
      isEmpty={props.isEmpty}
      searching={props.searching}
      onChangeSortingState={props.onChangeSortingState}
      onSearchTransaction={props.onSearchTransaction}
    />
  )
}

export const EmptyLoader = () => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={styles.emptyLoader}>
      <ActivityIndicator color={theme.icon} size="large" />
    </View>
  )
}

export const SectionHeader = (props: { title?: string }) => {
  const styles = getStyles(useTheme())
  return (
    <Gradient style={styles.headerContainer}>
      <EdgeText style={styles.headerDate}>{props.title || ''}</EdgeText>
    </Gradient>
  )
}

export const SectionHeaderCentered = (props: { title?: string, loading: boolean }) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <Gradient style={styles.headerLoaderContainer}>
      {props.loading ? <ActivityIndicator color={theme.icon} size="large" /> : <EdgeText style={styles.headerLoaderText}>{props.title || ''}</EdgeText>}
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
    paddingLeft: theme.rem(1),
    paddingVertical: theme.rem(0.5)
  },
  headerDate: {
    fontSize: theme.rem(0.75),
    fontFamily: theme.fontFaceMedium
  },
  headerLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: theme.rem(28)
  },
  headerLoaderText: {
    fontSize: theme.rem(1.25),
    fontFamily: theme.fontFaceMedium
  }
}))
