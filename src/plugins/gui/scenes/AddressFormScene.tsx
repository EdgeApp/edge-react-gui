/* eslint-disable react-hooks/exhaustive-deps */
import { asArray, asObject, asOptional, asString } from 'cleaners'
import * as React from 'react'
import { Platform, ScrollView, TouchableOpacity, View, ViewStyle } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Animated, { Easing, interpolateColor, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated'

import { NotificationSceneWrapper } from '../../../components/common/SceneWrapper'
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
import { EdgeSceneProps } from '../../../types/routerTypes'
import { getDiskletFormData, setDiskletForm } from '../../../util/formUtils'
import { makePeriodicTask } from '../../../util/PeriodicTask'
import { GuiFormField } from '../components/GuiFormField'

interface Props extends EdgeSceneProps<'guiPluginAddressForm'> {}

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
  const { navigation, route } = props
  const { countryCode, headerTitle, /* headerIconUri, */ onSubmit } = route.params
  const disklet = useSelector(state => state.core.disklet)
  const dropdownBorderColor = React.useMemo(() => [theme.iconDeactivated, theme.iconTappable], [theme])

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
  const [isAnimateHintsNumChange, setIsAnimateHintsNumChange] = React.useState(false)
  const [hintHeight, setHintHeight] = React.useState<number>(0)

  const rAddressInput = React.createRef<OutlinedTextInputRef>()

  const mounted = React.useRef<boolean>(true)

  const sAnimationMult = useSharedValue(0)

  const dFinalHeight = useDerivedValue(() => {
    return hintHeight * Math.min(searchResults.length, MAX_DISPLAYED_HINTS)
  }, [searchResults, hintHeight])

  // Further calculations to determine the height. Also add another
  // conditional animation based on the number of hints changing as
  // the search query changes from user input
  const aDropContainerStyle = useAnimatedStyle(
    () => ({
      height: withTiming(dFinalHeight.value * sAnimationMult.value, {
        duration: isAnimateHintsNumChange ? 250 : 0,
        easing: Easing.inOut(Easing.circle)
      }),
      opacity: isHintsDropped && searchResults.length > 0 ? sAnimationMult.value : withTiming(0, { duration: 500 }),

      borderColor: interpolateColor(sAnimationMult.value, [0, 1], dropdownBorderColor)
    }),
    [isHintsDropped, searchResults.length]
  )

  const handleHintLayout = useHandler(event => {
    if (event != null && hintHeight === 0) {
      const { height } = event.nativeEvent.layout
      setHintHeight(height)
    }
  })

  const handleShowAddressHints = useHandler(() => {
    setIsHintsDropped(true)
  })

  const handleHideAddressHints = useHandler(() => {
    setIsHintsDropped(false)

    // Avoid stacking multiple animation multipliers the next
    // time the dropdown opens
    setIsAnimateHintsNumChange(false)
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
  const addressHintPress = (selectedAddressHint: HomeAddress) => () => {
    setFormData({ ...selectedAddressHint }) // Update address's value with new value

    if (rAddressInput.current != null) {
      rAddressInput.current.blur()
    }
  }

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

  // The main hints dropdown animation depending on focus state of the
  // address field
  React.useEffect(() => {
    sAnimationMult.value = withTiming(isHintsDropped ? 1 : 0, {
      duration: 500,
      easing: Easing.inOut(Easing.circle)
    })
  }, [sAnimationMult, isHintsDropped])

  // Periodically run a fuzzy search on changed address user input
  React.useEffect(() => {
    const task = makePeriodicTask(handlePeriodicSearch, FUZZY_SEARCH_INTERVAL)
    task.start({ wait: false })

    return () => task.stop()
  }, [handlePeriodicSearch])

  // Changes to the number of address hints results should trigger
  // another animation if the hints are are open
  React.useEffect(() => {
    setIsAnimateHintsNumChange(isHintsDropped)

    // Don't want to react on isHintsDropped, only changes to the
    // number of results while dropdown is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults])

  // Initialize scene with any saved form data from disklet
  useAsyncEffect(async () => {
    const diskletFormData = await getDiskletFormData(disklet, ADDRESS_FORM_DISKLET_NAME, asHomeAddress)
    if (diskletFormData != null && diskletFormData.country === countryCode) {
      setFormData(diskletFormData)
    }
  }, [])

  const disableNextButton = (Object.keys(formData) as Array<keyof HomeAddress>).some(
    key =>
      // Disable next on empty non-optional fields
      key !== 'address2' && formData[key].trim() === ''
  )
  return (
    <NotificationSceneWrapper navigation={navigation} background="theme">
      {(gap, notificationHeight) => (
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={theme.rem(2.75)}
          enableAutomaticScroll
          enableOnAndroid
          contentContainerStyle={{ paddingBottom: notificationHeight }}
        >
          <SceneHeader title={headerTitle} underline withTopMargin />
          <EdgeText style={styles.formSectionTitle}>{lstrings.home_address_title}</EdgeText>
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
          <Animated.View style={[Platform.OS === 'ios' ? styles.dropContainer : styles.dropContainerAndroid, aDropContainerStyle]}>
            <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled>
              {searchResults.map(searchResult => {
                const displaySearchResult = `${searchResult.address}\n${searchResult.city}, ${searchResult.state}, ${countryCode}`
                return (
                  <TouchableOpacity key={searchResults.indexOf(searchResult)} onPress={addressHintPress(searchResult)}>
                    <View style={styles.rowContainer} onLayout={handleHintLayout}>
                      <EdgeText style={styles.addressHintText} numberOfLines={2}>
                        {displaySearchResult}
                      </EdgeText>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </Animated.View>
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
          <MainButton
            label={lstrings.string_next_capitalized}
            marginRem={[1, 0.5, 1, 0.5]}
            type="secondary"
            disabled={disableNextButton}
            onPress={handleSubmit}
          />
        </KeyboardAwareScrollView>
      )}
    </NotificationSceneWrapper>
  )
})

const getStyles = cacheStyles((theme: Theme) => {
  const dropContainerCommon: ViewStyle = {
    backgroundColor: theme.modal,
    borderRadius: theme.rem(0.5),
    zIndex: 1,
    borderColor: theme.iconTappable,
    borderWidth: theme.thinLineWidth,
    overflow: 'hidden',
    position: 'absolute',
    left: theme.rem(0.5),
    right: theme.rem(0.5)
  }
  return {
    addressHintText: {
      marginHorizontal: theme.rem(0.5),
      marginVertical: theme.rem(0.25)
    },
    dropContainer: {
      top: theme.rem(10.25),
      ...dropContainerCommon
    },
    dropContainerAndroid: {
      top: theme.rem(10.5) - 3,
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
