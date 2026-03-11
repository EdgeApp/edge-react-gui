import Clipboard from '@react-native-clipboard/clipboard'
import type { EdgeCurrencyWallet, EdgeDataDump } from 'edge-core-js'
import * as React from 'react'
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  View
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { readLogs } from '../../util/logger'
import { EdgeButton } from '../buttons/EdgeButton'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionView } from '../layout/SectionView'
import { showError, showToast } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

type Props = EdgeAppSceneProps<'debugSettings'>

interface DumpResult {
  dump?: EdgeDataDump
  error?: string
}

interface NodesWalletSectionProps {
  wallet: EdgeCurrencyWallet
  dumpResult: DumpResult | undefined
  isExpanded: boolean
  isLoading: boolean
  onToggle: (walletId: string) => void
  onLongPress: (walletId: string) => void
}

interface DumpWalletRowProps {
  wallet: EdgeCurrencyWallet
  dumpResult: DumpResult | undefined
  isExpanded: boolean
  isLoading: boolean
  onPress: (walletId: string) => void
  onLongPress: (walletId: string) => void
}

// ---------------------------------------------------------------------------
// Main scene
// ---------------------------------------------------------------------------

export const DebugScene: React.FC<Props> = () => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const wallets = React.useMemo(
    () => Object.values(currencyWallets),
    [currencyWallets]
  )

  const [showNodesAndServers, setShowNodesAndServers] = React.useState(false)
  const [showDataDump, setShowDataDump] = React.useState(false)
  const [showLogs, setShowLogs] = React.useState(false)
  const [walletDumpMap, setWalletDumpMap] = React.useState<
    Record<string, DumpResult>
  >({})
  const [walletExpandedMap, setWalletExpandedMap] = React.useState<
    Record<string, boolean>
  >({})
  const [loadingWallets, setLoadingWallets] = React.useState<
    Record<string, boolean>
  >({})
  const [logsInfo, setLogsInfo] = React.useState('')
  const [logsActivity, setLogsActivity] = React.useState('')
  const [showInfoLog, setShowInfoLog] = React.useState(false)
  const [showActivityLog, setShowActivityLog] = React.useState(false)

  const logsLoadedRef = React.useRef(false)
  const isMountedRef = React.useRef(true)
  const walletDumpMapRef = React.useRef<Record<string, DumpResult>>({})
  const loadingWalletsRef = React.useRef<Record<string, boolean>>({})

  // --- Core async operations ---

  const loadWalletDump = useHandler(async (walletId: string): Promise<void> => {
    const wallet = currencyWallets[walletId]
    if (wallet == null) return

    if (walletDumpMapRef.current[walletId]?.dump != null) return
    if (loadingWalletsRef.current[walletId] ?? false) return

    setLoadingWallets(prev => {
      const next = { ...prev, [walletId]: true }
      loadingWalletsRef.current = next
      return next
    })

    try {
      const dump = await wallet.dumpData()

      if (isMountedRef.current) {
        setWalletDumpMap(prev => {
          const next = { ...prev, [walletId]: { dump } }
          walletDumpMapRef.current = next
          return next
        })
      }
    } catch (error: unknown) {
      if (isMountedRef.current) {
        setWalletDumpMap(prev => {
          const next = {
            ...prev,
            [walletId]: {
              error: error instanceof Error ? error.message : String(error)
            }
          }
          walletDumpMapRef.current = next
          return next
        })
        showError(error)
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingWallets(prev => {
          const next = { ...prev, [walletId]: false }
          loadingWalletsRef.current = next
          return next
        })
      }
    }
  })

  const handleRefreshLogs = useHandler(async (): Promise<void> => {
    const [info, activity] = await Promise.all([
      readLogs('info'),
      readLogs('activity')
    ])
    setLogsInfo(info ?? '')
    setLogsActivity(activity ?? '')
  })

  // --- Section toggle handlers ---

  const handleToggleNodesAndServers = useHandler(() => {
    setShowNodesAndServers(prev => !prev)
  })

  const handleToggleDataDump = useHandler(() => {
    setShowDataDump(prev => !prev)
  })

  const handleToggleLogs = useHandler(() => {
    setShowLogs(prev => !prev)
  })

  // --- Long press (copy) handlers for top-level sections ---

  const handleCopyJson = useHandler((json: unknown, label: string): void => {
    try {
      Clipboard.setString(JSON.stringify(json, null, 2))
      showToast(sprintf(lstrings.settings_debug_copied_1s, label))
    } catch (error: unknown) {
      showError(error)
    }
  })

  const handleLongPressNodesAndServers = useHandler(() => {
    const nodesData: Record<string, unknown> = {}
    for (const wallet of wallets) {
      const data = walletDumpMap[wallet.id]?.dump?.data
      if (data != null) {
        nodesData[wallet.id] = {
          label: getWalletLabel(wallet),
          ...getNodesContent(data, wallet)
        }
      }
    }
    handleCopyJson(nodesData, lstrings.settings_debug_nodes_servers)
  })

  const handleLongPressDataDump = useHandler(() => {
    const dumpData: Record<string, unknown> = {}
    for (const wallet of wallets) {
      const dump = walletDumpMap[wallet.id]?.dump
      if (dump != null) {
        dumpData[wallet.id] = {
          label: getWalletLabel(wallet),
          dump
        }
      }
    }
    handleCopyJson(dumpData, lstrings.settings_debug_engine_dump)
  })

  const handleLongPressLogs = useHandler(() => {
    try {
      const allLogs = `=== Info Log ===\n${logsInfo}\n\n=== Activity Log ===\n${logsActivity}`
      Clipboard.setString(allLogs)
      showToast(
        sprintf(lstrings.settings_debug_copied_1s, lstrings.settings_debug_logs)
      )
    } catch (error: unknown) {
      showError(error)
    }
  })

  // --- Long press (copy) handlers for log sub-sections ---

  const handleLongPressInfoLog = useHandler(() => {
    try {
      Clipboard.setString(logsInfo)
      showToast(
        sprintf(
          lstrings.settings_debug_copied_1s,
          lstrings.settings_debug_info_log
        )
      )
    } catch (error: unknown) {
      showError(error)
    }
  })

  const handleLongPressActivityLog = useHandler(() => {
    try {
      Clipboard.setString(logsActivity)
      showToast(
        sprintf(
          lstrings.settings_debug_copied_1s,
          lstrings.settings_debug_activity_log
        )
      )
    } catch (error: unknown) {
      showError(error)
    }
  })

  // --- Per-wallet handlers ---

  const handleNodesWalletToggle = useHandler((walletId: string): void => {
    setWalletExpandedMap(prev => ({
      ...prev,
      [`nodes:${walletId}`]: !(prev[`nodes:${walletId}`] ?? false)
    }))
  })

  const handleNodesWalletLongPress = useHandler((walletId: string): void => {
    const wallet = account.currencyWallets[walletId]
    const data = walletDumpMap[walletId]?.dump?.data
    if (data != null && wallet != null) {
      const label = getWalletLabel(wallet)
      handleCopyJson(getNodesContent(data, wallet), label)
    }
  })

  const handleDumpWalletPress = useHandler((walletId: string): void => {
    // `walletDumpMap` is shared with Nodes & Servers; that section may have
    // already loaded the dump for this wallet.
    const dumpKey = `dump:${walletId}`
    let shouldLoadDump = false

    setWalletExpandedMap(prev => {
      shouldLoadDump =
        !(prev[dumpKey] ?? false) &&
        walletDumpMapRef.current[walletId]?.dump == null &&
        !(loadingWalletsRef.current[walletId] ?? false)

      return {
        ...prev,
        [dumpKey]: !(prev[dumpKey] ?? false)
      }
    })

    if (shouldLoadDump) {
      loadWalletDump(walletId).catch((error: unknown) => {
        showError(error)
      })
    }
  })

  const handleDumpWalletLongPress = useHandler((walletId: string): void => {
    const dump = walletDumpMap[walletId]?.dump
    if (dump != null) {
      const wallet = account.currencyWallets[walletId]
      const label = wallet != null ? getWalletLabel(wallet) : walletId
      handleCopyJson(dump, label)
    }
  })

  const handleToggleInfoLog = useHandler(() => {
    setShowInfoLog(prev => !prev)
  })

  const handleToggleActivityLog = useHandler(() => {
    setShowActivityLog(prev => !prev)
  })

  // --- Auto-load effects ---

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  React.useEffect(() => {
    if (!showNodesAndServers) return
    for (const wallet of wallets) {
      if (
        walletDumpMap[wallet.id] == null &&
        !(loadingWallets[wallet.id] ?? false)
      ) {
        loadWalletDump(wallet.id).catch((error: unknown) => {
          showError(error)
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadWalletDump, showNodesAndServers, wallets])

  React.useEffect(() => {
    if (showLogs && !logsLoadedRef.current) {
      logsLoadedRef.current = true
      handleRefreshLogs().catch((error: unknown) => {
        logsLoadedRef.current = false
        showError(error)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLogs])

  // --- Render ---

  return (
    <SceneWrapper scroll>
      <EdgeText style={styles.hintText}>
        {lstrings.settings_debug_long_press_hint}
      </EdgeText>

      <SectionView extendRight>
        {/* Nodes & Servers */}
        <View>
          <EdgeTouchableOpacity
            style={styles.sectionHeader}
            onPress={handleToggleNodesAndServers}
            onLongPress={handleLongPressNodesAndServers}
          >
            <EdgeText style={styles.sectionTitle}>
              {lstrings.settings_debug_nodes_servers}
            </EdgeText>
            <Ionicons
              name={showNodesAndServers ? 'chevron-up' : 'chevron-down'}
              size={theme.rem(1.25)}
              color={theme.iconTappable}
            />
          </EdgeTouchableOpacity>
          {showNodesAndServers && wallets.length === 0 ? (
            <EdgeText style={styles.emptyText}>
              {lstrings.settings_debug_no_wallets}
            </EdgeText>
          ) : null}
          {showNodesAndServers
            ? wallets.map(wallet => (
                <NodesWalletSection
                  key={`nodes-${wallet.id}`}
                  wallet={wallet}
                  dumpResult={walletDumpMap[wallet.id]}
                  isExpanded={walletExpandedMap[`nodes:${wallet.id}`] ?? false}
                  isLoading={loadingWallets[wallet.id] ?? false}
                  onToggle={handleNodesWalletToggle}
                  onLongPress={handleNodesWalletLongPress}
                />
              ))
            : null}
        </View>

        {/* Engine dataDump */}
        <View>
          <EdgeTouchableOpacity
            style={styles.sectionHeader}
            onPress={handleToggleDataDump}
            onLongPress={handleLongPressDataDump}
          >
            <EdgeText style={styles.sectionTitle}>
              {lstrings.settings_debug_engine_dump}
            </EdgeText>
            <Ionicons
              name={showDataDump ? 'chevron-up' : 'chevron-down'}
              size={theme.rem(1.25)}
              color={theme.iconTappable}
            />
          </EdgeTouchableOpacity>
          {showDataDump && wallets.length === 0 ? (
            <EdgeText style={styles.emptyText}>
              {lstrings.settings_debug_no_wallets}
            </EdgeText>
          ) : null}
          {showDataDump
            ? wallets.map(wallet => (
                <DumpWalletRow
                  key={`dump-${wallet.id}`}
                  wallet={wallet}
                  dumpResult={walletDumpMap[wallet.id]}
                  isExpanded={walletExpandedMap[`dump:${wallet.id}`] ?? false}
                  isLoading={loadingWallets[wallet.id] ?? false}
                  onPress={handleDumpWalletPress}
                  onLongPress={handleDumpWalletLongPress}
                />
              ))
            : null}
        </View>

        {/* Log Viewer */}
        <View>
          <EdgeTouchableOpacity
            style={styles.sectionHeader}
            onPress={handleToggleLogs}
            onLongPress={handleLongPressLogs}
          >
            <EdgeText style={styles.sectionTitle}>
              {lstrings.settings_debug_logs}
            </EdgeText>
            <Ionicons
              name={showLogs ? 'chevron-up' : 'chevron-down'}
              size={theme.rem(1.25)}
              color={theme.iconTappable}
            />
          </EdgeTouchableOpacity>
          {showLogs ? (
            <>
              <EdgeButton
                type="primary"
                mini
                label={lstrings.settings_debug_refresh_logs}
                onPress={handleRefreshLogs}
              />

              <EdgeTouchableOpacity
                style={styles.logSubHeader}
                onPress={handleToggleInfoLog}
                onLongPress={handleLongPressInfoLog}
              >
                <EdgeText style={styles.logSectionLabel}>
                  {lstrings.settings_debug_info_log}
                </EdgeText>
                <Ionicons
                  name={showInfoLog ? 'chevron-up' : 'chevron-down'}
                  size={theme.rem(1)}
                  color={theme.iconTappable}
                />
              </EdgeTouchableOpacity>
              {showInfoLog ? (
                <ScrollView style={styles.logBox} nestedScrollEnabled>
                  {__DEV__ ? (
                    <EdgeText style={styles.logEmptyText}>
                      {lstrings.settings_debug_info_log_dev}
                    </EdgeText>
                  ) : logsInfo.trim() !== '' ? (
                    <Text selectable style={styles.logText}>
                      {logsInfo}
                    </Text>
                  ) : (
                    <EdgeText style={styles.logEmptyText}>
                      {lstrings.settings_debug_no_logs}
                    </EdgeText>
                  )}
                </ScrollView>
              ) : null}

              <EdgeTouchableOpacity
                style={styles.logSubHeader}
                onPress={handleToggleActivityLog}
                onLongPress={handleLongPressActivityLog}
              >
                <EdgeText style={styles.logSectionLabel}>
                  {lstrings.settings_debug_activity_log}
                </EdgeText>
                <Ionicons
                  name={showActivityLog ? 'chevron-up' : 'chevron-down'}
                  size={theme.rem(1)}
                  color={theme.iconTappable}
                />
              </EdgeTouchableOpacity>
              {showActivityLog ? (
                <ScrollView style={styles.logBox} nestedScrollEnabled>
                  {logsActivity.trim() !== '' ? (
                    <Text selectable style={styles.logText}>
                      {logsActivity}
                    </Text>
                  ) : (
                    <EdgeText style={styles.logEmptyText}>
                      {lstrings.settings_debug_no_logs}
                    </EdgeText>
                  )}
                </ScrollView>
              ) : null}
            </>
          ) : null}
        </View>
      </SectionView>
    </SceneWrapper>
  )
}

// ---------------------------------------------------------------------------
// Sub-components (avoid inline arrow fns in JSX handlers)
// ---------------------------------------------------------------------------

const NodesWalletSection: React.FC<NodesWalletSectionProps> = props => {
  const { wallet, dumpResult, isExpanded, isLoading, onToggle, onLongPress } =
    props
  const theme = useTheme()
  const styles = getStyles(theme)

  const handleToggle = useHandler(() => {
    onToggle(wallet.id)
  })

  const handleLongPress = useHandler(() => {
    onLongPress(wallet.id)
  })

  const walletLabel = getWalletLabel(wallet)

  const data = dumpResult?.dump?.data
  const pluginState = data?.pluginState as Record<string, unknown> | undefined

  return (
    <View>
      <EdgeTouchableOpacity
        style={styles.walletHeader}
        onPress={handleToggle}
        onLongPress={handleLongPress}
      >
        <EdgeText style={styles.walletTitle} numberOfLines={1}>
          {walletLabel}
        </EdgeText>
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.iconTappable} />
        ) : (
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={theme.rem(1)}
            color={theme.iconTappable}
          />
        )}
      </EdgeTouchableOpacity>
      {isExpanded && data != null ? (
        <View style={styles.walletContent}>
          {pluginState != null ? (
            <>
              <EdgeText style={styles.subLabel}>
                {lstrings.settings_debug_active_servers}
              </EdgeText>
              <ScrollView style={styles.jsonBox} nestedScrollEnabled>
                <Text selectable style={styles.logText}>
                  {JSON.stringify(
                    pluginState['pluginState.servers_'] ?? {},
                    null,
                    2
                  )}
                </Text>
              </ScrollView>

              <EdgeText style={styles.subLabel}>
                {lstrings.settings_debug_info_servers}
              </EdgeText>
              <ScrollView style={styles.jsonBox} nestedScrollEnabled>
                <Text selectable style={styles.logText}>
                  {JSON.stringify(pluginState.infoServers ?? [], null, 2)}
                </Text>
              </ScrollView>

              <EdgeText style={styles.subLabel}>
                {lstrings.settings_debug_custom_servers}
              </EdgeText>
              <ScrollView style={styles.jsonBox} nestedScrollEnabled>
                <Text selectable style={styles.logText}>
                  {JSON.stringify(pluginState.customServers ?? [], null, 2)}
                </Text>
              </ScrollView>
            </>
          ) : null}

          <EdgeText style={styles.subLabel}>
            {lstrings.settings_debug_user_settings}
          </EdgeText>
          <ScrollView style={styles.jsonBox} nestedScrollEnabled>
            <Text selectable style={styles.logText}>
              {JSON.stringify(
                wallet.currencyConfig.userSettings ?? {},
                null,
                2
              )}
            </Text>
          </ScrollView>

          {data.networkConfig != null ? (
            <>
              <EdgeText style={styles.subLabel}>
                {lstrings.settings_debug_network_config}
              </EdgeText>
              <ScrollView style={styles.jsonBox} nestedScrollEnabled>
                <Text selectable style={styles.logText}>
                  {JSON.stringify(data.networkConfig, null, 2)}
                </Text>
              </ScrollView>
            </>
          ) : null}
        </View>
      ) : null}
      {isExpanded && dumpResult?.error != null ? (
        <Text selectable style={styles.errorText}>
          {dumpResult.error}
        </Text>
      ) : null}
    </View>
  )
}

const DumpWalletRow: React.FC<DumpWalletRowProps> = props => {
  const { wallet, dumpResult, isExpanded, isLoading, onPress, onLongPress } =
    props
  const theme = useTheme()
  const styles = getStyles(theme)

  const handlePress = useHandler(() => {
    onPress(wallet.id)
  })

  const handleLongPress = useHandler(() => {
    onLongPress(wallet.id)
  })

  const walletLabel = getWalletLabel(wallet)

  return (
    <View>
      <EdgeTouchableOpacity
        style={styles.walletHeader}
        onPress={handlePress}
        onLongPress={handleLongPress}
      >
        <EdgeText style={styles.walletTitle} numberOfLines={1}>
          {walletLabel}
        </EdgeText>
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.iconTappable} />
        ) : (
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={theme.rem(1)}
            color={theme.iconTappable}
          />
        )}
      </EdgeTouchableOpacity>
      {isExpanded && dumpResult?.dump != null ? (
        <ScrollView style={styles.logBox} nestedScrollEnabled>
          <Text selectable style={styles.logText}>
            {JSON.stringify(dumpResult.dump, null, 2)}
          </Text>
        </ScrollView>
      ) : null}
      {isExpanded && dumpResult?.error != null ? (
        <Text selectable style={styles.errorText}>
          {dumpResult.error}
        </Text>
      ) : null}
    </View>
  )
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

const getWalletLabel = (wallet: EdgeCurrencyWallet): string =>
  `${wallet.name ?? wallet.currencyInfo.currencyCode} (${
    wallet.currencyInfo.pluginId
  })`

/**
 * Build the nodes/servers content object for a wallet.
 * UTXO wallets nest server lists under `data.pluginState`.
 * Accountbased wallets provide `data.networkConfig` instead.
 */
const getNodesContent = (
  data: Record<string, unknown>,
  wallet: EdgeCurrencyWallet
): Record<string, unknown> => {
  const pluginState = data.pluginState as Record<string, unknown> | undefined
  const content: Record<string, unknown> = {}

  if (pluginState != null) {
    content.activeServers = pluginState['pluginState.servers_'] ?? {}
    content.infoServers = pluginState.infoServers ?? []
    content.customServers = pluginState.customServers ?? []
    content.enableCustomServers = pluginState.enableCustomServers ?? false
  }

  content.userSettings = wallet.currencyConfig.userSettings ?? {}

  if (data.networkConfig != null) {
    content.networkConfig = data.networkConfig
  }

  return content
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const getStyles = cacheStyles((theme: Theme) => ({
  hintText: {
    fontSize: theme.rem(0.7),
    color: theme.deactivatedText,
    textAlign: 'center',
    paddingVertical: theme.rem(0.5)
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.rem(0.75)
  },
  sectionTitle: {
    fontSize: theme.rem(1),
    fontFamily: theme.fontFaceMedium
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.rem(0.5),
    paddingHorizontal: theme.rem(0.75)
  },
  walletTitle: {
    fontSize: theme.rem(0.875),
    fontFamily: theme.fontFaceMedium,
    flexShrink: 1,
    marginRight: theme.rem(0.5)
  },
  walletContent: {
    paddingHorizontal: theme.rem(0.75),
    paddingBottom: theme.rem(0.5)
  },
  subLabel: {
    fontSize: theme.rem(0.8),
    fontFamily: theme.fontFaceBold,
    marginTop: theme.rem(0.5),
    marginBottom: theme.rem(0.25)
  },
  jsonBox: {
    maxHeight: theme.rem(12),
    marginBottom: theme.rem(0.25),
    padding: theme.rem(0.5),
    backgroundColor: theme.tileBackground,
    borderRadius: theme.rem(0.5),
    borderWidth: 1,
    borderColor: theme.lineDivider
  },
  logText: {
    fontSize: theme.rem(0.5),
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: theme.primaryText
  },
  logSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.rem(0.5),
    paddingHorizontal: theme.rem(0.75)
  },
  logSectionLabel: {
    fontSize: theme.rem(0.9),
    fontFamily: theme.fontFaceBold
  },
  logBox: {
    maxHeight: theme.rem(20),
    marginHorizontal: theme.rem(0.5),
    marginBottom: theme.rem(0.5),
    padding: theme.rem(0.5),
    backgroundColor: theme.tileBackground,
    borderRadius: theme.rem(0.5),
    borderWidth: 1,
    borderColor: theme.lineDivider
  },
  logEmptyText: {
    fontSize: theme.rem(0.75),
    color: theme.deactivatedText
  },
  errorText: {
    fontSize: theme.rem(0.65),
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: theme.dangerText,
    padding: theme.rem(0.5)
  },
  emptyText: {
    padding: theme.rem(0.75)
  }
}))
