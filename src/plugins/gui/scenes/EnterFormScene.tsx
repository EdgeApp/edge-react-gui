/* eslint-disable react-hooks/exhaustive-deps */
import { asArray, asObject, asString } from 'cleaners'
import * as React from 'react'
import { View } from 'react-native'

import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../../../components/services/ThemeContext'
import { EdgeText } from '../../../components/themed/EdgeText'
import { MainButton } from '../../../components/themed/MainButton'
import { OutlinedTextInput } from '../../../components/themed/OutlinedTextInput'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { useHandler } from '../../../hooks/useHandler'
import s from '../../../locales/strings'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { makePeriodicTask } from '../../../util/PeriodicTask'
import { FiatPluginFormField } from '../fiatPluginTypes'

interface Props {
  navigation: NavigationProp<'guiPluginEnterForm'>
  route: RouteProp<'guiPluginEnterForm'>
}

const asKmootResponse = asObject({
  features: asArray(
    asObject({
      properties: asObject({
        housenumber: asString,
        street: asString,
        city: asString,
        state: asString,
        postcode: asString,
        countrycode: asString
      })
    })
  )
})

export const EnterFormScene = React.memo((props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const { headerTitle: title, forms, onSubmit } = props.route.params

  const [isNeedsFuzzySearch, setIsNeedsFuzzySearch] = React.useState(false)
  const [userInputs, setFieldInputs] = React.useState<FiatPluginFormField[]>([...forms.flatMap(form => [...form.fields.flatMap(field => field)])])

  const [prevAddressQuery, setPrevAddressQuery] = React.useState<string | undefined>(undefined)
  const [addressFilters, setAddressFilters] = React.useState<{ [key: string]: string }>({})

  const [addressHints, setAddressHints] = React.useState<string[]>([])
  const [isHintsDropped, setIsHintsDropped] = React.useState(false)

  const addressField = React.useMemo(() => {
    const addressForm = forms.find(form => form.fields.find(field => field.key === 'address'))
    return addressForm != null ? addressForm.fields.find(field => field.key === 'address') : null
  }, [forms])

  const handlePeriodicSearch = useHandler(async () => {
    const addressQuery = addressField?.value as string

    if (isNeedsFuzzySearch) {
      setIsNeedsFuzzySearch(false)

      // Check if field is ready to search
      if (addressQuery != null && addressQuery.split(' ').length > 2 && prevAddressQuery !== addressQuery) {
        setPrevAddressQuery(addressQuery)

        // Fetch fuzzy search
        const res = await fetch(`https://photon.komoot.io/api/?q=${addressQuery}`).catch(e => {
          throw e
        })
        const json = await res.json().catch(e => {
          throw e
        })
        const kmootResult = asKmootResponse(json)
        const searchResults: Array<{ address: string; city: string; state: string; postalCode: string; countryCode: string }> = kmootResult.features.map(
          feature => {
            const { housenumber, street, city, state, postcode, countrycode } = feature.properties
            return {
              address: `${housenumber} ${street}`,
              city,
              state,
              postalCode: postcode,
              countryCode: countrycode
            }
          }
        )
        const filteredSearchResults = searchResults.filter(searchResult =>
          Object.keys(searchResult).some(searchResultKey => {
            const typedSearchResultKey = searchResultKey as keyof typeof searchResult
            return addressFilters[typedSearchResultKey].includes(searchResult[typedSearchResultKey].toLowerCase())
          })
        )

        setAddressHints(
          filteredSearchResults.map(
            searchResult => `${searchResult.address}, ${searchResult.city}, ${searchResult.state} ${searchResult.postalCode}, ${searchResult.countryCode}`
          )
        )

        console.debug(
          filteredSearchResults.map(
            searchResult => `${searchResult.address}, ${searchResult.city}, ${searchResult.state} ${searchResult.postalCode}, ${searchResult.countryCode}`
          )
        )
      }
    }
  })

  React.useEffect(() => {
    if (addressHints.length > 0) setIsHintsDropped(true)
    else setIsHintsDropped(false)
  }, [addressHints])

  React.useEffect(() => {
    if (addressField != null) {
      // Periodically run a fuzzy search on any changed user input
      const task = makePeriodicTask(handlePeriodicSearch, 5000)
      task.start({ wait: false })
      return () => {
        //  previous task stopped
        task.stop()
      }
    }
  }, [handlePeriodicSearch])

  const handleUserInput = useHandler((fieldKey: string) => (text: string) => {
    const field = userInputs.find(fieldInput => fieldInput.key === fieldKey)
    if (field != null) {
      const fieldIndex = userInputs.indexOf(field)
      userInputs[fieldIndex].value = text
    } else {
      throw new Error(`Could not find field ${fieldKey}`)
    }
    setFieldInputs([...userInputs])
    // console.debug(JSON.stringify(userInputs, null, 2))
    setIsNeedsFuzzySearch(true)
  })

  const handleSubmit = useHandler(async () => {
    console.debug('handleSubmit' + JSON.stringify(userInputs, null, 2))
    await onSubmit(userInputs)
    navigation.pop()
  })

  return (
    <SceneWrapper scroll keyboardShouldPersistTaps="handled" background="theme">
      <SceneHeader title={title} underline withTopMargin />
      {forms.map(form => (
        <View key={form.title}>
          <EdgeText style={styles.textFieldHeader}>{form.title}</EdgeText>
          {Object.values(form.fields).map(formField => {
            const { key, label } = formField
            return (
              <OutlinedTextInput
                key={key}
                returnKeyType="next"
                label={label}
                onChangeText={handleUserInput(formField.key)}
                value={formField.value ?? ''}
                // value="test"
                autoFocus={false}
                onFocus={() => {}}
              />
            )
          })}
        </View>
      ))}
      <MainButton label={s.strings.string_next_capitalized} marginRem={[1, 0]} type="secondary" onPress={handleSubmit} />
    </SceneWrapper>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  sceneHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  cardContainer: {
    paddingTop: theme.rem(1),
    paddingBottom: theme.rem(1),
    alignItems: 'center'
  },
  container: {
    width: '100%',
    alignItems: 'center'
  },
  textFieldHeader: {
    marginLeft: theme.rem(0.5),
    marginTop: theme.rem(1)
  },
  textFields: {
    flexDirection: 'column',
    minWidth: theme.rem(15),
    maxWidth: theme.rem(20)
  },
  text: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1),
    includeFontPadding: false
  },
  textWarning: {
    color: theme.warningText,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1),
    includeFontPadding: false
  },
  textError: {
    color: theme.dangerText,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1),
    includeFontPadding: false
  },
  poweredByContainerRow: {
    flexDirection: 'row'
  },
  poweredByContainerColumn: {
    paddingHorizontal: theme.rem(0.5),
    flexDirection: 'column'
  },
  poweredByContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  poweredByText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  tapToChangeText: {
    fontSize: theme.rem(0.75),
    color: theme.deactivatedText
  },
  poweredByIcon: {
    aspectRatio: 1,
    width: theme.rem(2),
    height: theme.rem(2)
  },
  icon: {
    height: theme.rem(1.5),
    width: theme.rem(1.5),
    marginRight: theme.rem(0.5),
    marginLeft: theme.rem(0.5),
    resizeMode: 'contain'
  }
}))

// <Animated.View style={[styles.dropContainer, aBorderBottomRightRadius, aDropdown]}>
// <ScrollView>
//   {usernames.map((username: string) => (
//     <View key={username} style={styles.rowContainer}>
//       {/* This empty container is required to align the row contents properly */}
//       <View style={styles.rowIconContainer} />
//       <TouchableOpacity style={styles.rowBodyContainer} onPress={handleSwitchAccount(username)}>
//         <TitleText style={styles.text}>{username}</TitleText>
//       </TouchableOpacity>
//       <TouchableOpacity style={styles.rowIconContainer} onPress={handleDeleteAccount(username)}>
//         <MaterialIcon size={theme.rem(1.5)} name="close" color={theme.iconTappable} />
//       </TouchableOpacity>
//     </View>
//   ))}
// </ScrollView>
// </Animated.View>

// // Height value above can change if users are added/removed
// const sMaxHeight = useSharedValue(userListHeight)
// React.useEffect(() => {
//   sMaxHeight.value = withTiming(userListHeight)
// }, [sMaxHeight, userListHeight])
// const aDropdown = useAnimatedStyle(() => ({
//   height: sMaxHeight.value * sAnimationMult.value
// }))

// dropContainer: {
//   backgroundColor: theme.modal,
//   borderBottomLeftRadius: theme.rem(2),
//   zIndex: 2,
//   position: 'absolute',
//   width: '100%'
// },
// rowsContainer: {
//   flex: 1,
//   flexGrow: 1,
//   marginBottom: theme.rem(0)
// },
// rowBodyContainer: {
//   display: 'flex',
//   flexDirection: 'row',
//   justifyContent: 'flex-start',
//   alignItems: 'center',
//   flexGrow: 1,
//   flexShrink: 1,
//   marginRight: theme.rem(1)
// },

// message.push('Please instruct your bank to do the following payment :')
// message.push('Amount: €' + buyOrder.input.amount)
// message.push('IBAN: ' + wireInformation.iban)
// message.push('Reference: ' + wireInformation.reference)
// message.push('Recipient: ' + wireInformation.recipient)
// message.push('')
// message.push('Additional Data:')
// message.push('Bank Address: ' + wireInformation.bank_address)
// message.push('Bank Code: ' + wireInformation.bank_code)
// message.push('Account: ' + wireInformation.account_number)
// message.push('SWIFT BIC: ' + wireInformation.swift_bic)
