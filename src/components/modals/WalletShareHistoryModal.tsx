import type {
  EdgeWalletShareRecord,
  EdgeWalletSharingState
} from 'edge-core-js'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { ModalButtons } from '../buttons/ModalButtons'
import { EyeOutlineIcon, KeyOutlineIcon } from '../icons/ThemedIcons'
import { SectionView } from '../layout/SectionView'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText, Paragraph } from '../themed/EdgeText'
import { EdgeModal } from './EdgeModal'

/** One share, tagged with which way it went. */
interface HistoryEntry extends EdgeWalletShareRecord {
  direction: 'sharedWith' | 'sharedFrom'
}

interface Props {
  bridge: AirshipBridge<void>
  sharingState: EdgeWalletSharingState
}

/**
 * A wallet's whole sharing history, oldest first.
 *
 * Both directions are interleaved by date, because what matters to someone
 * auditing a wallet is the order things happened, not which list they were in.
 */
export const WalletShareHistoryModal: React.FC<Props> = props => {
  const { bridge, sharingState } = props

  const handleClose = useHandler(() => {
    bridge.resolve()
  })

  const entries: HistoryEntry[] = [
    ...sharingState.sharedWith.map(
      (record): HistoryEntry => ({ ...record, direction: 'sharedWith' })
    ),
    ...sharingState.sharedFrom.map(
      (record): HistoryEntry => ({ ...record, direction: 'sharedFrom' })
    )
  ].sort((a, b) => a.sharingDate.localeCompare(b.sharingDate))

  return (
    <EdgeModal
      bridge={bridge}
      title={lstrings.wallet_share_history_title}
      onCancel={handleClose}
      scroll={false}
    >
      {entries.length === 0 ? (
        <Paragraph>{lstrings.wallet_share_history_empty}</Paragraph>
      ) : (
        <ScrollView>
          <SectionView>
            {entries.map((entry, index) => (
              <HistoryRow
                key={`${entry.direction}-${entry.sharingDate}-${index}`}
                entry={entry}
              />
            ))}
          </SectionView>
        </ScrollView>
      )}
      <ModalButtons
        primary={{ label: lstrings.string_ok, onPress: handleClose }}
      />
    </EdgeModal>
  )
}

const HistoryRow: React.FC<{ entry: HistoryEntry }> = ({ entry }) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const label =
    entry.direction === 'sharedWith'
      ? lstrings.wallet_share_history_shared_with
      : lstrings.wallet_share_history_shared_by
  const name =
    entry.name === '' ? lstrings.wallet_share_history_anonymous : entry.name

  // Year first, so the rows sort the way they read:
  const date = entry.sharingDate.slice(0, 10)

  const Icon = entry.shareType === 'spend' ? KeyOutlineIcon : EyeOutlineIcon

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <EdgeText style={styles.date}>{date}</EdgeText>
        <EdgeText style={styles.detail} numberOfLines={2}>
          {`${label} `}
          <EdgeText style={styles.name}>{name}</EdgeText>
        </EdgeText>
      </View>
      <Icon
        size={theme.rem(1.25)}
        color={
          entry.shareType === 'spend' ? theme.warningText : theme.secondaryText
        }
      />
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // The modal already pads half a rem, so half a rem here lands the text a
    // full rem in, level with the title. The same half rem above and below
    // meets the divider's own, leaving the standard rem of air around it:
    marginHorizontal: theme.rem(0.5),
    marginVertical: theme.rem(0.5)
  },
  rowText: {
    flexShrink: 1,
    marginRight: theme.rem(0.5)
  },
  date: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  detail: {
    fontSize: theme.rem(0.875)
  },
  name: {
    fontFamily: theme.fontFaceBold
  }
}))
