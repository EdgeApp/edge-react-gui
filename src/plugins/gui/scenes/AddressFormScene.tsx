/* eslint-disable react-hooks/exhaustive-deps */
import { asArray, asObject, asOptional, asString } from 'cleaners'
import * as React from 'react'
import { Platform, ScrollView, TouchableOpacity, View, ViewStyle } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { getDiskletFormData, setDiskletForm } from '../../../actions/FormActions'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../../../components/services/ThemeContext'
import { EdgeText } from '../../../components/themed/EdgeText'
import { MainButton } from '../../../components/themed/MainButton'
import { OutlinedTextInputRef } from '../../../components/themed/OutlinedTextInput'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { ADDRESS_FORM_DISKLET_NAME, asHomeAddress, HomeAddress } from '../../../types/FormTypes'
import { useSelector } from '../../../types/reactRedux'
import { RouteProp } from '../../../types/routerTypes'
import { makePeriodicTask } from '../../../util/PeriodicTask'
import { GuiFormField } from '../components/GuiFormField'

interface Props {
  route: RouteProp<'guiPluginAddressForm'>
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

export const AddressFormScene = React.memo((props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { countryCode, headerTitle, /* headerIconUri, */ onSubmit } = props.route.params
  const disklet = useSelector(state => state.core.disklet)
  const [formData, setFormData] = React.useState<HomeAddress>({
    address: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: countryCode
  })
  const [isNeedsFuzzySearch, setIsNeedsFuzzySearch] = React.useState(false)
  const [searchResults, setSearchResults] = React.useState<HomeAddress[]>([])
  const [prevAddressQuery, setPrevAddressQuery] = React.useState<string | undefined>(undefined)
  const [isHintsDropped, setIsHintsDropped] = React.useState(false)

  const rAddressInput = React.createRef<OutlinedTextInputRef>()

  const handleShowAddressHints = useHandler(() => {
    setIsHintsDropped(true)
  })

  const handleHideAddressHints = useHandler(() => {
    setIsHintsDropped(false)
  })

  // Search for address hints
  const handlePeriodicSearch = useHandler(async () => {
    const { address: addressQuery } = formData
    if (isNeedsFuzzySearch && addressQuery != null) {
      setIsNeedsFuzzySearch(false)

      // Check if address field is ready to search
      if (addressQuery.split(' ').length < 2) {
        setSearchResults([])
      } else if (prevAddressQuery !== addressQuery) {
        // Fetch fuzzy search results
        try {
          const res = await fetch(`https://photon.komoot.io/api/?q=${addressQuery}`)
          const json = await res.json()

          // Filter valid addresses by country code and if the required address
          // fields are there, then mutate the data to our required address type
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
          console.error('Failed to get search: ', JSON.stringify(e, null, 2))
          setSearchResults([])
        }
      }

      setPrevAddressQuery(addressQuery)
    }
  })

  // Populate the address fields with the values from the selected search
  // results
  const handleAddressHintPress = useHandler((selectedAddressHint: HomeAddress) => () => {
    setFormData({ ...selectedAddressHint }) // Update address's value with new value

    if (rAddressInput.current != null) {
      rAddressInput.current.blur()
    }
  })

  const handleChangeAddress = useHandler((inputValue: string) => {
    setIsNeedsFuzzySearch(true)
    setFormData({ ...formData, address: inputValue })
  })

  const handleChangeAddress2 = useHandler((inputValue: string) => {
    setFormData({ ...formData, address2: inputValue })
  })

  const handleChangeCity = useHandler((inputValue: string) => {
    setFormData({ ...formData, city: inputValue })
  })

  const handleChangeState = useHandler((inputValue: string) => {
    setFormData({ ...formData, state: inputValue })
  })

  const handleChangePostalCode = useHandler((inputValue: string) => {
    setFormData({ ...formData, postalCode: inputValue })
  })

  const handleSubmit = useHandler(async () => {
    // Save user input to disk
    await setDiskletForm(disklet, ADDRESS_FORM_DISKLET_NAME, formData)

    await onSubmit(formData)
  })

  // Periodically run a fuzzy search on changed address user input
  React.useEffect(() => {
    const task = makePeriodicTask(handlePeriodicSearch, FUZZY_SEARCH_INTERVAL)
    task.start({ wait: false })

    return () => task.stop()
  }, [handlePeriodicSearch])

  // Initialize scene with any saved form data from disklet
  useAsyncEffect(async () => {
    const diskletFormData = await getDiskletFormData(disklet, ADDRESS_FORM_DISKLET_NAME, asHomeAddress)
    if (diskletFormData != null && diskletFormData.country === countryCode) {
      setFormData(diskletFormData)
    }
    return () => {}
  }, [])

  return (
    <SceneWrapper background="theme">
      <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" extraScrollHeight={theme.rem(2.75)} enableAutomaticScroll enableOnAndroid>
        <SceneHeader title={headerTitle} underline withTopMargin />
        <EdgeText style={styles.formSectionTitle}>{lstrings.home_address_title}</EdgeText>
        <GuiFormField
          fieldType="address"
          autofocus
          label={lstrings.address_line_1}
          value={formData.address}
          fieldRef={rAddressInput}
          onChangeText={handleChangeAddress}
          onFocus={handleShowAddressHints}
          onBlur={handleHideAddressHints}
        />
        {isHintsDropped ? (
          <View style={Platform.OS === 'ios' ? styles.dropContainer : styles.dropContainerAndroid}>
            <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled>
              {searchResults.map(searchResult => {
                const displaySearchResult = `${searchResult.address} ${searchResult.city}, ${searchResult.state} ${searchResult.postalCode}`
                return (
                  <TouchableOpacity key={searchResults.indexOf(searchResult)} onPress={handleAddressHintPress(searchResult)}>
                    <View style={styles.rowContainer}>
                      <EdgeText style={styles.addressHintText} numberOfLines={2}>
                        {displaySearchResult}
                      </EdgeText>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        ) : null}
        <GuiFormField
          fieldType="address2"
          label={lstrings.address_line_2}
          value={formData.address2}
          onChangeText={handleChangeAddress2}
          onBlur={handleHideAddressHints}
        />
        <GuiFormField fieldType="city" label={lstrings.address_city} value={formData.city} onChangeText={handleChangeCity} onBlur={handleHideAddressHints} />
        <GuiFormField
          fieldType="state"
          label={lstrings.address_state_province_region}
          value={formData.state}
          onChangeText={handleChangeState}
          onBlur={handleHideAddressHints}
        />
        <GuiFormField
          fieldType="postalcode"
          returnKeyType="done"
          label={lstrings.address_zip_postal_code}
          value={formData.postalCode}
          onChangeText={handleChangePostalCode}
          onBlur={handleHideAddressHints}
        />
        <MainButton
          label={lstrings.string_next_capitalized}
          marginRem={[1, 0.5, 1, 0.5]}
          type="secondary"
          disabled={(Object.keys(formData) as Array<keyof HomeAddress>).some(
            key =>
              // Disable next on empty non-optional fields
              key !== 'address2' && formData[key].trim() === ''
          )}
          onPress={handleSubmit}
        />
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
})

const getStyles = cacheStyles((theme: Theme) => {
  const dropContainerCommon: ViewStyle = {
    backgroundColor: theme.modal,
    borderBottomLeftRadius: theme.rem(1),
    borderBottomRightRadius: theme.rem(1),
    zIndex: 1,
    borderColor: theme.iconTappable,
    borderTopWidth: 0,
    borderWidth: theme.thinLineWidth,
    overflow: 'hidden',
    position: 'absolute',
    left: theme.rem(1),
    right: theme.rem(1)
  }
  return {
    addressHintText: {
      marginHorizontal: theme.rem(0.5),
      marginVertical: theme.rem(0.25)
    },
    dropContainer: {
      top: theme.rem(9.75),
      ...dropContainerCommon
    },
    dropContainerAndroid: {
      top: theme.rem(10) - 3,
      ...dropContainerCommon
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
    }
  }
})
