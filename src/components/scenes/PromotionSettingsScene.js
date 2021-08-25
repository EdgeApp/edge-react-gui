// @flow

import * as React from 'react'
import { Text, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { activatePromotion, removePromotion } from '../../actions/AccountReferralActions.js'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux.js'
import { type AccountReferral, type DeviceReferral } from '../../types/ReferralTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { TextInputModal } from '../modals/TextInputModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { SettingsHeaderRow } from '../themed/SettingsHeaderRow.js'
import { SettingsTappableRow } from '../themed/SettingsTappableRow.js'

type StateProps = {
  accountReferral: AccountReferral,
  deviceReferral: DeviceReferral
}
type DispatchProps = {
  activatePromotion: (installerId: string) => Promise<void>,
  removePromotion: (installerId: string) => Promise<void>
}
type Props = StateProps & DispatchProps & ThemeProps

export class PromotionSettingsComponent extends React.Component<Props> {
  render() {
    const { accountReferral, deviceReferral, removePromotion, theme } = this.props
    const styles = getStyles(theme)

    return (
      <SceneWrapper background="theme" hasTabs={false}>
        <SettingsHeaderRow label={s.strings.settings_promotion_affiliation_header} />
        <View style={styles.textBlock}>
          <Text style={styles.textRow}>
            {deviceReferral.installerId == null
              ? s.strings.settings_promotion_device_normal
              : sprintf(s.strings.settings_promotion_device_installer, deviceReferral.installerId)}
          </Text>
          {deviceReferral.currencyCodes != null ? (
            <Text style={styles.textRow}>{sprintf(s.strings.settings_promotion_device_currencies, deviceReferral.currencyCodes.join(', '))}</Text>
          ) : null}
          <Text style={styles.textRow}>
            {accountReferral.installerId == null
              ? s.strings.settings_promotion_account_normal
              : sprintf(s.strings.settings_promotion_account_installer, accountReferral.installerId)}
          </Text>
        </View>
        <SettingsHeaderRow label={s.strings.settings_promotion_header} />
        {accountReferral.promotions.map(promotion => (
          <SettingsTappableRow
            action="delete"
            key={promotion.installerId}
            label={promotion.installerId}
            onPress={() => removePromotion(promotion.installerId)}
          />
        ))}
        <SettingsTappableRow action="add" label={s.strings.settings_promotion_add} onPress={this.handleAdd} />
      </SceneWrapper>
    )
  }

  handleAdd = () => {
    Airship.show(bridge => (
      <TextInputModal
        autoCapitalize="none"
        autoCorrect={false}
        bridge={bridge}
        returnKeyType="go"
        title={s.strings.settings_promotion_add}
        onSubmit={async installerId => {
          await this.props.activatePromotion(installerId)
          return true
        }}
      />
    ))
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  textBlock: {
    backgroundColor: theme.settingsRowBackground,
    padding: theme.rem(0.5)
  },
  textRow: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    margin: theme.rem(0.5)
  }
}))

export const PromotionSettingsScene = connect<StateProps, DispatchProps, {}>(
  state => ({
    accountReferral: state.account.accountReferral,
    deviceReferral: state.deviceReferral
  }),
  dispatch => ({
    async activatePromotion(installerId: string): Promise<void> {
      await dispatch(activatePromotion(installerId))
    },
    async removePromotion(installerId: string): Promise<void> {
      await dispatch(removePromotion(installerId))
    }
  })
)(withTheme(PromotionSettingsComponent))
