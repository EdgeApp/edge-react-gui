import * as React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import visaBrandImage from '../../../assets/images/guiPlugins/visaBrand.png'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { styled } from '../../../components/hoc/styled'
import { Space } from '../../../components/layout/Space'
import { ButtonsModal } from '../../../components/modals/ButtonsModal'
import { Shimmer } from '../../../components/progress-indicators/Shimmer'
import { Airship, showError } from '../../../components/services/AirshipInstance'
import { useTheme } from '../../../components/services/ThemeContext'
import { DividerLine } from '../../../components/themed/DividerLine'
import { EdgeText } from '../../../components/themed/EdgeText'
import { MainButton } from '../../../components/themed/MainButton'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { useHandler } from '../../../hooks/useHandler'
import { toLocaleDate } from '../../../locales/intl'
import { lstrings } from '../../../locales/strings'
import { useState } from '../../../types/reactHooks'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { RewardsCardItem } from '../RewardsCardPlugin'

export interface RewardsCardDashboardParams {
  items: RewardsCardItem[]
  onCardLongPress: (card: RewardsCardItem) => void
  onCardPress: (card: RewardsCardItem) => void
  onHelpPress: () => void
  onNewPress: () => void
  onRemovePress: (item: RewardsCardItem) => void
  showLoading?: boolean
}

interface Props extends EdgeSceneProps<'rewardsCardDashboard'> {}

export const RewardsCardDashboardScene = (props: Props) => {
  const { route } = props
  const { items, onCardLongPress, onCardPress, onHelpPress, onNewPress, onRemovePress, showLoading = false } = route.params
  const theme = useTheme()
  const [bottomFloatHeight, setBottomFloatHeight] = useState(0)

  const handleHelpPress = useHandler(() => {
    onHelpPress()
  })
  const handleRemovePress = useHandler((item: RewardsCardItem) => {
    onRemovePress(item)
  })
  const handleQuestionPress = useHandler(() => {
    Airship.show<string | number | undefined>(bridge => (
      <ButtonsModal bridge={bridge} title={lstrings.rewards_card_loading} message={lstrings.rewards_card_purchase_disclaimer} closeArrow buttons={{}} />
    )).catch(showError)
  })

  return (
    <>
      <SceneWrapper keyboardShouldPersistTaps="handled" background="theme" hasHeader scroll hasTabs>
        <SceneHeader
          title={lstrings.rewards_card_dashboard_title}
          tertiary={
            <TouchableOpacity onPress={handleHelpPress}>
              <Ionicon name="help-circle-outline" size={theme.rem(1.5)} color={theme.iconTappable} />
            </TouchableOpacity>
          }
          underline
          withTopMargin
        />
        <DividerLine marginRem={[0, 1]} />
        <CardList bottomSpace={bottomFloatHeight}>
          {items.map(item => {
            return (
              <RewardsCard
                key={item.id}
                item={item}
                onLongPress={() => onCardLongPress(item)}
                onPress={() => onCardPress(item)}
                onRemovePress={() => handleRemovePress(item)}
                shouldStack
              />
            )
          })}
          {items.length === 0 && !showLoading ? <MessageText>{lstrings.no_active_cards_message}</MessageText> : null}
          {showLoading ? <RewardsCard onQuestionPress={handleQuestionPress} /> : null}
        </CardList>
      </SceneWrapper>
      <BottomFloat onLayout={event => setBottomFloatHeight(event.nativeEvent.layout.height)}>
        <Space around={1}>
          <MainButton onPress={onNewPress} label={lstrings.buy_new_card_button} />
        </Space>
      </BottomFloat>
    </>
  )
}

export interface RewardsCardProps {
  item?: RewardsCardItem
  onLongPress?: () => void
  onPress?: () => void
  onQuestionPress?: () => void
  onRemovePress?: () => void
  shouldStack?: boolean
}

export const RewardsCard = (props: RewardsCardProps) => {
  const { item, onLongPress, onPress, onQuestionPress, onRemovePress, shouldStack = false } = props
  const theme = useTheme()
  const purchaseAmount = item?.amount == null ? 'Unknown' : `$${item.amount.toString()}`
  const purchaseAsset = item?.purchaseAsset ?? 'Unknown'

  return (
    <CardContainer>
      <CardBackground />
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        // Disable opacity effect if no onPress handler
        activeOpacity={onPress == null ? 1 : undefined}
      >
        <CardInner shouldStack={shouldStack}>
          <CardHeader>
            <Space sideways>
              <VisaBrandImage source={visaBrandImage} />
              {onPress == null ? null : <Ionicon name="chevron-forward-outline" size={theme.rem(1.5)} color={theme.iconTappable} />}
            </Space>
            {onRemovePress == null ? null : (
              <TouchableOpacity onPress={onRemovePress}>
                <Ionicon name="remove-circle-outline" size={theme.rem(1.5)} color={theme.dangerIcon} />
              </TouchableOpacity>
            )}
            {onQuestionPress == null ? null : (
              <TouchableOpacity onPress={onQuestionPress}>
                <Ionicon name="help-circle-outline" size={theme.rem(1.5)} color={theme.iconTappable} />
              </TouchableOpacity>
            )}
          </CardHeader>
          <Space expand>
            <Space bottom={0.5} sideways expand>
              <Space>
                <CardFieldLabel>{lstrings.purchase_date_label}</CardFieldLabel>
                <Space>
                  <Shimmer isShown={item == null} />
                  <CardFieldValue>{item == null ? ' ' : toLocaleDate(item.creationDate)}</CardFieldValue>
                </Space>
              </Space>
              <Space>
                <CardFieldLabel textAlign="right">{lstrings.purchase_price_label}</CardFieldLabel>
                <Space>
                  <Shimmer isShown={item == null} />
                  <CardFieldValue textAlign="right">{item == null ? ' ' : purchaseAmount}</CardFieldValue>
                </Space>
              </Space>
            </Space>
            <Space sideways expand>
              <Space>
                <CardFieldLabel>{lstrings.string_expires}</CardFieldLabel>
                <Space>
                  <Shimmer isShown={item == null} />
                  <CardFieldValue>{item == null ? ' ' : toLocaleDate(item.expirationDate)}</CardFieldValue>
                </Space>
              </Space>
              <Space>
                <CardFieldLabel textAlign="right">{lstrings.purchase_asset_label}</CardFieldLabel>
                <Space>
                  <Shimmer isShown={item == null} />
                  <CardFieldValue textAlign="right">{item == null ? ' ' : purchaseAsset}</CardFieldValue>
                </Space>
              </Space>
            </Space>
          </Space>
        </CardInner>
      </TouchableOpacity>
    </CardContainer>
  )
}

const MessageText = styled(EdgeText)(theme => ({
  fontFamily: theme.fontFaceMedium,
  color: theme.secondaryText,
  textAlign: 'center'
}))

const CardList = styled(View)<{ bottomSpace: number }>(theme => props => ({
  marginBottom: props.bottomSpace,
  padding: theme.rem(1.5)
}))

const CardContainer = styled(View)(theme => ({
  maxWidth: theme.rem(20),
  width: '100%',
  alignSelf: 'center'
}))

const CardBackground = styled(View)(theme => ({
  // This is the aspect ratio of a standard US credit card
  aspectRatio: 1.5882352941,
  backgroundColor: theme.modal,
  // 0.75 rem is roughly proportional to a 1/8th inches border radius of a standard US credit card
  borderRadius: theme.rem(0.75),
  borderWidth: 1,
  borderTopColor: 'rgba(255,255,255,.2)',
  borderColor: 'rgba(255,255,255,.1)',
  position: 'absolute',
  shadowOpacity: 0.5,
  shadowRadius: theme.rem(0.5),
  width: '100%'
}))

const CardInner = styled(View)<{ shouldStack?: boolean }>(theme => props => ({
  aspectRatio: props.shouldStack === false ? 1.5882352941 : undefined,
  padding: theme.rem(1.25)
}))

const BottomFloat = styled(View)(theme => ({
  alignSelf: 'center',
  bottom: 0,
  position: 'absolute'
}))

const CardHeader = styled(View)(_props => ({
  flexDirection: 'row',
  justifyContent: 'space-between'
}))

const VisaBrandImage = styled(Image)(theme => ({
  resizeMode: 'contain',
  height: theme.rem(1.75),
  width: theme.rem(4),
  marginBottom: theme.rem(1.25),
  marginRight: theme.rem(0.5)
}))

const CardFieldLabel = styled(Text)<{ textAlign?: 'left' | 'right' }>(theme => props => ({
  color: theme.secondaryText,
  fontFamily: theme.fontFaceDefault,
  fontSize: theme.rem(0.7),
  includeFontPadding: false,
  textAlign: props.textAlign ?? 'left'
}))

const CardFieldValue = styled(Text)<{ textAlign?: 'left' | 'right' }>(theme => props => ({
  color: theme.primaryText,
  fontFamily: theme.fontFaceDefault,
  fontSize: theme.rem(0.8),
  includeFontPadding: false,
  textAlign: props.textAlign ?? 'left'
}))
