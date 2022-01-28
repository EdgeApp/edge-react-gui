// @flow

import * as React from 'react'
import { Image, ScrollView, Text, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import fioLogo from '../../assets/images/fio/fio_logo.png'
import s from '../../locales/strings.js'
import { useState } from '../../types/reactHooks.js'
import { Actions } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { ClickableText } from '../themed/ClickableText.js'
import { EdgeText } from '../themed/EdgeText.js'
import { MainButton } from '../themed/MainButton.js'
import { SceneHeader } from '../themed/SceneHeader.js'
import { Tile } from '../themed/Tile.js'

type OwnProps = {
  currencyCode: string,
  walletId: string
}
type Lock = {
  id: string,
  day: number,
  title: string,
  amount: string
}
type Props = OwnProps & ThemeProps

export const StakingOverviewSceneComponent = (props: Props) => {
  const { theme, currencyCode, walletId } = props
  const styles = getStyles(theme)
  const [locks] = useState<Lock[]>([])

  const handlePressStake = () => {
    Actions.jump('stakingChange', { change: 'add', currencyCode, walletId })
  }
  const handlePressUnstake = () => {
    Actions.jump('stakingChange', { change: 'remove', currencyCode, walletId })
  }

  const renderItems = () =>
    locks.map(item => {
      const amount = `${item.amount} ${currencyCode}`
      return (
        <Tile key={item.id} type="static" title={item.title}>
          <EdgeText>{amount}</EdgeText>
        </Tile>
      )
    })

  return (
    <SceneWrapper background="header" hasTabs={false}>
      <SceneHeader style={styles.sceneHeader} title={sprintf(s.strings.staking_overview_header, currencyCode)} underline withTopMargin>
        <Image style={styles.currencyLogo} source={fioLogo} />
      </SceneHeader>
      <ScrollView style={styles.scrollContainer}>
        <EdgeText style={styles.explainerText}>{s.strings.staking_overview_explainer}</EdgeText>
        <Tile type="static" title="Currently Staked">
          <EdgeText>
            <Text>300 Fio</Text>
          </EdgeText>
        </Tile>
        {renderItems()}
      </ScrollView>
      <View style={styles.buttonContainer}>
        <MainButton onPress={handlePressStake} type="secondary" label={s.strings.staking_stake_funds_button} />
        <ClickableText onPress={handlePressUnstake} label={s.strings.staking_unstake_funds_button} />
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
  scrollContainer: {
    flex: 1,
    marginVertical: theme.rem(0.5)
  },
  explainerText: {
    marginVertical: theme.rem(0.5),
    marginHorizontal: theme.rem(1)
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: theme.rem(0.5)
  }
}))

export const StakingOverviewScene = withTheme(StakingOverviewSceneComponent)
