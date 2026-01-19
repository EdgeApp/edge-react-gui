import Clipboard from '@react-native-clipboard/clipboard'
import * as React from 'react'
import { View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { SceneButtons } from '../buttons/SceneButtons'
import { EdgeCard } from '../cards/EdgeCard'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { CopyIcon } from '../icons/ThemedIcons'
import { SceneContainer } from '../layout/SceneContainer'
import { EdgeRow } from '../rows/EdgeRow'
import { showToast } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText, Paragraph } from '../themed/EdgeText'

export interface BankInfo {
  name: string
  accountNumber: string
  routingNumber: string
}

export interface RampBankRoutingDetailsParams {
  bank: BankInfo
  fiatCurrencyCode: string
  fiatAmount: string
  onDone: () => void
}

interface Props extends EdgeAppSceneProps<'rampBankRoutingDetails'> {}

export const RampBankRoutingDetailsScene: React.FC<Props> = props => {
  const { route } = props
  const { bank, fiatCurrencyCode, fiatAmount, onDone } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)

  const amountToSendText = `${fiatAmount} ${fiatCurrencyCode}`

  const handleCopyAmount = useHandler(() => {
    Clipboard.setString(amountToSendText)
    showToast(lstrings.fragment_copied)
  })

  return (
    <SceneWrapper scroll hasTabs>
      <SceneContainer headerTitle={lstrings.ramp_bank_routing_title}>
        {/* TODO: This is a strange one-off UI. Consider a warning card here instead? */}
        <View style={styles.instructionContainer}>
          <IonIcon
            name="information-circle-outline"
            size={theme.rem(2.5)}
            color={theme.primaryText}
          />
          <Paragraph style={styles.instructionText}>
            {lstrings.ramp_bank_routing_instructions}
          </Paragraph>
        </View>

        <EdgeCard>
          <View style={styles.cardContent}>
            <View style={styles.amountRow}>
              <View style={styles.amountTextContainer}>
                <EdgeText style={styles.amountLabel}>
                  {lstrings.ramp_send_amount_label}
                </EdgeText>
                <EdgeText style={styles.amountValue}>
                  {amountToSendText}
                </EdgeText>
              </View>
              <EdgeTouchableOpacity onPress={handleCopyAmount}>
                <CopyIcon style={styles.copyIcon} size={theme.rem(1)} />
              </EdgeTouchableOpacity>
            </View>
          </View>
        </EdgeCard>

        <SectionHeader leftTitle={lstrings.ramp_bank_details_section_title} />
        <EdgeCard sections>
          <EdgeRow
            title={lstrings.ramp_bank_name_label}
            body={bank.name}
            rightButtonType="copy"
          />
          <EdgeRow
            title={lstrings.ramp_account_number_label}
            body={bank.accountNumber}
            rightButtonType="copy"
          />
          <EdgeRow
            title={lstrings.ramp_routing_number_label}
            body={bank.routingNumber}
            rightButtonType="copy"
          />
        </EdgeCard>

        <View style={styles.warningTextContainer}>
          <EdgeText style={styles.warningText}>
            {lstrings.ramp_bank_routing_warning}
          </EdgeText>
        </View>

        <SceneButtons
          primary={{
            label: lstrings.string_done_cap,
            onPress: onDone
          }}
        />
      </SceneContainer>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  instructionContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: theme.rem(0.5),
    paddingHorizontal: theme.rem(0.5)
  },
  copyIcon: {
    color: theme.iconTappable
  },
  instructionText: {
    flexShrink: 1
  },
  cardContent: {
    padding: theme.rem(0.5)
  },
  amountLabel: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText,
    marginBottom: theme.rem(0.25)
  },
  amountValue: {
    fontSize: theme.rem(1.5),
    fontFamily: theme.fontFaceBold,
    color: theme.primaryText
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  amountTextContainer: {
    flex: 1
  },
  sectionTitle: {
    fontSize: theme.rem(1),
    fontFamily: theme.fontFaceMedium,
    marginBottom: theme.rem(1)
  },
  warningTextContainer: {
    paddingHorizontal: theme.rem(1)
  },
  warningText: {
    fontSize: theme.rem(0.75),
    fontStyle: 'italic',
    textAlign: 'center'
  }
}))
