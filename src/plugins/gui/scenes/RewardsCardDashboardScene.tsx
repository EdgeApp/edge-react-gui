import * as React from 'react'
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import visaBrandImage from '../../../assets/images/guiPlugins/visaBrand.png'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { styled } from '../../../components/hoc/styled'
import { Space } from '../../../components/layout/Space'
import { useTheme } from '../../../components/services/ThemeContext'
import { DividerLine } from '../../../components/themed/DividerLine'
import { EdgeText } from '../../../components/themed/EdgeText'
import { MainButton } from '../../../components/themed/MainButton'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { useState } from '../../../types/reactHooks'
import { RouteProp } from '../../../types/routerTypes'
import { RewardsCardItem } from '../RewardsCardPlugin'

export interface RewardsCardDashboardParams {
  items: RewardsCardItem[]
  onCardPress: (card: RewardsCardItem) => void
  onHelpPress: () => void
  onNewPress: () => void
  onRemovePress: (item: RewardsCardItem) => void
  showLoading?: boolean
}

interface Props {
  route: RouteProp<'rewardsCardDashboard'>
}

export const RewardsCardDashboardScene = (props: Props) => {
  const { route } = props
  const { items, onCardPress, onHelpPress, onNewPress, onRemovePress, showLoading = false } = route.params
  const theme = useTheme()
  const [bottomFloatHeight, setBottomFloatHeight] = useState(0)

  const handleHelpPress = useHandler(() => {
    onHelpPress()
  })
  const handleRemovePress = useHandler((item: RewardsCardItem) => {
    onRemovePress(item)
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
            return <RewardsCard key={item.id} item={item} onPress={() => onCardPress(item)} onRemovePress={() => handleRemovePress(item)} shouldStack />
          })}
          {items.length === 0 && !showLoading ? <MessageText>{lstrings.rewards_card_no_cards}</MessageText> : null}
          {showLoading ? (
            <CardContainer>
              <CardBackground />
              <CardInner>
                <LoadingContainer>
                  <ActivityIndicator color={theme.iconTappable} size="large" style={{ margin: theme.rem(1) }} />
                  <LoadingText numberOfLines={0}>{lstrings.rewards_card_loading}</LoadingText>
                  <LoadingTextDisclaimer numberOfLines={0} minimumFontScale={0.75} adjustsFontSizeToFit>
                    {lstrings.rewards_card_purchase_disclaimer}
                  </LoadingTextDisclaimer>
                </LoadingContainer>
              </CardInner>
            </CardContainer>
          ) : null}
        </CardList>
      </SceneWrapper>
      <BottomFloat onLayout={event => setBottomFloatHeight(event.nativeEvent.layout.height)}>
        <Space around={1}>
          <MainButton onPress={onNewPress} label={lstrings.rewards_card_new_card_button_label} />
        </Space>
      </BottomFloat>
    </>
  )
}

export interface RewardsCardProps {
  item: RewardsCardItem
  onPress?: () => void
  onRemovePress?: () => void
  shouldStack?: boolean
}

export const RewardsCard = (props: RewardsCardProps) => {
  const { item, onPress, onRemovePress, shouldStack = false } = props
  const theme = useTheme()
  const purchaseAmount = `$${item.amount.toString()}`

  return (
    <CardContainer>
      <CardBackground />
      <TouchableOpacity
        onPress={onPress}
        // Disable opacity effect if no onPress handler
        activeOpacity={onPress == null ? 1 : undefined}
      >
        <CardInner shouldStack={shouldStack}>
          <CardHeader>
            <VisaBrandImage source={visaBrandImage} />
            {onRemovePress == null ? null : (
              <TouchableOpacity onPress={onRemovePress}>
                <Ionicon name="remove-circle-outline" size={theme.rem(1.5)} color={theme.dangerIcon} />
              </TouchableOpacity>
            )}
          </CardHeader>
          <Space expand>
            <Space bottom={0.5} sideways expand>
              <Space>
                <CardFieldLabel>{lstrings.rewards_card_dashboard_field_purchase_date_label}</CardFieldLabel>
                <CardFieldValue>{item.purchaseDate.toLocaleString()}</CardFieldValue>
              </Space>
              <Space>
                <CardFieldLabel textAlign="right">{lstrings.rewards_card_dashboard_field_purchase_price_label}</CardFieldLabel>
                <CardFieldValue textAlign="right">{purchaseAmount}</CardFieldValue>
              </Space>
            </Space>
            <Space sideways expand>
              <Space>
                <CardFieldLabel>{lstrings.rewards_card_dashboard_field_expires_label}</CardFieldLabel>
                <CardFieldValue>{item.expirationDate.toLocaleString()}</CardFieldValue>
              </Space>
              <Space>
                <CardFieldLabel textAlign="right">{lstrings.rewards_card_dashboard_field_purchase_asset_label}</CardFieldLabel>
                <CardFieldValue textAlign="right">{item.purchaseAsset}</CardFieldValue>
              </Space>
            </Space>
          </Space>
        </CardInner>
      </TouchableOpacity>
    </CardContainer>
  )
}

const MessageText = styled(EdgeText)(props => ({
  fontFamily: props.theme.fontFaceMedium,
  color: props.theme.secondaryText,
  textAlign: 'center'
}))

const CardList = styled(View)<{ bottomSpace: number }>(props => ({
  justifyContent: 'space-around',
  marginBottom: props.bottomSpace,
  padding: props.theme.rem(1.5)
}))

const CardContainer = styled(View)(_props => ({}))

const CardBackground = styled(View)(props => ({
  aspectRatio: 1.5882352941,
  backgroundColor: props.theme.modal,
  // Math for figuring out 1/8th inches border radius ((1/8)/3.375 * 314)/16:
  borderRadius: props.theme.rem(0.7268518519),
  borderWidth: 1,
  borderTopColor: 'rgba(255,255,255,.2)',
  borderColor: 'rgba(255,255,255,.1)',
  flexDirection: 'row',
  justifyContent: 'space-between',
  padding: props.theme.rem(1.25),
  position: 'absolute',
  shadowOpacity: 0.5,
  shadowRadius: props.theme.rem(0.5),
  width: '100%'
}))

const CardInner = styled(View)<{ shouldStack?: boolean }>(props => ({
  aspectRatio: props.shouldStack === false ? 1.5882352941 : undefined,
  padding: props.theme.rem(1.25)
}))

const BottomFloat = styled(View)(props => ({
  alignSelf: 'center',
  bottom: 0,
  position: 'absolute'
}))

const LoadingContainer = styled(View)(_props => ({
  alignItems: 'center',
  flex: 1,
  justifyContent: 'center'
}))

const LoadingText = styled(Text)(props => ({
  alignSelf: 'stretch',
  color: props.theme.primaryText,
  fontFamily: props.theme.fontFaceDefault,
  fontSize: props.theme.rem(1),
  includeFontPadding: false,
  marginBottom: props.theme.rem(0.5),
  textAlign: 'left'
}))

const LoadingTextDisclaimer = styled(Text)(props => ({
  alignSelf: 'stretch',
  color: props.theme.secondaryText,
  fontFamily: props.theme.fontFaceDefault,
  includeFontPadding: false,
  textAlign: 'justify'
}))

const CardHeader = styled(View)(_props => ({
  flexDirection: 'row',
  justifyContent: 'space-between'
}))

const VisaBrandImage = styled(Image)(props => ({
  resizeMode: 'contain',
  height: props.theme.rem(1.75),
  width: props.theme.rem(4),
  marginBottom: props.theme.rem(1.25)
}))

const CardFieldLabel = styled(Text)<{ textAlign?: 'left' | 'right' }>(props => ({
  color: props.theme.secondaryText,
  fontFamily: props.theme.fontFaceDefault,
  fontSize: props.theme.rem(0.7),
  includeFontPadding: false,
  textAlign: props.textAlign ?? 'left'
}))

const CardFieldValue = styled(Text)<{ textAlign?: 'left' | 'right' }>(props => ({
  color: props.theme.primaryText,
  fontFamily: props.theme.fontFaceDefault,
  fontSize: props.theme.rem(0.75),
  includeFontPadding: false,
  textAlign: props.textAlign ?? 'left'
}))
