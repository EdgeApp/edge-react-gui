// import { BlogPost } from 'edge-info-server/types'
// import * as React from 'react'
// import { Platform, View } from 'react-native'
// import FastImage from 'react-native-fast-image'

// import { useHandler } from '../../hooks/useHandler'
// import { getLocaleOrDefaultString } from '../../locales/intl'
// import { openBrowserUri } from '../../util/WebUtils'
// import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
// import { EdgeText } from '../themed/EdgeText'
// import { CardUi4 } from './CardUi4'

// interface Props {
//   blogPost: BlogPost
// }

// const IMAGE_HEIGHT_RATIO = '65%'

// /**
//  * Blog post card with a top image and text below.
//  */
// export const BlogCard = (props: Props) => {
//   const { localeTitle, localeBody, localeBlogUrl, lightImageUrl, darkImageUrl } = props.blogPost

//   const theme = useTheme()
//   const styles = getStyles(theme)

//   const textShadow = Platform.OS === 'ios' ? theme.shadowTextIosUi4 : theme.shadowTextAndroidUi4

//   const title = getLocaleOrDefaultString(localeTitle)
//   const body = getLocaleOrDefaultString(localeBody)
//   const url = getLocaleOrDefaultString(localeBlogUrl)
//   const image = theme.isDark ? darkImageUrl : lightImageUrl

//   const handlePress = useHandler(() => {
//     if (url != null) openBrowserUri(url)
//   })

//   return (
//     <CardUi4
//       onPress={handlePress}
//       nodeBackground={
//         <View style={styles.nodeBackground}>
//           <FastImage source={{ uri: image }} style={styles.bannerImage} />
//         </View>
//       }
//     >
//       <View style={styles.backgroundSpacing} />
//       <View style={styles.textContainer}>
//         <EdgeText style={[textShadow, styles.titleText]} numberOfLines={1}>
//           {title}
//         </EdgeText>
//         <EdgeText style={[styles.bodyText, textShadow]} numberOfLines={2}>
//           {body}
//         </EdgeText>
//       </View>
//     </CardUi4>
//   )
// }

// const getStyles = cacheStyles((theme: Theme) => ({
//   backgroundSpacing: {
//     height: IMAGE_HEIGHT_RATIO
//   },
//   textContainer: {
//     margin: theme.rem(0.5)
//   },
//   titleText: {
//     fontFamily: theme.fontFaceMedium,
//     marginBottom: theme.rem(0.25)
//   },
//   bodyText: {
//     fontSize: theme.rem(0.65)
//   },
//   nodeBackground: {
//     height: IMAGE_HEIGHT_RATIO,
//     justifyConent: 'center',
//     alignItems: 'center'
//   },
//   bannerImage: {
//     height: '100%',
//     width: '100%'
//   }
// }))

export const BlogCard = (props: any) => null // TODO
