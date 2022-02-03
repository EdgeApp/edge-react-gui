// @flow

import type { EdgeMetaToken } from 'edge-core-js'
import * as React from 'react'
import { Switch, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'

import { noOp } from '../../util/utils.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { WalletListRow } from './WalletListRow'

export type Props = {
  toggleToken: (string, boolean) => void,
  metaToken: EdgeMetaToken & {
    item: any
  },
  enabledList: string[],
  goToEditTokenScene: string => void,
  symbolImage: string,
  metaTokens: EdgeMetaToken[]
}

export function ManageTokensRow(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { currencyCode, currencyName } = props.metaToken.item
  const { enabledList, toggleToken, goToEditTokenScene, metaTokens, symbolImage } = props

  const Icon = () => (
    <View style={styles.iconContainer}>
      <FastImage style={styles.iconSize} source={{ uri: symbolImage }} />
    </View>
  )

  const EditIcon = () => (isEditable ? <FontAwesomeIcon name="edit" size={theme.rem(0.95)} color={theme.iconTappable} /> : null)

  const enabled = enabledList.indexOf(currencyCode) >= 0
  // disable editing if token is native to the app
  const isEditable = metaTokens.every(token => token.currencyCode !== currencyCode)

  const onPress = () => {
    isEditable ? goToEditTokenScene(currencyCode) : noOp()
  }

  return (
    <WalletListRow onPress={onPress} gradient icon={<Icon />} editIcon={<EditIcon />} currencyCode={currencyCode} walletName={currencyName}>
      <View style={styles.touchableCheckboxInterior}>
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
