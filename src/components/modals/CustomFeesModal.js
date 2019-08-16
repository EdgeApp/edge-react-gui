// @flow

import { InputAndButtonStyle, Modal, ModalStyle, PrimaryButton, SecondaryButton } from 'edge-components'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { View } from 'react-native'
import slowlog from 'react-native-slowlog'

import { CUSTOM_FEES, MATERIAL_COMMUNITY, PICKAXE } from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import styles from '../../styles/scenes/CustomFeesStyles'
import { scale } from '../../util/scaling.js'
import { FormField } from '../common/FormField.js'

export type CustomFees = {
  [feeSetting: string]: string
}

export type CustomFeesModalOwnProps = {
  sourceWallet: EdgeCurrencyWallet,
  customFeeSettings: Array<string>,
  customNetworkFee: Object,
  onDone: any => any
}

type Props = CustomFeesModalOwnProps
type State = CustomFees

export class CustomFeesModal extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {}
    slowlog(this, /.*/, global.slowlogOptions)
  }

  UNSAFE_componentWillMount = () => {
    this._initState()
  }

  _onFeeSettingInputChange = feeSetting => (input: string) => {
    let setting = '0'
    if (!isNaN(input) && input !== '') {
      setting = parseInt(input).toString()
    }
    this.setState({ [feeSetting]: setting })
  }

  _initState = () => {
    for (const feeSetting of this.props.customFeeSettings) {
      this.setState({
        [feeSetting]: this.props.customNetworkFee[feeSetting] || '0'
      })
    }
  }

  renderModalMiddle = () =>
    this.props.customFeeSettings.map(feeSetting => (
      <View style={[styles.feeInputWrap]} key={feeSetting}>
        <FormField
          keyboardType="numeric"
          style={[styles.feeInput]}
          onChangeText={this._onFeeSettingInputChange(feeSetting)}
          value={this.state[feeSetting]}
          label={s.strings[feeSetting] || feeSetting}
          autoFocus
        />
      </View>
    ))

  render () {
    return (
      <View style={ModalStyle.modal}>
        <Modal.Icon>
          <Icon style={{ position: 'relative', top: 2 }} type={MATERIAL_COMMUNITY} size={scale(30)} name={PICKAXE} />
        </Modal.Icon>
        <Modal.Container>
          <Modal.Icon.AndroidHackSpacer />
          <Modal.Title style={{ textAlign: 'center' }}>{s.strings.fragment_wallets_set_custom_fees}</Modal.Title>
          <Modal.Body>{this.renderModalMiddle()}</Modal.Body>
          <Modal.Footer>
            <Modal.Row style={[InputAndButtonStyle.row]}>
              <SecondaryButton style={[InputAndButtonStyle.noButton]} onPress={() => this.props.onDone(false)}>
                <SecondaryButton.Text style={[InputAndButtonStyle.buttonText]}>{s.strings.string_cancel_cap}</SecondaryButton.Text>
              </SecondaryButton>
              <PrimaryButton
                style={[InputAndButtonStyle.yesButton]}
                onPress={() => {
                  this.props.onDone({ networkFeeOption: CUSTOM_FEES, ...this.state })
                }}
              >
                <PrimaryButton.Text style={[InputAndButtonStyle.buttonText]}>{s.strings.string_custom_fee}</PrimaryButton.Text>
              </PrimaryButton>
            </Modal.Row>
          </Modal.Footer>
        </Modal.Container>
      </View>
    )
  }
}

export type CustomFeesModalOpts = {
  sourceWallet: EdgeCurrencyWallet,
  customFeeSettings: Array<string>,
  customNetworkFee: Object
}

export const createCustomFeesModal = (opts: CustomFeesModalOpts) => {
  function CustomFeesModalWrapped (props: { +onDone: Function }) {
    return <CustomFeesModal {...opts} {...props} />
  }
  return CustomFeesModalWrapped
}
