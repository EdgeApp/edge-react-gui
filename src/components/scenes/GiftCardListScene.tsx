import * as React from 'react'
import { FlatList, View } from 'react-native'

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
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { Paragraph } from '../themed/EdgeText'
import { SceneHeaderUi4 } from '../themed/SceneHeaderUi4'

interface Props extends EdgeAppSceneProps<'giftCardList'> {}

export const GiftCardListScene: React.FC<Props> = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)
  // Use account.disklet for synced storage across devices
  const disklet = account.disklet
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
    <SceneWrapper>
      {({ insetStyle, undoInsetStyle }) => (
        <View style={{ ...undoInsetStyle, marginTop: 0 }}>
          <SceneHeaderUi4 title={lstrings.title_gift_card_list} />
          <FlatList
            automaticallyAdjustContentInsets={false}
            data={[]}
            keyExtractor={(_item, index) => String(index)}
            renderItem={() => null}
            style={styles.list}
            contentContainerStyle={{
              paddingTop: theme.rem(0.5),
              paddingBottom: insetStyle.paddingBottom,
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
        </View>
      )}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  list: {
    flex: 1
  }
}))
