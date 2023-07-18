import Clipboard from '@react-native-clipboard/clipboard'
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'

import { Fontello } from '../../../assets/vector/index'
import { NotificationSceneWrapper } from '../../../components/common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../../../components/services/ThemeContext'
import { EdgeText } from '../../../components/themed/EdgeText'
import { MainButton } from '../../../components/themed/MainButton'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { EdgeSceneProps } from '../../../types/routerTypes'

interface InfoDisplayGroup {
  groupTitle: string
  items: Array<{ label: string; value?: string }>
}

interface Props extends EdgeSceneProps<'guiPluginInfoDisplay'> {}

export const InfoDisplayScene = React.memo((props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { route, navigation } = props
  // TODO: headerIconUri
  const { headerTitle, transferInfo, promptMessage, onDone } = route.params

  const displayData: InfoDisplayGroup[] = React.useMemo(() => {
    const { input, output, paymentDetails } = transferInfo
    return [
      {
        groupTitle: lstrings.buy_sell_quote_input_title,
        items: [
          {
            label: lstrings.string_amount,
            value: input.amount
          },
          {
            label: lstrings.input_output_currency,
            value: input.currency
          }
        ]
      },
      {
        groupTitle: lstrings.buy_sell_quote_output_title,
        items: [
          {
            label: lstrings.string_amount,
            value: output.amount
          },
          {
            label: lstrings.input_output_currency,
            value: output.currency
          },
          {
            label: lstrings.request_qr_your_wallet_address,
            value: output.walletAddress
          }
        ]
      },
      {
        groupTitle: lstrings.payment_details,
        items: [
          {
            label: lstrings.transaction_details_exchange_order_id,
            value: paymentDetails.id
          },
          {
            label: lstrings.form_field_title_iban,
            value: paymentDetails.iban
          },
          {
            label: lstrings.form_field_title_swift_bic,
            value: paymentDetails.swiftBic
          },
          {
            label: lstrings.transaction_details_recipient,
            value: paymentDetails.recipient
          },
          {
            label: lstrings.bank_transfer_reference,
            value: paymentDetails.reference
          }
        ]
      }
    ]
  }, [transferInfo])

  const handleCopyPress = useHandler((value: string) => {
    Clipboard.setString(value)
  })

  const handleDone = useHandler(async () => {
    await onDone()
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
            <EdgeText style={styles.itemLabel} numberOfLines={2}>{`${item.label}:`}</EdgeText>
            <View style={styles.itemValueRow}>
              <EdgeText style={styles.itemValue} numberOfLines={3}>
                {item.value ?? lstrings.n_a}
              </EdgeText>
              {renderCopyButton(item.value ?? lstrings.n_a)}
            </View>
          </View>
        ))}
      </View>
    ))

  return (
    <NotificationSceneWrapper navigation={navigation} scroll background="theme">
      <SceneHeader title={headerTitle} underline withTopMargin />
      <View style={styles.promptContainer}>
        <EdgeText numberOfLines={12}>{promptMessage}</EdgeText>
      </View>
      {renderGroups()}
      <MainButton label={lstrings.string_done_cap} marginRem={[2, 1, 1.5, 1]} type="secondary" onPress={handleDone} />
    </NotificationSceneWrapper>
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
