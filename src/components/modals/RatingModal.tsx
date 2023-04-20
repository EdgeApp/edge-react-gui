// import * as StoreReview from 'expo-store-review'
// import React, { useState } from 'react'
// import { TextInput, View } from 'react-native'
// import { AirshipBridge } from 'react-native-airship'
// import { cacheStyles } from 'react-native-patina'

// import { useHandler } from '../../hooks/useHandler'
// import { Theme, useTheme } from '../services/ThemeContext'
// import { EdgeText } from '../themed/EdgeText'
// import { MainButton } from '../themed/MainButton'
// import { ThemedModal } from '../themed/ThemedModal'

// interface Props {
//   bridge: AirshipBridge<void>
// }

// export const RatingModal = ({ bridge }: Props) => {
//   const theme = useTheme()
//   const styles = getStyles(theme)
//   const [rating, setRating] = useState(0)
//   const [comment, setComment] = useState('')

//   const handleRatingChange = useHandler((value: number) => {
//     setRating(value)
//   })

//   const handleCommentChange = useHandler((value: string) => {
//     setComment(value)
//   })

//   const handleReviewSubmit = useHandler(async () => {
//     try {
//       await StoreReview.requestReview()
//     } catch (error) {
//       console.log('An error occurred while requesting a review:', error)
//     }
//     bridge.resolve()
//   })

//   const handleCancel = useHandler(() => {
//     bridge.resolve()
//   })

//   return (
//     <ThemedModal bridge={bridge} onCancel={handleCancel}>
//       <View style={styles.modalContent}>
//         <EdgeText>How many stars would you give this app?</EdgeText>
//         <View style={styles.ratingContainer}>
//           {[1, 2, 3, 4, 5].map(value => (
//             <EdgeText key={value} style={styles.ratingStar} onPress={() => handleRatingChange(value)}>
//               {value <= rating ? '★' : '☆'}
//             </EdgeText>
//           ))}
//         </View>
//         <TextInput
//           style={styles.ratingInput}
//           placeholder="Enter your review here..."
//           value={comment}
//           onChangeText={handleCommentChange}
//           multiline
//           numberOfLines={4}
//         />
//         <View style={styles.buttonContainer}>
//           <MainButton label="Cancel" onPress={handleCancel} />
//           <MainButton label="Submit Review" onPress={handleReviewSubmit} />
//         </View>
//       </View>
//     </ThemedModal>
//   )
// }

// const getStyles = cacheStyles((theme: Theme) => ({
//   modalContent: {
//     backgroundColor: theme.modal,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     paddingHorizontal: 20,
//     paddingVertical: 10
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginVertical: 10
//   },
//   ratingStar: {
//     fontSize: 30,
//     color: theme.iconTappable
//   },
//   ratingInput: {
//     borderColor: theme.primaryText,
//     borderWidth: 1,
//     borderRadius: 5,
//     height: 100,
//     padding: 10,
//     textAlignVertical: 'top'
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between'
//   }
// }))
