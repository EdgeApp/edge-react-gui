/* eslint-disable react-hooks/exhaustive-deps */
import { asArray, asObject, asOptional, asString } from 'cleaners'
import * as React from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Animated, { Easing, interpolateColor, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'

import { getDiskletFormData, setDiskletForm } from '../../../actions/FormActions'
import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../../../components/services/ThemeContext'
import { EdgeText } from '../../../components/themed/EdgeText'
import { MainButton } from '../../../components/themed/MainButton'
import { OutlinedTextInput, OutlinedTextInputRef } from '../../../components/themed/OutlinedTextInput'
import { SceneHeader } from '../../../components/themed/SceneHeader'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import s from '../../../locales/strings'
import { asHomeAddress, HomeAddress } from '../../../types/FormTypes'
import { useSelector } from '../../../types/reactRedux'
import { RouteProp } from '../../../types/routerTypes'
import { makePeriodicTask } from '../../../util/PeriodicTask'

interface Props {
  route: RouteProp<'guiPluginAddressForm'>
}

const FUZZY_SEARCH_INTERVAL = 2000
const MAX_DISPLAYED_HINTS = 5

const ADDRESS_FORM_DISKLET_NAME = 'homeAddress'
const ADDRESS_FORM_TITLE_MAP: { readonly [key: string]: string } = {
  address: s.strings.address_line_1,
  address2: s.strings.address_line_2,
  city: s.strings.city,
  state: s.strings.state_province_region,
  postalCode: s.strings.zip_postal_code,
  country: s.strings.country
}

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
    country: ''
  })
  const [isNeedsFuzzySearch, setIsNeedsFuzzySearch] = React.useState(false)
  const [searchResults, setSearchResults] = React.useState<HomeAddress[]>([])
  const [prevAddressQuery, setPrevAddressQuery] = React.useState<string | undefined>(undefined)
  const [isHintsDropped, setIsHintsDropped] = React.useState(false)
  const [isAnimateHintsNumChange, setIsAnimateHintsNumChange] = React.useState(false)
  const [hintHeight, setHintHeight] = React.useState<number>(0)

  const inputRefs = React.useRef<{ [key: string]: OutlinedTextInputRef | null }>({})

  const dropdownBorderColor = React.useMemo(() => [theme.iconDeactivated, theme.iconTappable], [theme])

  const sAnimationMult = useSharedValue(0)

  const dFinalHeight = useDerivedValue(() => {
    return hintHeight * Math.min(searchResults.length, MAX_DISPLAYED_HINTS)
  }, [searchResults])

  // Further calculations to determine the height. Also add another
  // conditional animation based on the number of hints changing as
  // the search query changes from user input
  const aDropContainerStyle = useAnimatedStyle(() => ({
    height: withTiming(dFinalHeight.value * sAnimationMult.value, {
      duration: isAnimateHintsNumChange ? 250 : 0,
      easing: Easing.inOut(Easing.circle)
    }),
    opacity: isHintsDropped ? 1 : withDelay(500, withTiming(0, { duration: 0 })),
    borderColor: interpolateColor(sAnimationMult.value, [0, 1], dropdownBorderColor)
  }))

  // The main hints dropdown animation depending on focus state of the
  // address field
  React.useEffect(() => {
    sAnimationMult.value = withTiming(isHintsDropped ? 1 : 0, {
      duration: 500,
      easing: Easing.inOut(Easing.circle)
    })
  }, [sAnimationMult, isHintsDropped])

  const handleHintLayout = useHandler(event => {
    if (event != null && hintHeight === 0) {
      const { height } = event.nativeEvent.layout
      setHintHeight(height)
    }
  })

  // TODO: Possibly break up parameterized handlers if not performant
  const handleInput = useHandler((inputKey: keyof HomeAddress) => (inputValue: string) => {
    formData[inputKey] = inputValue
    if (inputKey === 'address') {
      setIsNeedsFuzzySearch(true)
    }
    setFormData({ ...formData })
  })

  const handleBlur = useHandler((key: string) => () => {
    const inputRef = inputRefs.current[key]

    if (inputRef != null) {
      if (key === 'address') {
        setIsHintsDropped(false)
        // Avoid stacking multiple animation multipliers the next
        // time the dropdown opens
        setIsAnimateHintsNumChange(false)
      }
      inputRef.blur()
    }
  })

  const handleFocus = useHandler((key: string) => () => {
    setIsHintsDropped(key.split('_')[1].trim() === 'address')
  })

  // Populate the address fields with the values from the selected search
  // results
  const handleAddressHintPress = useHandler((searchResult: HomeAddress) => () => {
    const { address2, ...requiredFields } = searchResult
    setFormData({ ...formData, ...requiredFields })
    setIsHintsDropped(false)

    const addressInputRef = inputRefs.current.address
    if (addressInputRef != null) {
      addressInputRef.blur()
    }
  })

  const handleSubmit = useHandler(async () => {
    // Save user input to disk
    await setDiskletForm(disklet, ADDRESS_FORM_DISKLET_NAME, formData)

    onSubmit(formData)
  })

  // Search for address hints
  const handlePeriodicSearch = useHandler(async () => {
    const addressQuery = formData.address.trim()
    if (isNeedsFuzzySearch) {
      setIsNeedsFuzzySearch(false)

      // Only query for hints if enough input has been entered
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

  // Initialize scene with any saved form data from disklet
  useAsyncEffect(async () => {
    const diskletFormData = await getDiskletFormData(disklet, ADDRESS_FORM_DISKLET_NAME, asHomeAddress)
    if (diskletFormData != null) {
      setFormData(diskletFormData)
    }
    return () => {}
  }, [])

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

    return () => {}

    // Don't want to react on isHintsDropped, only changes to the
    // number of results while dropdown is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults])

  return (
    <SceneWrapper background="theme">
      <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" extraScrollHeight={theme.rem(2.75)} enableAutomaticScroll enableOnAndroid>
        <SceneHeader title={headerTitle} underline withTopMargin />
        <EdgeText style={styles.formSectionTitle}>{s.strings.home_address}</EdgeText>
        {(Object.keys(ADDRESS_FORM_TITLE_MAP) as Array<keyof HomeAddress>).map(key => {
          return (
            <View key={key}>
              <OutlinedTextInput
                returnKeyType="next"
                label={ADDRESS_FORM_TITLE_MAP[key]}
                onChangeText={handleInput(key)}
                value={formData != null ? formData[key] ?? '' : ''}
                autoFocus={key === 'address'}
                onFocus={handleFocus(key)}
                onBlur={handleBlur(key)}
                ref={input => (inputRefs.current[key] = input)}
              />
              {key === 'address' ? (
                <Animated.View style={[styles.dropContainer, aDropContainerStyle]}>
                  <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled>
                    {searchResults.map(searchResult => {
                      const displaySearchResult = `${searchResult.address} ${searchResult.city}, ${searchResult.state} ${searchResult.postalCode}`
                      return (
                        <TouchableOpacity key={searchResults.indexOf(searchResult)} onPress={handleAddressHintPress(searchResult)}>
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
              ) : null}
            </View>
          )
        })}
        <MainButton
          label={s.strings.string_next_capitalized}
          marginRem={[1, 0.5, 1, 0.5]}
          type="secondary"
          disabled={(Object.keys(formData) as Array<keyof HomeAddress>).some(
            key =>
              // Empty non-optional fields
              key !== 'address2' && formData[key].trim() === ''
          )}
          onPress={handleSubmit}
        />
      </KeyboardAwareScrollView>
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
    borderColor: theme.iconTappable,
    borderTopWidth: 0,
    borderWidth: theme.thinLineWidth,
    overflow: 'hidden',
    position: 'absolute',
    top: theme.rem(3.5),
    left: theme.rem(1),
    right: theme.rem(1)
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
}))
