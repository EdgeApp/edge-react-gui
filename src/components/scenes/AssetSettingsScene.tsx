import * as React from 'react'
import { ScrollView } from 'react-native'

import { CURRENCY_SETTINGS_KEYS } from '../../constants/WalletAndCurrencyConstants'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'

import { SettingsTappableRow } from '../settings/SettingsTappableRow'
import { CryptoIconUi4 } from '../ui4/CryptoIconUi4'

interface Props extends EdgeSceneProps<'assetSettings'> {}

export function AssetSettingsScene(props: Props) {
  const { navigation } = props
  const account = useSelector(state => state.core.account)

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <ScrollView>
        {CURRENCY_SETTINGS_KEYS.map(pluginId => {
          if (account.currencyConfig[pluginId] == null) return null
          const { currencyInfo } = account.currencyConfig[pluginId]
          const { displayName } = currencyInfo
          const onPress = () =>
            navigation.navigate('currencySettings', {
              currencyInfo
            })

          return (
            <SettingsTappableRow key={pluginId} label={displayName} onPress={onPress}>
              <CryptoIconUi4 marginRem={[0.5, 0, 0.5, 0.5]} pluginId={pluginId} sizeRem={1.25} />
            </SettingsTappableRow>
          )
        })}
      </ScrollView>
    </SceneWrapper>
  )
}
