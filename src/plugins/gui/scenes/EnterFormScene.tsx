/* eslint-disable react-hooks/exhaustive-deps */
import { asArray, asObject, asOptional, asString } from 'cleaners'
import * as React from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'

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

const FUZZY_SEARCH_INTERVAL = 2000

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

  const isBlurEventRef = React.useRef(false)

  const handleBlur = useHandler((key: string) => () => {
    const inputRef = inputRefs.current[key]

    if (inputRef != null) {
      inputRef.blur()
    }
  })

  const handleFocus = useHandler((key: string) => () => {
    setIsHintsDropped(key.split('_')[1].trim() === 'address')
  })

  // Populate the address fields with the values from the selected search
  // results
  const handleAddressHintPress = useHandler((searchResult: HomeAddress) => () => {
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
        try {
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
        } catch (e) {
          console.debug('failed to get search')
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
    if (searchResults.length === 0) setIsHintsDropped(false)

    return () => {}
  }, [searchResults])

  return (
    <SceneWrapper scroll background="theme" keyboardShouldPersistTaps="always">
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
                  onChangeText={handleUserInput(form.formType, field.key)}
                  value={field.value ?? ''}
                  autoFocus={forms.indexOf(form) === 0 && form.fields.indexOf(field) === 0}
                  onFocus={handleFocus(key)}
                  onBlur={!isAddressField ? handleBlur(key) : undefined}
                  ref={input => (inputRefs.current[`${form.key}_${field.key}`] = input)}
                />
                {isAddressField && isHintsDropped && searchResults.length > 0 ? (
                  <View style={styles.dropContainer}>
                    <ScrollView>
                      {searchResults.map(searchResult => {
                        const displaySearchResult = `${searchResult.address}, ${searchResult.city}, ${searchResult.state} ${searchResult.postalCode}`
                        return (
                          <TouchableOpacity
                            key={searchResults.indexOf(searchResult)}
                            style={styles.rowContainer}
                            onPress={handleAddressHintPress(searchResult)}
                          >
                            <EdgeText style={styles.addressHintText} numberOfLines={2}>
                              {displaySearchResult}
                            </EdgeText>
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
  addressHintText: {
    marginHorizontal: theme.rem(0.5),
    marginVertical: theme.rem(0.25)
  },
  dropContainer: {
    backgroundColor: theme.modal,
    borderBottomLeftRadius: theme.rem(1),
    borderBottomRightRadius: theme.rem(1),
    zIndex: 1,
    borderColor: theme.secondaryText,
    borderWidth: theme.thinLineWidth,
    overflow: 'hidden',
    position: 'absolute',
    top: theme.rem(3.5),
    left: theme.rem(1),
    right: theme.rem(1),
    maxHeight: theme.rem(15)
  },
  formSectionTitle: {
    marginLeft: theme.rem(0.5),
    marginTop: theme.rem(1),
    marginBottom: theme.rem(0.5),
    fontFamily: theme.fontFaceBold
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
