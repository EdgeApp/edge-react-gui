import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { activatePromotion, removePromotion } from '../../actions/AccountReferralActions'
import { lstrings } from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { AccountReferral, DeviceReferral } from '../../types/ReferralTypes'
import { EdgeSceneProps } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError } from '../services/AirshipInstance'
import { ThemeProps, withTheme } from '../services/ThemeContext'
import { SettingsHeaderRow } from '../settings/SettingsHeaderRow'
import { SettingsSubHeader } from '../settings/SettingsSubHeader'
import { SettingsTappableRow } from '../settings/SettingsTappableRow'

interface OwnProps extends EdgeSceneProps<'promotionSettings'> {}

interface StateProps {
  accountReferral: AccountReferral
  deviceReferral: DeviceReferral
}
interface DispatchProps {
  activatePromotion: (installerId: string) => Promise<void>
  removePromotion: (installerId: string) => Promise<void>
}
type Props = OwnProps & StateProps & DispatchProps & ThemeProps

export class PromotionSettingsComponent extends React.Component<Props> {
  render() {
    const { accountReferral, deviceReferral, removePromotion } = this.props

    return (
      <SceneWrapper background="theme" hasTabs={false}>
        <SettingsHeaderRow label={lstrings.settings_promotion_affiliation_header} />
        <SettingsSubHeader
          label={
            deviceReferral.installerId == null
              ? lstrings.settings_promotion_device_normal
              : sprintf(lstrings.settings_promotion_device_installer, deviceReferral.installerId)
          }
        />
        {deviceReferral.currencyCodes == null ? null : (
          <SettingsSubHeader label={sprintf(lstrings.settings_promotion_device_currencies, deviceReferral.currencyCodes.join(', '))} />
        )}
        <SettingsSubHeader
          label={
            accountReferral.installerId == null
              ? lstrings.settings_promotion_account_normal
              : sprintf(lstrings.settings_promotion_account_installer, accountReferral.installerId)
          }
        />
        <SettingsHeaderRow label={lstrings.settings_promotion_header} />
        {accountReferral.promotions.map(promotion => (
          <SettingsTappableRow
            action="delete"
            key={promotion.installerId}
            label={promotion.installerId}
            onPress={async () => await removePromotion(promotion.installerId)}
          />
        ))}
        <SettingsTappableRow action="add" label={lstrings.settings_promotion_add} onPress={this.handleAdd} />
      </SceneWrapper>
    )
  }

  handleAdd = () => {
    Airship.show<string | undefined>(bridge => (
      <TextInputModal
        autoCapitalize="none"
        autoCorrect={false}
        bridge={bridge}
        returnKeyType="go"
        title={lstrings.settings_promotion_add}
        onSubmit={async installerId => {
          await this.props.activatePromotion(installerId)
          return true
        }}
      />
    )).catch(err => showError(err))
  }
}

export const PromotionSettingsScene = connect<StateProps, DispatchProps, OwnProps>(
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
