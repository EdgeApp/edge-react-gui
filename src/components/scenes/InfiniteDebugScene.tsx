import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { ENV } from '../../env'
import { useHandler } from '../../hooks/useHandler'
import { makeInfiniteApi } from '../../plugins/ramps/infinite/infiniteApi'
import type { InfiniteApi } from '../../plugins/ramps/infinite/infiniteApiTypes'
import { useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { EdgeButton } from '../buttons/EdgeButton'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { styled } from '../hoc/styled'
import { SectionView } from '../layout/SectionView'
import { RadioListModal } from '../modals/RadioListModal'
import { Airship } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { ModalFilledTextInput } from '../themed/FilledTextInput'
import { SimpleTextInput } from '../themed/SimpleTextInput'

type Props = EdgeAppSceneProps<'infiniteDebug'>

type EndpointKey =
  | 'kycStatus'
  | 'tos'
  | 'accounts'
  | 'countries'
  | 'currencies'
  | 'transferStatus'
  | 'challenge'

interface EndpointOption {
  key: EndpointKey
  label: string
  paramKey?: 'customerId' | 'transferId' | 'publicKey'
}

const endpointOptions: EndpointOption[] = [
  {
    key: 'kycStatus',
    label: 'GET /customers/{customerId}/kyc-status',
    paramKey: 'customerId'
  },
  {
    key: 'tos',
    label: 'GET /customers/{customerId}/tos',
    paramKey: 'customerId'
  },
  {
    key: 'accounts',
    label: 'GET /customers/{customerId}/accounts',
    paramKey: 'customerId'
  },
  { key: 'countries', label: 'GET /countries' },
  { key: 'currencies', label: 'GET /currencies' },
  {
    key: 'transferStatus',
    label: 'GET /transfers/{transferId}',
    paramKey: 'transferId'
  },
  {
    key: 'challenge',
    label: 'GET /auth/wallet/challenge?publicKey={publicKey}',
    paramKey: 'publicKey'
  }
]

const INFINITE_PRIVATE_KEY = 'infinite_auth_private_key'
const INFINITE_PLUGIN_ID = 'infinite'

export const InfiniteDebugScene: React.FC<Props> = (props: Props) => {
  const theme = useTheme()
  const account = useSelector(state => state.core.account)

  const [api, setApi] = React.useState<InfiniteApi | null>(null)
  const [customerId, setCustomerId] = React.useState<string | null>(null)
  const [publicKey, setPublicKey] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState<boolean>(false)
  const [authError, setAuthError] = React.useState<string | null>(null)

  const [selected, setSelected] = React.useState<EndpointOption>(
    endpointOptions[0]
  )
  const [paramValue, setParamValue] = React.useState<string>('')
  const [result, setResult] = React.useState<string>('')

  // Initialize API and attempt to reuse stored private key to authenticate
  React.useEffect(() => {
    let cancelled = false

    const init = async (): Promise<void> => {
      try {
        const initOptions = ENV.RAMP_PLUGIN_INITS.infinite ?? {}
        // Expect apiUrl/orgId per docs
        // According to docs/infinite-headless-api.md, we need Organization ID and base API URL
        const infiniteApi = makeInfiniteApi(initOptions as any)
        if (cancelled) return
        setApi(infiniteApi)

        // Try to load existing private key saved by the plugin workflow
        const itemIds: string[] = await account.dataStore.listItemIds(
          INFINITE_PLUGIN_ID
        )
        if (!itemIds.includes(INFINITE_PRIVATE_KEY)) {
          setAuthError(
            'No Infinite private key found. Run Infinite flow first.'
          )
          return
        }
        const keyHex = await account.dataStore.getItem(
          INFINITE_PLUGIN_ID,
          INFINITE_PRIVATE_KEY
        )
        const keyBytes = hexToBytes(keyHex)
        const pubKey = infiniteApi.getPublicKeyFromPrivate(keyBytes)
        if (cancelled) return
        setPublicKey(pubKey)

        // Authenticate to populate token & customerId
        const challenge = await infiniteApi.getChallenge(pubKey)
        const signature = infiniteApi.signChallenge(challenge.message, keyBytes)
        await infiniteApi.verifySignature({
          public_key: pubKey,
          signature,
          nonce: challenge.nonce,
          platform: 'mobile'
        })

        const authState = infiniteApi.getAuthState()
        if (authState.customerId != null) {
          setCustomerId(authState.customerId)
          // Prefill default param for customer-id endpoints
          if (selected.paramKey === 'customerId')
            setParamValue(authState.customerId)
        }
      } catch (e: any) {
        setAuthError(String(e?.message ?? e))
      }
    }

    init().catch(() => {})

    return () => {
      cancelled = true
    }
  }, [account.dataStore, selected.paramKey])

  // Handlers
  const handleOpenDropdown = useHandler(async () => {
    const result = await Airship.show<string | undefined>(bridge => (
      <RadioListModal
        bridge={bridge}
        title="Select Infinite GET endpoint"
        items={endpointOptions.map(opt => ({
          icon: '',
          name: opt.key,
          text: opt.label
        }))}
        selected={selected.key}
      />
    ))
    if (result != null) {
      const found = endpointOptions.find(o => o.key === result)
      if (found != null) {
        setSelected(found)
        // Update param default on selection
        if (found.paramKey === 'customerId') setParamValue(customerId ?? '')
        else if (found.paramKey === 'publicKey') setParamValue(publicKey ?? '')
        else setParamValue('')
        setResult('')
      }
    }
  })

  const handleParamChange = useHandler((text: string) => {
    setParamValue(text)
  })

  const handleSubmit = useHandler(async () => {
    if (api == null) return
    setLoading(true)
    setResult('')
    try {
      let data: unknown
      switch (selected.key) {
        case 'kycStatus': {
          const cid = paramValue || customerId
          if (cid == null) throw new Error('Missing customerId')
          data = await api.getKycStatus(cid)
          break
        }
        case 'tos': {
          const cid = paramValue || customerId
          if (cid == null) throw new Error('Missing customerId')
          data = await api.getTos(cid)
          break
        }
        case 'accounts': {
          const cid = paramValue || customerId
          if (cid == null) throw new Error('Missing customerId')
          data = await api.getCustomerAccounts(cid)
          break
        }
        case 'countries': {
          data = await api.getCountries()
          break
        }
        case 'currencies': {
          data = await api.getCurrencies()
          break
        }
        case 'transferStatus': {
          if (paramValue === '') throw new Error('Enter transferId')
          data = await api.getTransferStatus(paramValue)
          break
        }
        case 'challenge': {
          const pk = paramValue || publicKey
          if (pk == null || pk === '') throw new Error('Missing publicKey')
          data = await api.getChallenge(pk)
          break
        }
        default:
          data = { error: 'Unsupported selection' }
      }
      setResult(JSON.stringify(data, null, 2))
    } catch (e: any) {
      setResult(String(e?.message ?? e))
    } finally {
      setLoading(false)
    }
  })

  return (
    <SceneWrapper>
      <SectionView>
        <SectionHeader leftTitle="Infinite API - GET tester" />
        <Row>
          <EdgeButton
            marginRem={0.5}
            label={selected.label}
            onPress={handleOpenDropdown}
            type="secondary"
          />
        </Row>
        {selected.paramKey == null ? null : (
          <SimpleTextInput
            value={paramValue}
            onChangeText={handleParamChange}
            autoFocus={false}
            placeholder={selected.paramKey}
            aroundRem={0.5}
          />
        )}
        <Row>
          <EdgeButton
            marginRem={0.5}
            label="Submit"
            onPress={handleSubmit}
            type="primary"
            spinner={loading}
          />
          {loading ? <ActivityIndicator color={theme.iconTappable} /> : null}
        </Row>
        {authError == null ? null : (
          <ModalFilledTextInput
            value={authError}
            onChangeText={() => {}}
            autoFocus={false}
            placeholder="Auth error"
            multiline
            numberOfLines={6}
          />
        )}
        <ModalFilledTextInput
          value={result}
          onChangeText={() => {}}
          autoFocus={false}
          placeholder="Result JSON"
          multiline
          numberOfLines={20}
        />
      </SectionView>
    </SceneWrapper>
  )
}

const Row = styled(View)(theme => {
  return {
    flexDirection: 'row',
    alignItems: 'center'
  }
})

// Utils copied from authenticate workflow
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16)
  }
  return bytes
}
