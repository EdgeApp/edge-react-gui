// @flow

import { createInputModal } from 'edge-components'
import * as React from 'react'
import { Text, View } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import { activatePromotion, removePromotion } from '../../actions/AccountReferralActions.js'
import s from '../../locales/strings.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { type AccountReferral, type DeviceReferral } from '../../types/ReferralTypes.js'
import { launchModal } from '../common/ModalProvider.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { showActivity } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { SettingsHeaderRow } from '../themed/SettingsHeaderRow.js'
import { SettingsRow } from '../themed/SettingsRow.js'

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

    const addIcon = <AntDesignIcon name="pluscircleo" color={theme.iconTappable} size={theme.rem(1)} />
    const deleteIcon = <AntDesignIcon name="close" color={theme.iconTappable} size={theme.rem(1)} />

    return (
      <SceneWrapper background="theme" hasTabs={false}>
        <SettingsHeaderRow text={s.strings.settings_promotion_affiliation_header} />
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
        <SettingsHeaderRow text={s.strings.settings_promotion_header} />
        {accountReferral.promotions.map(promotion => (
          <SettingsRow
            key={promotion.installerId}
            text={promotion.installerId}
            right={deleteIcon}
            onPress={() => {
              showActivity('', removePromotion(promotion.installerId))
            }}
          />
        ))}
        <SettingsRow text={s.strings.settings_promotion_add} right={addIcon} onPress={this.handleAdd} />
      </SceneWrapper>
    )
  }

  handleAdd = () => {
    launchModal(
      createInputModal({
        icon: <AntDesignIcon name="pluscircleo" color={THEME.COLORS.SECONDARY} size={THEME.rem(2)} />,
        title: s.strings.settings_promotion_add,
        input: {
          autoCorrect: false,
          returnKeyType: 'go',
          label: '',
          initialValue: '',
          autoFocus: true
        },
        yesButton: { title: s.strings.string_done_cap },
        noButton: { title: s.strings.string_cancel_cap }
      })
    ).then(installerId => {
      if (installerId != null) {
        showActivity(sprintf(s.strings.settings_promotion_adding, installerId), this.props.activatePromotion(installerId))
      }
    })
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

export const PromotionSettingsScene = connect(
  (state: RootState): StateProps => ({
    accountReferral: state.account.accountReferral,
    deviceReferral: state.deviceReferral
  }),
  (dispatch: Dispatch): DispatchProps => ({
    async activatePromotion(installerId: string): Promise<void> {
      await dispatch(activatePromotion(installerId))
    },
    async removePromotion(installerId: string): Promise<void> {
      await dispatch(removePromotion(installerId))
    }
  })
)(withTheme(PromotionSettingsComponent))
