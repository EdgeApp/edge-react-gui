/* eslint-disable react-hooks/exhaustive-deps */
import { asArray, asObject, asOptional, asString } from 'cleaners'
import * as React from 'react'
import { Platform, ScrollView, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { SceneButtons } from '../../../components/buttons/SceneButtons'
import { EdgeTouchableOpacity } from '../../../components/common/EdgeTouchableOpacity'
import { ExpandableList } from '../../../components/common/ExpandableList'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../../../components/services/ThemeContext'
import { EdgeText } from '../../../components/themed/EdgeText'
import { FilledTextInputRef } from '../../../components/themed/FilledTextInput'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { SCROLL_INDICATOR_INSET_FIX } from '../../../constants/constantSettings'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import { lstrings } from '../../../locales/strings'
import { ADDRESS_FORM_DISKLET_NAME, asHomeAddress, HomeAddress } from '../../../types/FormTypes'
import { useSelector } from '../../../types/reactRedux'
import { BuyTabSceneProps } from '../../../types/routerTypes'
import { getDiskletFormData, setDiskletForm } from '../../../util/formUtils'
import { makePeriodicTask } from '../../../util/PeriodicTask'
import { GuiFormField } from '../components/GuiFormField'

export interface FiatPluginAddressFormParams {
  countryCode: string
  headerTitle: string
  headerIconUri?: string
  onSubmit: (homeAddress: HomeAddress) => Promise<void>
  onClose: () => void
}

interface Props extends BuyTabSceneProps<'guiPluginAddressForm'> {}

const FUZZY_SEARCH_INTERVAL = 2000
// Make this a fractional number so the user can tell that there are more
// options to scroll through
const MAX_DISPLAYED_HINTS = 4.75

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
  const { route, navigation } = props
  const { countryCode, headerTitle, /* headerIconUri, */ onSubmit, onClose } = route.params
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
  const [hintHeight, setHintHeight] = React.useState<number>(0)

  const rAddressInput = React.createRef<FilledTextInputRef>()

  const mounted = React.useRef<boolean>(true)

  const addressHintPress = (selectedAddressHint: HomeAddress) => () => {
    handleHideAddressHints()
    setFormData({ ...selectedAddressHint })
    if (rAddressInput.current != null) {
      rAddressInput.current.blur()
    }
  }

  const handleHintLayout = useHandler(event => {
    if (event != null && hintHeight === 0) {
      const { height } = event.nativeEvent.layout
      setHintHeight(height)
    }
  })

  const addressHints = React.useMemo(() => {
    return searchResults.map(searchResult => {
      const displaySearchResult1 = searchResult.address
      const displaySearchResult2 = `${searchResult.city}, ${searchResult.state}, ${countryCode}`

      return (
        <EdgeTouchableOpacity key={searchResults.indexOf(searchResult)} onPress={addressHintPress(searchResult)}>
          <View style={styles.rowContainer} onLayout={handleHintLayout}>
            <EdgeText>{displaySearchResult1}</EdgeText>
            <EdgeText>{displaySearchResult2}</EdgeText>
          </View>
        </EdgeTouchableOpacity>
      )
    })
  }, [searchResults, countryCode, addressHintPress, handleHintLayout, styles.rowContainer])

  const handleShowAddressHints = useHandler(() => {
    setIsHintsDropped(true)
  })

  const handleHideAddressHints = useHandler(() => {
    setIsHintsDropped(false)
  })

  // Search for address hints
  const handlePeriodicSearch = useHandler(async () => {
    const { address: addressQuery } = formData
    if (isNeedsFuzzySearch) {
      setIsNeedsFuzzySearch(false)

      // Check if address field is ready to search
      if (addressQuery.length === 0) {
        setSearchResults([])
      } else if (prevAddressQuery !== addressQuery) {
        // Fetch fuzzy search results
        try {
          const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(addressQuery)}`)
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
          if (!mounted.current) return
          setSearchResults([...searchResults])
        } catch (e) {
          console.error('Failed to get search: ', JSON.stringify(e, null, 2))
          if (!mounted.current) return
          setSearchResults([])
        }
      }

      setPrevAddressQuery(addressQuery)
    }
  })

  // Populate the address fields with the values from the selected search
  // results
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

  // Unmount cleanup
  React.useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      if (onClose != null) onClose()
    })
  }, [navigation, onClose])

  // Initialize scene with any saved form data from disklet
  useAsyncEffect(
    async () => {
      const diskletFormData = await getDiskletFormData(disklet, ADDRESS_FORM_DISKLET_NAME, asHomeAddress)
      if (diskletFormData != null && diskletFormData.country === countryCode) {
        setFormData(diskletFormData)
      }
    },
    [],
    'AddressFormScene'
  )

  const disableNextButton = (Object.keys(formData) as Array<keyof HomeAddress>).some(
    key =>
      // Disable next on empty non-optional fields
      key !== 'address2' && formData[key].trim() === ''
  )

  const scrollContent = (
    <>
      <GuiFormField
        fieldType="address"
        autofocus
        label={lstrings.form_field_title_address_line_1}
        value={formData.address}
        fieldRef={rAddressInput}
        onChangeText={handleChangeAddress}
        onFocus={handleShowAddressHints}
        onBlur={handleHideAddressHints}
      />
      <ExpandableList isExpanded={isHintsDropped} items={addressHints} maxDisplayedItems={MAX_DISPLAYED_HINTS} />
      <GuiFormField
        fieldType="address2"
        label={lstrings.form_field_title_address_line_2}
        value={formData.address2}
        onChangeText={handleChangeAddress2}
        onBlur={handleHideAddressHints}
      />
      <GuiFormField
        fieldType="city"
        label={lstrings.form_field_title_address_city}
        value={formData.city}
        onChangeText={handleChangeCity}
        onBlur={handleHideAddressHints}
      />
      <GuiFormField
        fieldType="state"
        label={lstrings.form_field_title_address_state_province_region}
        value={formData.state}
        onChangeText={handleChangeState}
        onBlur={handleHideAddressHints}
      />
      <GuiFormField
        fieldType="postalcode"
        returnKeyType="done"
        label={lstrings.form_field_title_address_zip_postal_code}
        value={formData.postalCode}
        onChangeText={handleChangePostalCode}
        onBlur={handleHideAddressHints}
      />
      <SceneButtons primary={{ label: lstrings.string_next_capitalized, disabled: disableNextButton, onPress: handleSubmit }} />
    </>
  )

  return (
    <SceneWrapper hasTabs hasNotifications avoidKeyboard>
      {({ undoInsetStyle, insetStyle }) => (
        <View style={{ ...undoInsetStyle, marginTop: 0 }}>
          <SceneHeader title={headerTitle} underline withTopMargin />
          {Platform.OS === 'ios' ? (
            <ScrollView contentContainerStyle={[{ ...insetStyle, ...styles.container }]} keyboardShouldPersistTaps="handled">
              {scrollContent}
            </ScrollView>
          ) : (
            <KeyboardAwareScrollView
              contentContainerStyle={{ ...insetStyle, ...styles.container }}
              keyboardShouldPersistTaps="handled"
              extraScrollHeight={theme.rem(2.75)}
              enableAutomaticScroll
              enableOnAndroid
              scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
            >
              {scrollContent}
            </KeyboardAwareScrollView>
          )}
        </View>
      )}
    </SceneWrapper>
  )
})

const getStyles = cacheStyles((theme: Theme) => {
  return {
    container: {
      paddingTop: 0,
      paddingHorizontal: theme.rem(0.5),
      flexGrow: 1
    },
    formSectionTitle: {
      marginLeft: theme.rem(0.5),
      marginTop: theme.rem(1),
      marginBottom: theme.rem(0.5),
      fontFamily: theme.fontFaceBold
    },
    rowContainer: {
      flexGrow: 1,
      flexShrink: 1,
      justifyContent: 'center',
      alignItems: 'flex-start',
      marginHorizontal: theme.rem(0.5),
      marginVertical: theme.rem(0.25)
    }
  }
})
