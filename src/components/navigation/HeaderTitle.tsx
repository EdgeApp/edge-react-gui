import * as React from 'react'
import { View } from 'react-native'

import { getSelectedCurrencyWallet } from '../../selectors/WalletSelectors'
import { connect } from '../../types/reactRedux'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface OwnProps {
  showWalletNameOnly?: boolean
  title?: string
}

interface StateProps {
  selectedWalletName: string | null
  selectedWalletCurrencyCode: string
}

interface DispatchProps {}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

class HeaderTitleComponent extends React.PureComponent<Props> {
  render() {
    const { title, theme } = this.props
    const styles = getStyles(theme)
    return (
      <View style={styles.container}>
        <EdgeText>{title}</EdgeText>
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.rem(1.5),
    paddingBottom: theme.rem(0.25)
  }
}))

export const HeaderTitle = connect<StateProps, DispatchProps, OwnProps>(
  state => {
    const selectedWallet = getSelectedCurrencyWallet(state)

    return {
      selectedWalletName: selectedWallet != null ? getWalletName(selectedWallet) : null,
      selectedWalletCurrencyCode: state.ui.wallets.selectedCurrencyCode
    }
  },
  _dispatch => ({})
)(withTheme(HeaderTitleComponent))
