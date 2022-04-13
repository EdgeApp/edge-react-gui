// @flow

import type { EdgeMetaToken } from 'edge-core-js'
import * as React from 'react'
import { Switch, View } from 'react-native'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'

import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { WalletListRow } from './WalletListRow'

export type Props = {
  toggleToken: (string, boolean) => void,
  metaToken: EdgeMetaToken & {
    item: any
  },
  enabledList: string[],
  goToEditTokenScene: string => void,
  metaTokens: EdgeMetaToken[]
}

export function ManageTokensRow(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { currencyCode, currencyName } = props.metaToken.item
  const { enabledList, toggleToken, goToEditTokenScene, metaTokens } = props
  const enabled = enabledList.indexOf(currencyCode) >= 0
  // disable editing if token is native to the app
  const isEditable = metaTokens.every(token => token.currencyCode !== currencyCode)

  const onPress = () => {
    if (isEditable) goToEditTokenScene(currencyCode)
  }

  return (
    <WalletListRow onPress={onPress} gradient currencyCode={currencyCode} walletName={currencyName}>
      <View style={styles.touchableCheckboxInterior}>
        {isEditable ? (
          <View style={styles.editIcon}>
            <FontAwesomeIcon name="edit" size={theme.rem(0.95)} color={theme.iconTappable} />
          </View>
        ) : null}
        <Switch
          onChange={event => toggleToken(currencyCode, event.nativeEvent.value)}
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
  touchableCheckboxInterior: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  },
  checkBox: {
    alignSelf: 'center'
  },
  editIcon: {
    paddingTop: theme.rem(0.375),
    paddingRight: theme.rem(0.75),
    alignSelf: 'flex-start'
  }
}))
