import React, { useEffect } from 'react'
import { TouchableOpacity } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { Keyboard } from 'react-native-ui-lib'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDrawerOpenRatio } from '../../state/SceneDrawerState'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { styled } from '../hoc/styled'
import { Space } from '../layout/Space'
import { useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'
import { OutlinedTextInput, OutlinedTextInputRef } from './OutlinedTextInput'

export const WalletListSearch = () => {
  const theme = useTheme()
  const searchText = useSelector(state => state.menuSearch.searchText)
  const isSearching = useSelector(state => state.menuSearch.isSearching)
  const dispatch = useDispatch()

  const textInputRef = React.useRef<OutlinedTextInputRef>(null)

  const { setIsRatioDisabled } = useDrawerOpenRatio()

  const handleDonePress = useHandler(() => {
    dispatch({
      type: 'MENU_SEARCH/SET_IS_SEARCHING',
      data: false
    })
    if (textInputRef.current != null) {
      textInputRef.current.clear()
    }
  })

  const handleSearchChangeText = useHandler((text: string) => {
    dispatch({
      type: 'MENU_SEARCH/SET_TEXT',
      data: text
    })
  })

  const handleSearchFocus = useHandler(() => {
    dispatch({
      type: 'MENU_SEARCH/SET_IS_SEARCHING',
      data: true
    })
  })

  useEffect(() => {
    if (setIsRatioDisabled != null) setIsRatioDisabled(isSearching)
    if (isSearching && textInputRef.current) {
      textInputRef.current.focus()
    }
    if (!isSearching && textInputRef.current) {
      textInputRef.current.blur()
    }
  }, [isSearching, setIsRatioDisabled])

  return (
    <Keyboard.KeyboardTrackingView usesBottomTabs>
      <LinearGradient colors={theme.tabBarBackground} start={theme.tabBarBackgroundStart} end={theme.tabBarBackgroundEnd}>
        <Space sideways around={1}>
          <Space expand>
            <OutlinedTextInput
              returnKeyType="search"
              label={lstrings.wallet_list_wallet_search}
              onChangeText={handleSearchChangeText}
              value={searchText}
              onFocus={handleSearchFocus}
              ref={textInputRef}
              searchIcon
              marginRem={0}
            />
          </Space>
          {isSearching && (
            <DoneButton onPress={handleDonePress}>
              <Space left={0.5}>
                <EdgeText style={{ color: theme.textLink }}>{lstrings.string_done_cap}</EdgeText>
              </Space>
            </DoneButton>
          )}
        </Space>
      </LinearGradient>
    </Keyboard.KeyboardTrackingView>
  )
}

const DoneButton = styled(TouchableOpacity)(() => ({
  justifyContent: 'center'
}))
