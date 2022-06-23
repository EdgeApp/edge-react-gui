// @flow

import * as React from 'react'
import { ScrollView, Text } from 'react-native'

import { setDenominationKeyRequest } from '../../actions/SettingsActions.js'
import s from '../../locales/strings.js'
import { getDisplayDenomination } from '../../selectors/DenominationSelectors.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { type RouteProp } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { cacheStyles, useTheme } from '../services/ThemeContext.js'
import { MaybeBlockbookSetting, MaybeCustomServersSetting, MaybeElectrumSetting } from '../themed/MaybeCustomServersSetting.js'
import { SettingsHeaderRow } from '../themed/SettingsHeaderRow.js'
import { SettingsRadioRow } from '../themed/SettingsRadioRow.js'

type Props = {
  route: RouteProp<'currencySettings'>
}

export function CurrencySettingsScene(props: Props) {
  const { route } = props
  const { currencyInfo } = route.params
  const { currencyCode, denominations, pluginId } = currencyInfo
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const selectedDenominationMultiplier = useSelector(state => getDisplayDenomination(state, pluginId, currencyCode).multiplier)
  const account = useSelector(state => state.core.account)
  const currencyConfig = account.currencyConfig[pluginId]

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <ScrollView>
        <SettingsHeaderRow label={s.strings.settings_denominations_title} />
        {denominations.map(denomination => {
          const key = denomination.multiplier
          const isSelected = key === selectedDenominationMultiplier
          const handlePress = async () => {
            await dispatch(setDenominationKeyRequest(pluginId, currencyCode, denomination))
          }

          return (
            <SettingsRadioRow key={key} value={isSelected} onPress={handlePress}>
              <Text style={styles.labelText}>
                <Text style={styles.symbolText}>{denomination.symbol}</Text>
                {' - ' + denomination.name}
              </Text>
            </SettingsRadioRow>
          )
        })}
        <MaybeBlockbookSetting currencyConfig={currencyConfig} />
        <MaybeCustomServersSetting currencyConfig={currencyConfig} />
        <MaybeElectrumSetting currencyConfig={currencyConfig} />
      </ScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles(theme => ({
  labelText: {
    color: theme.primaryText,
    flexShrink: 1,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    paddingHorizontal: theme.rem(0.5),
    textAlign: 'left'
  },
  symbolText: {
    fontFamily: theme.fontFaceSymbols
  }
}))
