import * as React from 'react'
import { FlatList } from 'react-native'

import { showCountrySelectionModal } from '../../actions/CountryListActions'
import { readSyncedSettings } from '../../actions/SettingsActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import {
  asPhazeUser,
  PHAZE_IDENTITY_DISKLET_NAME
} from '../../plugins/gift-cards/phazeGiftCardTypes'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { getDiskletFormData } from '../../util/formUtils'
import { SceneButtons } from '../buttons/SceneButtons'
import { SceneWrapper } from '../common/SceneWrapper'
import { SceneContainer } from '../layout/SceneContainer'
import { useTheme } from '../services/ThemeContext'
import { Paragraph } from '../themed/EdgeText'

interface Props extends EdgeAppSceneProps<'giftCardList'> {}

export const GiftCardListScene: React.FC<Props> = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const dispatch = useDispatch()

  const disklet = useSelector(state => state.core.disklet)
  const account = useSelector(state => state.core.account)
  const { countryCode, stateProvinceCode } = useSelector(
    state => state.ui.settings
  )

  const handlePurchaseNew = useHandler(async () => {
    // Check for saved user with userApiKey:
    const phazeUser = await getDiskletFormData(
      disklet,
      PHAZE_IDENTITY_DISKLET_NAME,
      asPhazeUser
    )
    if (phazeUser?.userApiKey == null) {
      navigation.navigate('giftCardIdentityForm')
      return
    }
    // Ensure country is set:
    let nextCountryCode = countryCode
    if (nextCountryCode === '') {
      await dispatch(
        showCountrySelectionModal({
          account,
          countryCode: '',
          stateProvinceCode
        })
      )
      // Re-read from synced settings to determine if user actually selected:
      const synced = await readSyncedSettings(account)
      nextCountryCode = synced.countryCode ?? ''
    }
    // Only navigate if we have a country code selected:
    if (nextCountryCode !== '') {
      navigation.navigate('giftCardMarket')
    }
  })

  const renderEmpty = React.useCallback(() => {
    return <Paragraph center>{lstrings.gift_card_list_no_cards}</Paragraph>
  }, [])

  return (
    <SceneWrapper hasTabs>
      {({ insetStyle }) => (
        <SceneContainer headerTitle={lstrings.title_gift_card_list}>
          <FlatList
            data={[]}
            keyExtractor={(_item, index) => String(index)}
            renderItem={() => null}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingTop: insetStyle.paddingTop + theme.rem(0.5),
              paddingBottom: insetStyle.paddingBottom + theme.rem(0.5),
              paddingLeft: insetStyle.paddingLeft + theme.rem(0.5),
              paddingRight: insetStyle.paddingRight + theme.rem(0.5),
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center'
            }}
            ListEmptyComponent={renderEmpty}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          />

          <SceneButtons
            primary={{
              label: lstrings.gift_card_list_purchase_new_button,
              onPress: handlePurchaseNew
            }}
          />
        </SceneContainer>
      )}
    </SceneWrapper>
  )
}
