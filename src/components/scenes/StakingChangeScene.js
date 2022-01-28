// @flow

import * as React from 'react'
import { Image, View } from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { sprintf } from 'sprintf-js'

import fioLogo from '../../assets/images/fio/fio_logo.png'
import s from '../../locales/strings.js'
import { Slider } from '../../modules/UI/components/Slider/Slider'
import { useState } from '../../types/reactHooks'
import type { RouteProp } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { FlipInputModal } from '../modals/FlipInputModal'
import { Airship } from '../services/AirshipInstance'
import { type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts'
import { SceneHeader } from '../themed/SceneHeader.js'
import { ThemedModal } from '../themed/ThemedModal'
import { Tile } from '../themed/Tile.js'

type OwnProps = {
  route: RouteProp<'stakingChange'>
}
type Props = OwnProps & ThemeProps

export const StakingChangeSceneComponent = (props: Props) => {
  const {
    theme,
    route: {
      params: { change, currencyCode, walletId }
    }
  } = props
  const styles = getStyles(theme)

  const [exchangeAmount, setExchangeAmount] = useState('0')
  const [error, setError] = useState(null)
  const [loading] = useState(false)
  const [tx] = useState(null)
  const sliderDisabled = tx == null || exchangeAmount === '0' || error != null

  const onAmountChanged = (nativeAmount: string, exchangeAmount: string) => {
    setExchangeAmount(exchangeAmount)
  }

  const onMaxSet = () => {
    // todo
  }

  const onFeesChange = () => {
    // todo
  }

  const handleSubmit = async () => {
    // todo
  }

  const handleAmount = () => {
    Airship.show(bridge => (
      <FlipInputModal
        bridge={bridge}
        walletId={walletId}
        currencyCode={currencyCode}
        onFeesChange={onFeesChange}
        onAmountChanged={onAmountChanged}
        overrideExchangeAmount={exchangeAmount}
        onMaxSet={onMaxSet}
      />
    )).catch(error => setError(error))
  }

  const handleUnlockDate = () => {
    Airship.show(bridge => {
      return (
        <ThemedModal bridge={bridge} onCancel={bridge.resolve} paddingRem={1}>
          <ModalTitle icon={<MaterialCommunityIcons name="chart-line" size={theme.rem(2)} color={theme.iconTappable} />}>
            {s.strings.staking_change_unlock_explainer_title}
          </ModalTitle>
          <ModalMessage>{s.strings.staking_change_unlock_explainer1}</ModalMessage>
          <ModalMessage>{s.strings.staking_change_unlock_explainer2}</ModalMessage>
          <ModalCloseArrow onPress={bridge.resolve} />
        </ThemedModal>
      )
    })
  }

  const renderAdd = () => {
    return (
      <>
        <SceneHeader style={styles.sceneHeader} title={sprintf(s.strings.staking_change_add_header, currencyCode)} underline withTopMargin>
          <Image style={styles.currencyLogo} source={fioLogo} />
        </SceneHeader>
        <View style={styles.explainer}>
          <ModalMessage>{s.strings.staking_change_explaner1}</ModalMessage>
          <ModalMessage>{s.strings.staking_change_explaner2}</ModalMessage>
        </View>
        <Tile type="editable" title={s.strings.staking_change_add_amount_title} onPress={handleAmount}>
          <EdgeText style={styles.amountText}>{exchangeAmount}</EdgeText>
        </Tile>
      </>
    )
  }

  const renderRemove = () => {
    const unlockDate = 'Aug 17, 2021'
    return (
      <>
        <SceneHeader style={styles.sceneHeader} title={sprintf(s.strings.staking_change_remove_header, currencyCode)} underline withTopMargin>
          <Image style={styles.currencyLogo} source={fioLogo} />
        </SceneHeader>
        <Tile type="editable" title={s.strings.staking_change_remove_amount_title} onPress={handleAmount}>
          <EdgeText style={styles.amountText}>{exchangeAmount}</EdgeText>
        </Tile>
        <Tile type="questionable" title={s.strings.staking_change_remove_unlock_date} onPress={handleUnlockDate}>
          <EdgeText>{unlockDate}</EdgeText>
        </Tile>
      </>
    )
  }

  const renderError = () => {
    if (error == null) return null

    return (
      <Tile type="static" title={s.strings.send_scene_error_title}>
        <EdgeText style={styles.errorMessage} numberOfLines={3}>
          {error.toString()}
        </EdgeText>
      </Tile>
    )
  }

  return (
    <SceneWrapper background="theme">
      {(() => {
        switch (change) {
          case 'add':
            return renderAdd()
          case 'remove':
            return renderRemove()
          default:
            return null
        }
      })()}
      {renderError()}
      <View style={styles.sliderContainer}>
        <Slider onSlidingComplete={handleSubmit} disabled={sliderDisabled} showSpinner={loading} />
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles(theme => ({
  sceneHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  currencyLogo: {
    height: theme.rem(1.25),
    width: theme.rem(1.25),
    resizeMode: 'contain',
    marginLeft: theme.rem(1)
  },
  explainer: {
    margin: theme.rem(0.5)
  },
  amountText: {
    fontSize: theme.rem(2)
  },
  sliderContainer: {
    paddingVertical: theme.rem(2)
  },
  errorMessage: {
    color: theme.dangerText
  }
}))

export const StakingChangeScene = withTheme(StakingChangeSceneComponent)
