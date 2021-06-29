// @flow

import React from 'react'
import { connect } from 'react-redux'

import { type GuiMakeSpendInfo } from '../../../reducers/scenes/SendConfirmationReducer'
import { sendConfirmationUpdateTx } from '../../../actions/SendConfirmationActions'
import { activated as uniqueIdentifierModalActivated } from '../../../actions/UniqueIdentifierModalActions'
import { UniqueIdentifierModalConnect as UniqueIdentifierModal } from '../../../connectors/UniqueIdentifierModalConnector'
import { EdgeText } from '../../themed/EdgeText'
import { Tile } from '../../themed/Tile'

import { getSpecialCurrencyInfo } from '../../../constants/indexConstants'

type DispatchProps = {
  sendConfirmationUpdateTx: (guiMakeSpendInfo: GuiMakeSpendInfo, selectedWalletId: string, selectedCurrencyCode: string) => Promise<void>,
  uniqueIdButtonPressed: () => void
}

type Props = {
  uniqueId: string,
  isHidden: boolean,
  currencyCode: string
}

export const UniqueIdentifierComponent = ({ isHidden, currencyCode, sendConfirmationUpdateTx, uniqueId, uniqueIdButtonPressed }: Props & DispatchProps) => {
  const uniqueIdInfo = getSpecialCurrencyInfo(currencyCode || '').uniqueIdentifier

  if (isHidden || !uniqueIdInfo) return null

  const { addButtonText, identifierName } = uniqueIdInfo

  return (
    <>
      <Tile type="touchable" title={identifierName} onPress={uniqueIdButtonPressed}>
        <EdgeText>{uniqueId || addButtonText}</EdgeText>
      </Tile>
      <UniqueIdentifierModal onConfirm={sendConfirmationUpdateTx} currencyCode={currencyCode} />
    </>
  )
}

export const UniqueIdentifier = connect(
  null,
  (dispatch: Dispatch): DispatchProps => ({
  sendConfirmationUpdateTx: (guiMakeSpendInfo: GuiMakeSpendInfo, selectedWalletId: string, selectedCurrencyCode: string) =>
    dispatch(sendConfirmationUpdateTx(guiMakeSpendInfo, true, selectedWalletId, selectedCurrencyCode)),
  uniqueIdButtonPressed: () => dispatch(uniqueIdentifierModalActivated())
}))(UniqueIdentifierComponent)
