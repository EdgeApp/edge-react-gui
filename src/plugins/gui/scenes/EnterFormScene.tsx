/* eslint-disable react-hooks/exhaustive-deps */
import { asArray, asObject, asOptional, asString } from 'cleaners'
import * as React from 'react'
import { BackHandler, NativeSyntheticEvent, ScrollView, TextInputFocusEventData, TouchableOpacity, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { MaterialIcon } from 'react-native-vector-icons/MaterialIcons'

import { getDiskletForm, setDiskletForm } from '../../../actions/FormActions'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../../../components/services/ThemeContext'
import { EdgeText } from '../../../components/themed/EdgeText'
import { MainButton } from '../../../components/themed/MainButton'
import { OutlinedTextInput, OutlinedTextInputRef } from '../../../components/themed/OutlinedTextInput'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import s from '../../../locales/strings'
import { FormDataType, FormProps, HomeAddress } from '../../../types/FormTypes'
import { useSelector } from '../../../types/reactRedux'
import { RouteProp } from '../../../types/routerTypes'
import { makePeriodicTask } from '../../../util/PeriodicTask'

interface Props {
  route: RouteProp<'guiPluginEnterForm'>
}

const FUZZY_SEARCH_INTERVAL = 1000

const asKmootResponse = asObject({
  features: asArray(
    asObject({
      properties: asObject({
        housenumber: asOptional(asString),
        street: asOptional(asString),
        city: asOptional(asString),
        state: asOptional(asString),
        postcode: asOptional(asString),
        countrycode: asOptional(asString)
      })
    })
  )
})

const asKmootValidProperties = asObject({
  housenumber: asString,
  street: asString,
  city: asString,
  state: asString,
  postcode: asString,
  countrycode: asString
})

export const EnterFormScene = React.memo((props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { countryCode, headerTitle, forms: initialForms, onSubmit } = props.route.params
  const disklet = useSelector(state => state.core.disklet)

  const [forms, setForms] = React.useState<FormProps[]>([])

  const [isNeedsFuzzySearch, setIsNeedsFuzzySearch] = React.useState(false)
  const [searchResults, setSearchResults] = React.useState<HomeAddress[]>([])
  const [prevAddressQuery, setPrevAddressQuery] = React.useState<string | undefined>(undefined)
  const [isHintsDropped, setIsHintsDropped] = React.useState(false)

  const addressFieldRef = React.useRef<OutlinedTextInputRef>(null)

  const inputRefs = React.useRef<{ [key: string]: OutlinedTextInputRef | null }>({})

  const addressQuery = React.useMemo(() => {
    const addressForm = forms.find(form => form.fields.find(field => field.key === 'address'))
    const addressField = addressForm != null ? addressForm.fields.find(field => field.key === 'address') : null
    return addressField?.value
  }, [forms])

  const handleUserInput = useHandler((formType: FormDataType, fieldKey: string) => (text: string) => {
    const updatedForms = forms.map(form => {
      const updatedFormFields = form.fields.map(field => {
        if (field.key === fieldKey) {
          field.value = text
          if (formType === 'addressForm' && field.dataType === 'address') {
            setIsNeedsFuzzySearch(true)
          }
        }
        return field
      })
      form.fields = updatedFormFields
      return form
    })

    setForms([...updatedForms])
  })

  // When the user taps on the visible background gray area while the address
  // search results are shown
  const handleInvisibleTap = () => {
    setIsHintsDropped(false)
  }

  const handleAddressFieldSelect = useHandler(() => {
    setIsHintsDropped(true)
  })

  const handleAddressFieldDeselect = useHandler(() => {
    setIsHintsDropped(false)
  })

  const isBlurEventRef = React.useRef(false)

  const handleBlur = useHandler((key: string) => () => {
    const inputRef = inputRefs.current[key]

    // Special handling takes care of an address field
    // if (inputRef != null && key.split('_')[1].trim() !== 'address') {
    if (inputRef != null) {
      console.debug('BLUR')
      setTimeout(() => inputRef.blur())
    }
  })

  // Populate the address fields with the values from the selected search
  // results
  const handleAddressHintPress = useHandler((searchResult: HomeAddress) => () => {
    console.debug('handleAddressHintPress')

    const updatedForms = forms.map(form => {
      if (form.formType === 'addressForm') {
        const updatedFields = form.fields.map(field => {
          const hintKey = Object.keys(searchResult).find(searchResultKey => searchResultKey === field.key) as keyof typeof searchResult | undefined
          if (hintKey != null) {
            return {
              ...field,
              value: searchResult[hintKey]
            }
          }
          return field
        })
        return {
          ...form,
          fields: updatedFields
        }
      }
      return form
    })

    isBlurEventRef.current = false

    setForms(updatedForms)
    setIsHintsDropped(false)
  })

  const handleSubmit = useHandler(async () => {
    // Save user input to disk
    forms.forEach(async form => await setDiskletForm(disklet, form))

    // Flatten data for callback
    onSubmit([...forms.flatMap(form => [...form.fields.flatMap(field => field)])])
  })

  // TODO: remove initialForms?
  // Initialize with any saved forms from disklet
  useAsyncEffect(async () => {
    const updatedForms = await Promise.all(
      initialForms.map(async initialForm => {
        const diskletForm = await getDiskletForm(disklet, initialForm)

        // Only take field values from disklet in case defined strings or keys
        // change
        if (
          diskletForm != null &&
          initialForm.fields.every(initialFormField => diskletForm.fields.some(diskletFormField => diskletFormField.key === initialFormField.key))
        ) {
          initialForm.fields = initialForm.fields.map(initialFormField => {
            initialFormField.value = diskletForm.fields.find(diskletFormField => diskletFormField.key === initialFormField.key)?.value
            return initialFormField
          })
        }
        return initialForm
      })
    )
    setForms([...updatedForms])

    // TODO: invisible tap
    // const backHandler = BackHandler.addEventListener('hardwareBackPress', handleInvisibleTap)

    return () => {}
  }, [])

  const handlePeriodicSearch = useHandler(async () => {
    if (isNeedsFuzzySearch && addressQuery != null) {
      setIsNeedsFuzzySearch(false)

      // Check if address field is ready to search
      if (addressQuery != null && addressQuery.split(' ').length >= 2 && prevAddressQuery !== addressQuery) {
        setPrevAddressQuery(addressQuery)

        // Fetch fuzzy search results
        const res = await fetch(`https://photon.komoot.io/api/?q=${addressQuery}`).catch(e => {
          throw e
        })
        const json = await res.json().catch(e => {
          throw e
        })

        // Filter valid addresses by country code and if the required address
        // fields are there, then mutate the data to our required address type
        try {
          const kmootResult = asKmootResponse(json)
          const searchResults: HomeAddress[] = kmootResult.features
            .filter(rawFeature => {
              try {
                const cleanedProperties = asKmootValidProperties(rawFeature.properties)
                return cleanedProperties.countrycode.toUpperCase() === countryCode
              } catch {
                return false
              }
            })
            .map(feature => {
              const { housenumber, street, city, state, postcode, countrycode } = asKmootValidProperties(feature.properties)
              return {
                address: `${street} ${housenumber ?? ''}`,
                address2: undefined,
                city,
                state,
                postalCode: postcode,
                country: countrycode
              }
            })

          setSearchResults([...searchResults])
        } catch (e) {
          console.debug(e)
        }
      } else {
        setSearchResults([])
      }
    }
  })

  // Periodically run a fuzzy search on changed address user input
  React.useEffect(() => {
    const task = makePeriodicTask(handlePeriodicSearch, FUZZY_SEARCH_INTERVAL)
    task.start({ wait: false })

    return () => task.stop()
  }, [handlePeriodicSearch])

  // Changes to the number of address hints results
  React.useEffect(() => {
    if (searchResults.length > 0) setIsHintsDropped(true)
    else setIsHintsDropped(false)

    return () => {}
  }, [searchResults])

  return (
    <SceneWrapper scroll background="theme">
      <SceneHeader title={headerTitle} underline withTopMargin />
      {forms.map(form => (
        <View key={form.title}>
          <EdgeText style={styles.formSectionTitle}>{form.title}</EdgeText>
          {Object.values(form.fields).map(field => {
            const isAddressField = field.dataType === 'address'
            const key = `${form.key}_${field.key}`
            return (
              <View key={key}>
                <OutlinedTextInput
                  returnKeyType="next"
                  label={field.label}
                  onChangeText={handleUserInput(form.formType, field.key)} // TODO:? Need a separate handler per field?
                  value={field.value ?? ''}
                  autoFocus={forms.indexOf(form) === 0 && form.fields.indexOf(field) === 0}
                  // onFocus={isAddressField ? handleAddressFieldSelect : handleAddressFieldDeselect}
                  // onBlur={isAddressField ? handleAddressFieldDeselect : handleBlur(key)}
                  onFocus={isAddressField ? handleAddressFieldSelect : undefined}
                  onBlur={isAddressField ? undefined : handleBlur(key)}
                  // ref={isAddressField ? addressFieldRef : input => (inputRefs.current[`${form.key}_${field.key}`] = input)}
                  ref={input => (inputRefs.current[`${form.key}_${field.key}`] = input)}
                />
                {isAddressField && isHintsDropped && searchResults.length > 0 ? (
                  <View style={styles.dropContainer}>
                    <ScrollView>
                      {searchResults.map(searchResult => {
                        const displaySearchResult = `${searchResult.address}, ${searchResult.city}, ${searchResult.state} ${searchResult.postalCode}`
                        return (
                          // <TouchableOpacity key={displaySearchResult} style={styles.rowContainer} onPress={handleAddressHintPress(searchResult)}>
                          <TouchableOpacity
                            key={searchResults.indexOf(searchResult)}
                            style={styles.rowContainer}
                            onPress={handleAddressHintPress(searchResult)}
                          >
                            <EdgeText>{displaySearchResult}</EdgeText>
                          </TouchableOpacity>
                        )
                      })}
                    </ScrollView>
                  </View>
                ) : null}
              </View>
            )
          })}
        </View>
      ))}
      <MainButton label={s.strings.string_next_capitalized} marginRem={[1, 1, 1.5, 1]} type="secondary" onPress={handleSubmit} />
    </SceneWrapper>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  dropContainer: {
    backgroundColor: theme.modal,
    borderBottomLeftRadius: theme.rem(1),
    borderBottomRightRadius: theme.rem(1),
    zIndex: 2,
    position: 'absolute',
    marginTop: theme.rem(3.5),
    marginLeft: theme.rem(1),
    marginRight: theme.rem(1)
  },
  formSectionTitle: {
    marginLeft: theme.rem(0.5),
    marginTop: theme.rem(1)
  },
  rowContainer: {
    display: 'flex',
    height: theme.rem(2.75),
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  invisibleTapper: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    borderBottomLeftRadius: theme.rem(2),
    zIndex: 1
  }
}))

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
