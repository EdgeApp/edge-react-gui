import type { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'

import { setDenominationKeyRequest } from '../../actions/SettingsActions'
import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { SettingsHeaderRow } from '../settings/SettingsHeaderRow'
import { SettingsRadioRow } from '../settings/SettingsRadioRow'
import { UnscaledText } from '../text/UnscaledText'
import {
  MaybeBlockbookSetting,
  MaybeCustomServersSetting,
  MaybeElectrumSetting
} from '../themed/MaybeCustomServersSetting'
import { MaybeMoneroUserSettings } from '../themed/MaybeMoneroUserSettings'

export interface CurrencySettingsParams {
  currencyInfo: EdgeCurrencyInfo
}

interface Props extends EdgeAppSceneProps<'currencySettings'> {}

export const CurrencySettingsScene: React.FC<Props> = props => {
  const { route } = props
  const { currencyInfo } = route.params
  const { currencyCode, denominations, pluginId } = currencyInfo
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)
  const selectedDenominationMultiplier = useDisplayDenom(
    account.currencyConfig[pluginId],
    null
  ).multiplier
  const currencyConfig = account.currencyConfig[pluginId]

  return (
    <SceneWrapper scroll>
      {denominations.length > 1 ? (
        <>
          <SettingsHeaderRow label={lstrings.settings_denominations_title} />
          {denominations.map(denomination => {
            const key = denomination.multiplier
            const isSelected = key === selectedDenominationMultiplier
            const handlePress = async (): Promise<void> => {
              await dispatch(
                setDenominationKeyRequest(pluginId, currencyCode, denomination)
              )
            }

            return (
              <SettingsRadioRow
                key={key}
                value={isSelected}
                onPress={handlePress}
              >
                <UnscaledText style={styles.labelText}>
                  <UnscaledText style={styles.symbolText}>
                    {denomination.symbol}
                  </UnscaledText>
                  {' - ' + denomination.name}
                </UnscaledText>
              </SettingsRadioRow>
            )
          })}
        </>
      ) : null}
      <MaybeBlockbookSetting currencyConfig={currencyConfig} />
      <MaybeCustomServersSetting currencyConfig={currencyConfig} />
      <MaybeElectrumSetting currencyConfig={currencyConfig} />
      <MaybeMoneroUserSettings currencyConfig={currencyConfig} />
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
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
