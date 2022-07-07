// @flow

import * as React from 'react'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'

import s from '../../locales/strings.js'
import { useEffect, useRef } from '../../types/reactHooks.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { SceneHeader } from '../themed/SceneHeader.js'
import { WiredBalanceBox } from '../themed/WiredBalanceBox.js'
import { DynamicOutlinedTextInput } from './OutlinedTextInput.js'

type Props = {
  sorting: boolean,
  searching: boolean,
  searchText: string,
  scrollY: Animated.SharedValue<number>,
  isScrolling: Animated.SharedValue<boolean>,
  onChangeSearchText: (search: string) => void,
  onChangeSearchingState: (searching: boolean) => void
}

export function WalletListHeaderComponent(props: Props) {
  const { searchText, searching, sorting, onChangeSearchText, onChangeSearchingState, scrollY, isScrolling } = props
  const textInput = useRef(null)

  const theme = useTheme()
  const styles = getStyles(theme)

  useEffect(() => {
    if (searching === true && textInput.current) {
      textInput.current.focus()
    }
  }, [searching, textInput])

  const handleOnChangeText = (input: string) => onChangeSearchText(input)

  const handleTextFieldFocus = () => {
    onChangeSearchingState(true)
  }

  const handleSearchDone = () => {
    onChangeSearchingState(false)
    if (textInput.current) {
      textInput.current.clear()
    }
  }
  // Constants for header
  // const HEADER_MAX_HEIGHT = theme.rem(7)
  // const HEADER_HALF_HEIGHT = theme.rem(2.4)

  // const animatedStyles = useAnimatedStyle(() => {
  //   return {
  //     maxHeight: withTiming(searching ? HEADER_MAX_HEIGHT : HEADER_MAX_HEIGHT, { duration: 1000 }),
  //     opacity: withTiming(searching ? 1 : 1, { duration: 1000 })
  //   }
  // })

  return (
    <SceneHeader underline>
      <View>
        {!sorting && <WiredBalanceBox />}
        <View style={styles.searchContainer}>
          <View style={styles.searchTextInput}>
            <DynamicOutlinedTextInput
              scrollY={scrollY}
              isScrolling={isScrolling}
              returnKeyType="search"
              label={s.strings.wallet_list_wallet_search}
              onChangeText={handleOnChangeText}
              value={searchText}
              onFocus={handleTextFieldFocus}
              onSubmitEditing={handleSearchDone}
              ref={textInput}
              marginRem={[0, 0, 1]}
              searchIcon
            />
          </View>
        </View>
      </View>
    </SceneHeader>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  headerContainer: {
    flexDirection: 'row',
    marginTop: theme.rem(0.5),
    marginRight: theme.rem(1)
  },
  headerText: {
    flex: 1
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchTextInput: {
    flex: 1
  },
  addButton: {
    marginRight: theme.rem(0.5)
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.rem(0.5),
    marginRight: theme.rem(1)
  },
  searchDoneButton: {
    justifyContent: 'center',
    paddingLeft: theme.rem(0.75),
    paddingBottom: theme.rem(1)
  },
  searchDoneButtonText: {
    color: theme.textLink
  }
}))

export const WalletListHeader = WalletListHeaderComponent
