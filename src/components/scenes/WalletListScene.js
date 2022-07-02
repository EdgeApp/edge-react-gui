// @flow

import * as React from 'react'
import { ActivityIndicator, Animated, Image, SafeAreaView, Text, TouchableOpacity, View } from 'react-native'
// import { interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { updateWalletsSort } from '../../actions/WalletListActions.js'
import { Fontello } from '../../assets/vector/index.js'
import { useAsyncEffect } from '../../hooks/useAsyncEffect.js'
import { useHandler } from '../../hooks/useHandler.js'
import { useWatchAccount } from '../../hooks/useWatch.js'
import s from '../../locales/strings.js'
import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { useMemo, useRef, useState } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { getWalletListSlideTutorial, setUserTutorialList } from '../../util/tutorial.js'
import { PromoCard } from '../cards/PromoCard.js'
import { CrossFade } from '../common/CrossFade.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ButtonsModal } from '../modals/ButtonsModal.js'
import { PasswordReminderModal } from '../modals/PasswordReminderModal.js'
import { WalletListSortModal } from '../modals/WalletListSortModal.js'
import { Airship, showError } from '../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { SceneHeader } from '../themed/SceneHeader.js'
import { WalletListFooter } from '../themed/WalletListFooter.js'
import { WalletListHeader } from '../themed/WalletListHeader.js'
import { WalletListSortable } from '../themed/WalletListSortable.js'
import { WalletListSwipeable } from '../themed/WalletListSwipeable.js'
import { WiredBalanceBox } from '../themed/WiredBalanceBox.js'
import { WiredProgressBar } from '../themed/WiredProgressBar.js'

type Props = {
  navigation: NavigationProp<'walletList'>
}

export function WalletListScene(props: Props) {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const [sorting, setSorting] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [showSlidingTutorial, setShowTutorial] = useState(false)

  const account = useSelector(state => state.core.account)
  const disklet = useSelector(state => state.core.disklet)
  const needsPasswordCheck = useSelector(state => state.ui.passwordReminder.needsPasswordCheck)
  const sortOption = useSelector(state => state.ui.settings.walletsSort)

  // Subscribe to account state:
  const currencyWallets = useWatchAccount(account, 'currencyWallets')
  const loading = Object.keys(currencyWallets).length <= 0

  const handleSort = useHandler(() => {
    Airship.show(bridge => <WalletListSortModal sortOption={sortOption} bridge={bridge} />)
      .then(sort => {
        if (sort == null) return
        if (sort !== sortOption) dispatch(updateWalletsSort(sort))
        if (sort === 'manual') setSorting(true)
      })
      .catch(showError)
  })

  const handleRefresh = useHandler(() => {
    setSearching(true)
  })

  // Show the tutorial or password reminder on mount:
  useAsyncEffect(
    async () => {
      if (needsPasswordCheck) {
        await Airship.show(bridge => <PasswordReminderModal bridge={bridge} />)
      } else {
        const userTutorialList = await getWalletListSlideTutorial(disklet)
        const tutorialCount = userTutorialList.walletListSlideTutorialCount || 0

        if (tutorialCount < 2) {
          Airship.show(bridge => (
            <ButtonsModal
              bridge={bridge}
              title={s.strings.wallet_list_swipe_tutorial_title}
              buttons={{
                gotIt: { label: s.strings.string_got_it }
              }}
            >
              <Image
                source={theme.walletListSlideTutorialImage}
                resizeMode="contain"
                style={{ height: theme.rem(3), width: 'auto', marginHorizontal: theme.rem(0.5), marginVertical: theme.rem(1) }}
              />
            </ButtonsModal>
          ))
          setShowTutorial(true)
          userTutorialList.walletListSlideTutorialCount = tutorialCount + 1
          await setUserTutorialList(userTutorialList, disklet)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // rendering -------------------------------------------------------------

  const footer = useMemo(() => {
    return <WalletListFooter navigation={navigation} />
  }, [navigation])

  const header = !sorting && !searching && (
    <Gradient>
      <View style={styles.headerContainer}>
        <EdgeText style={styles.headerText}>{s.strings.title_wallets}</EdgeText>
        <View key="defaultButtons" style={styles.headerButtonsContainer}>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.push('createWalletSelectCrypto')}>
            <Ionicon name="md-add" size={theme.rem(1.5)} color={theme.iconTappable} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSort}>
            <Fontello name="sort" size={theme.rem(1.5)} color={theme.iconTappable} />
          </TouchableOpacity>
        </View>
      </View>
    </Gradient>
  )

  // Constants for header
  const HEADER_MAX_HEIGHT = theme.rem(5)

  // Scrolling configs
  // const scrollY = useSharedValue(0)
  const scrollY = useRef(new Animated.Value(0))
  const scrollYClamped = Animated.diffClamp(scrollY.current, 0, HEADER_MAX_HEIGHT)
  const translateY = scrollYClamped.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT],
    outputRange: [0, -HEADER_MAX_HEIGHT]
  })

  const translateYNumber = useRef(0)

  translateY.addListener(({ value }) => {
    translateYNumber.current = value
  })

  // const animatedStyles = useAnimatedStyle(() => {
  //   if (searching) return {}
  //   const translateY = interpolate(scrollY.value, [0, HEADER_MAX_HEIGHT], [0, -HEADER_MAX_HEIGHT / 2], 'clamp')
  //   return {
  //     transform: [{ translateY }]
  //   }
  // })

  // const ref = useRef(null)

  return (
    <SceneWrapper>
      <WiredProgressBar />
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.header, { transform: [{ translateY }] }]}>
          <Gradient>
            <SceneHeader underline>
              <View style={styles.balance}>
                {sorting && (
                  <View style={styles.headerContainer}>
                    <EdgeText style={styles.headerText}>{s.strings.title_wallets}</EdgeText>
                    <TouchableOpacity key="doneButton" style={styles.headerButtonsContainer} onPress={() => setSorting(false)}>
                      <EdgeText style={styles.doneButton}>{s.strings.string_done_cap}</EdgeText>
                    </TouchableOpacity>
                  </View>
                )}

                <WalletListHeader
                  navigation={navigation}
                  sorting={sorting}
                  searching={searching}
                  searchText={searchText}
                  openSortModal={handleSort}
                  onChangeSearchText={setSearchText}
                  onChangeSearchingState={setSearching}
                />

                {!searching && !sorting && <WiredBalanceBox />}
              </View>
            </SceneHeader>
          </Gradient>
        </Animated.View>

        <View style={styles.listStack}>
          <CrossFade activeKey={loading ? 'spinner' : sorting ? 'sortList' : 'fullList'}>
            <ActivityIndicator key="spinner" color={theme.primaryText} style={styles.listSpinner} size="large" />
            <WalletListSwipeable
              scrollY={scrollY}
              headerMaxHeight={HEADER_MAX_HEIGHT}
              translateYNumber={translateYNumber}
              key="fullList"
              header={header}
              footer={searching ? null : footer}
              navigation={navigation}
              searching={searching}
              searchText={searchText}
              showSlidingTutorial={showSlidingTutorial}
              onRefresh={handleRefresh}
            />
            <WalletListSortable key="sortList" />
          </CrossFade>
        </View>
        {!searching && <PromoCard />}
      </SafeAreaView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  balance: {
    marginTop: theme.rem(1)
  },
  container: {
    flex: 1
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    zIndex: 1,
    heigth: theme.rem(10)
  },
  // The sort & add buttons are stacked on top of the header component:
  // Header Stack style
  headerContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.rem(1)
  },
  headerText: {
    flex: 1
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  doneButton: {
    color: theme.textLink
  },
  addButton: {
    marginRight: theme.rem(0.5)
  },
  // The two lists are stacked vertically on top of each other:
  listStack: {
    flexGrow: 1
  },
  listSpinner: {
    flexGrow: 1,
    alignSelf: 'center'
  }
}))
