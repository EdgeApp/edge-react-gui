// @flow

import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { connect } from '../../types/reactRedux.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { TransactionListTop } from '../themed/TransactionListTop.js'

type OwnProps = {
  walletId: string,
  isEmpty: boolean,
  searching: boolean,
  onChangeSortingState: (isSearching: boolean) => void,
  onSearchTransaction: (searchString: string) => void
}
type StateProps = {
  loading: boolean
}
type Props = OwnProps & StateProps

function TopComponent(props: Props) {
  return props.loading ? (
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

export function EmptyLoader() {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <View style={styles.emptyLoader}>
      <ActivityIndicator color={theme.icon} size="large" />
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

export function SectionHeaderCentered(props: { title?: string, loading: boolean }) {
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
    fontFamily: theme.fontFaceBold
  },
  headerLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: theme.rem(28)
  },
  headerLoaderText: {
    fontSize: theme.rem(1.25),
    fontFamily: theme.fontFaceBold
  }
}))

export const Top = connect<StateProps, {}, OwnProps>(
  (state, ownProps) => ({
    loading: !state.ui.wallets.byId[ownProps.walletId]
  }),
  dispatch => ({})
)(TopComponent)
