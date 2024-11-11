import { ContentPost } from 'edge-info-server'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { useHandler } from '../../hooks/useHandler'
import { getLocaleOrDefaultString } from '../../locales/intl'
import { openBrowserUri } from '../../util/WebUtils'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface Props {
  contentPost: ContentPost
}

const IMAGE_HEIGHT_RATIO = '65%'

/**
 * Blog post card with a top image and text below.
 */
export const ContentPostCard = (props: Props) => {
  const { localeTitle, localeBody, localeBlogUrl, lightImageUrl, darkImageUrl } = props.contentPost

  const theme = useTheme()
  const styles = getStyles(theme)

  const title = getLocaleOrDefaultString(localeTitle)
  const body = getLocaleOrDefaultString(localeBody)
  const url = getLocaleOrDefaultString(localeBlogUrl)
  const image = theme.isDark ? darkImageUrl : lightImageUrl

  const handlePress = useHandler(() => {
    if (url != null) openBrowserUri(url)
  })
  const imageSrc = React.useMemo(() => ({ uri: image }), [image])

  return (
    <EdgeCard
      onPress={handlePress}
      nodeBackground={
        <View style={styles.nodeBackground}>
          <FastImage source={imageSrc} style={styles.bannerImage} />
        </View>
      }
    >
      <View style={styles.backgroundSpacing} />
      <View style={styles.textContainer}>
        <EdgeText style={styles.titleText} numberOfLines={1}>
          {title}
        </EdgeText>
        <EdgeText style={styles.bodyText} numberOfLines={2} disableFontScaling>
          {body}
        </EdgeText>
      </View>
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  backgroundSpacing: {
    height: IMAGE_HEIGHT_RATIO
  },
  textContainer: {
    margin: theme.rem(0.5)
  },
  titleText: {
    fontFamily: theme.fontFaceMedium,
    marginBottom: theme.rem(0.25),
    ...theme.cardTextShadow
  },
  bodyText: {
    fontSize: theme.rem(0.65),
    ...theme.cardTextShadow
  },
  nodeBackground: {
    height: IMAGE_HEIGHT_RATIO,
    justifyConent: 'center',
    alignItems: 'center'
  },
  bannerImage: {
    height: '100%',
    width: '100%'
  }
}))
