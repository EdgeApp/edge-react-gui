/* eslint-disable react-hooks/exhaustive-deps */
import { asArray, asObject, asOptional, asString } from 'cleaners'
import * as React from 'react'
import { BackHandler, NativeSyntheticEvent, ScrollView, TextInputFocusEventData, TouchableOpacity, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { MaterialIcon } from 'react-native-vector-icons/MaterialIcons'

import { getDiskletForm, setDiskletForm } from '../../../actions/FormActions'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../../../components/services/ThemeContext'
import { EdgeText } from '../../../components/themed/EdgeText'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { RouteProp } from '../../../types/routerTypes'

interface Props {
  route: RouteProp<'guiPluginSepaTransfer'>
}

export const SepaTransferScene = React.memo((props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { headerTitle, labelToValueMap, promptMessage } = props.route.params

  const renderRows = Array.from(labelToValueMap.entries()).map(([label, value]) => (
    <View style={styles.textRow} key={label}>
      <EdgeText>{`${label}: ${value}`}:</EdgeText>
    </View>
  ))

  return (
    <SceneWrapper scroll background="theme">
      <SceneHeader title={headerTitle} underline withTopMargin />
      <View>
        <EdgeText>{promptMessage}</EdgeText>
      </View>
      {renderRows}
    </SceneWrapper>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  textRow: {},
  value: {}
}))

// message.push('Please instruct your bank to do the following payment :')
// message.push('Amount: €' + buyOrder.input.amount)
// message.push('IBAN: ' + wireInformation.iban)
// message.push('Reference: ' + wireInformation.reference)
// message.push('Recipient: ' + wireInformation.recipient)
// message.push('')
// message.push('Additional Data:')
// message.push('Bank Address: ' + wireInformation.bank_address)
// message.push('Bank Code: ' + wireInformation.bank_code) //
// message.push('Account: ' + wireInformation.account_number) //
// message.push('SWIFT BIC: ' + wireInformation.swift_bic)
