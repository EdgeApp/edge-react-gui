// @flow

import type { EdgeMetaToken } from 'edge-core-js'
import * as React from 'react'
import { Image, Switch, View } from 'react-native'

import { type Theme, cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { WalletListRow } from '../../themed/WalletListRow'

export type State = {
  enabled?: boolean
}

export type Props = {
  toggleToken: string => void,
  // this is an stange case that needs to be looked at later
  metaToken: EdgeMetaToken & {
    item: any
  },
  enabled?: boolean,
  enabledList: string[],
  goToEditTokenScene: string => void
}

function TokenRow(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { item } = props.metaToken
  const { enabledList, toggleToken } = props

  const Icon = () => (
    <View style={styles.iconContainer}>
      <Image style={styles.iconSize} source={{ uri: item.symbolImage }} />
    </View>
  )

  const enabled = enabledList.indexOf(item.currencyCode) >= 0

  return (
    <WalletListRow gradient icon={<Icon />} currencyCode={item.currencyCode} walletName={item.currencyName}>
      <View style={styles.touchableCheckboxInterior}>
        <Switch
          onChange={() => toggleToken(item.currencyCode)}
          value={enabled}
          ios_backgroundColor={theme.toggleButtonOff}
          trackColor={{
            false: theme.toggleButtonOff,
            true: theme.toggleButton
          }}
        />
      </View>
    </WalletListRow>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconSize: {
    width: theme.rem(2),
    height: theme.rem(2)
  },
  touchableCheckboxInterior: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkBox: {
    alignSelf: 'center'
  }
}))

export default TokenRow
