import Clipboard from '@react-native-clipboard/clipboard'
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'

import { Fontello } from '../../../assets/vector/index'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../../../components/services/ThemeContext'
import { EdgeText } from '../../../components/themed/EdgeText'
import { MainButton } from '../../../components/themed/MainButton'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { useHandler } from '../../../hooks/useHandler'
import s from '../../../locales/strings'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'

interface SepaDisplayGroup {
  groupTitle: string
  items: Array<{ label: string; value?: string }>
}

interface Props {
  route: RouteProp<'guiPluginSepaTransfer'>
  navigation: NavigationProp<'guiPluginSepaTransfer'>
}

export const SepaTransferScene = React.memo((props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { route, navigation } = props
  // TODO: headerIconUri
  const { headerTitle, transferInfo, promptMessage, onSubmit } = route.params
  const { input, output, paymentDetails } = transferInfo

  const displayData: SepaDisplayGroup[] = React.useMemo(
    () => [
      {
        groupTitle: s.strings.quote_input_title,
        items: [
          {
            label: s.strings.string_amount,
            value: input.amount
          },
          {
            label: s.strings.input_output_currency,
            value: output.amount
          }
        ]
      },
      {
        groupTitle: s.strings.quote_output_title,
        items: [
          {
            label: s.strings.string_amount,
            value: input.amount
          },
          {
            label: s.strings.input_output_currency,
            value: output.amount
          }
        ]
      },
      {
        groupTitle: s.strings.payment_details,
        items: [
          {
            label: s.strings.transaction_details_exchange_order_id,
            value: paymentDetails.id
          },
          {
            label: s.strings.iban,
            value: paymentDetails.iban
          },
          {
            label: s.strings.swift_bic,
            value: paymentDetails.swiftBic
          },
          {
            label: s.strings.transaction_details_recipient,
            value: paymentDetails.recipient
          },
          {
            label: s.strings.reference,
            value: paymentDetails.reference
          }
        ]
      }
    ],
    [input.amount, output.amount, paymentDetails.iban, paymentDetails.id, paymentDetails.recipient, paymentDetails.reference, paymentDetails.swiftBic]
  )

  const handleCopyPress = useHandler((value: string) => {
    Clipboard.setString(value)
  })

  const handleSubmit = useHandler(async () => {
    await onSubmit()
    navigation.pop()
  })

  const renderCopyButton = (value: string) => {
    return (
      <TouchableOpacity onPress={() => handleCopyPress(value)}>
        <Fontello name="Copy-icon" size={theme.rem(1)} color={theme.iconTappable} />
      </TouchableOpacity>
    )
  }

  const renderGroups = () =>
    displayData.map(group => (
      <View style={styles.groupContainer} key={group.groupTitle}>
        <EdgeText style={styles.groupTitle}>{group.groupTitle}</EdgeText>
        {group.items.map(item => (
          <View style={styles.textRow} key={item.label}>
            <EdgeText style={styles.itemLabel}>{item.label}:</EdgeText>
            <View style={styles.itemValueRow}>
              <EdgeText style={styles.itemValue} numberOfLines={3}>
                {item.value ?? s.strings.n_a}
              </EdgeText>
              {renderCopyButton(item.value ?? s.strings.n_a)}
            </View>
          </View>
        ))}
      </View>
    ))

  return (
    <SceneWrapper scroll background="theme">
      <SceneHeader title={headerTitle} underline withTopMargin />
      <View style={styles.promptContainer}>
        <EdgeText numberOfLines={12}>{promptMessage}</EdgeText>
      </View>
      {renderGroups()}
      <MainButton label={s.strings.string_done_cap} marginRem={[2, 1, 1.5, 1]} type="secondary" onPress={handleSubmit} />
    </SceneWrapper>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  groupContainer: {
    marginTop: theme.rem(1),
    marginHorizontal: theme.rem(1),
    borderWidth: theme.thinLineWidth,
    borderColor: theme.cardBorderColor,
    borderRadius: theme.rem(0.5)
  },
  groupTitle: {
    fontSize: theme.rem(1),
    fontFamily: theme.fontFaceBold,
    margin: theme.rem(0.5)
  },
  textRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.rem(0.5),
    marginVertical: theme.rem(0.5)
  },
  itemLabel: {
    flex: 1,
    fontFamily: theme.fontFaceBold,
    color: theme.secondaryText,
    flexWrap: 'wrap'
  },
  itemValueRow: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginLeft: theme.rem(0.5)
  },
  itemValue: {
    flex: 1,
    color: theme.primaryText,
    marginRight: theme.rem(0.5),
    flexWrap: 'wrap'
  },
  promptContainer: {
    margin: theme.rem(1)
  }
}))
