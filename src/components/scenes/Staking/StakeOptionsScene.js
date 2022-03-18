// @flow
import * as React from 'react'
import { Image } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import s from '../../../locales/strings.js'
import { type StakePolicy, makeStakePlugin } from '../../../plugins/stake-plugins/index.js'
import { useEffect, useState } from '../../../types/reactHooks.js'
import type { RouteProp } from '../../../types/routerTypes'
import { type NavigationProp } from '../../../types/routerTypes.js'
import { getCurrencyIcon } from '../../../util/CurrencyInfoHelpers'
import { getRewardAssetsName, getStakeAssetsName } from '../../../util/stakeUtils.js'
import { SceneWrapper } from '../../common/SceneWrapper.js'
import { cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { Card } from '../../themed/Card.js'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader.js'

type Props = {
  route: RouteProp<'stakeOptions'>,
  navigation: NavigationProp<'stakeOptions'>
}

// TODO: Use a plugin instance stored in the plugin-management system
const stakePlugin = makeStakePlugin()

export const StakeOptionsScene = (props: Props) => {
  const { walletId } = props.route.params
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const walletImageUri = getCurrencyIcon('fantom').symbolImage
  const icon = <Image style={styles.icon} source={{ uri: walletImageUri }} />

  //
  // Stake Policies
  //

  const [stakePolicies, setStakePolicies] = useState<StakePolicy[]>([])
  useEffect(() => {
    stakePlugin
      .getStakePolicies()
      .then(stakePolicies => {
        // TODO: Filter stakePolicies by wallet's pluginId and currency tokenId
        setStakePolicies(stakePolicies)
      })
      .catch(err => console.error(err))
  }, [walletId])

  //
  // Handlers
  //

  const handleStakeOptionPress = (stakePolicy: StakePolicy) => {
    navigation.navigate('stakeOverview', { walletId: walletId, stakePolicy: stakePolicy })
  }

  //
  // Renders
  //

  const renderOptions = () => {
    if (stakePolicies.length === 0) {
      return null
    } else if (stakePolicies.length === 1) {
      // Transition to next scene immediately
      handleStakeOptionPress(stakePolicies[0])
    } else {
      return stakePolicies.map(stakePolicy => {
        const stakeAssetsName = getStakeAssetsName(stakePolicy)
        const rewardAssetsName = getRewardAssetsName(stakePolicy)
        const bodyText = stakeAssetsName
        const subText = `${stakeAssetsName} to Earn ${rewardAssetsName}`

        // TODO: Use StakingOptionCard component
        return (
          <Card key={bodyText}>
            <TouchableOpacity onPress={() => handleStakeOptionPress(stakePolicy)}>
              <EdgeText>{bodyText}</EdgeText>
              <EdgeText>{subText}</EdgeText>
            </TouchableOpacity>
          </Card>
        )
      })
    }
  }

  return (
    <SceneWrapper background="theme">
      <SceneHeader style={styles.sceneHeader} title={sprintf(s.strings.staking_change_add_header, 'Tomb')} underline withTopMargin>
        {icon}
      </SceneHeader>
      {renderOptions()}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles(theme => ({
  icon: {
    height: theme.rem(1.5),
    width: theme.rem(1.5),
    marginRight: theme.rem(0.5),
    resizeMode: 'contain'
  },
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
  },
  estReturn: {
    padding: theme.rem(0.75),
    marginTop: theme.rem(1),
    marginHorizontal: theme.rem(2.5),
    borderWidth: theme.thinLineWidth,
    borderColor: theme.cardBorderColor,
    borderRadius: theme.rem(0.5),
    alignItems: 'center',
    justifyContent: 'center'
  }
}))
