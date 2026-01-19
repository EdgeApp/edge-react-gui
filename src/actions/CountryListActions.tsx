import type { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { CountryListModal } from '../components/modals/CountryListModal'
import { StateProvinceListModal } from '../components/modals/StateProvinceListModal'
import {
  Airship,
  showError,
  showToast
} from '../components/services/AirshipInstance'
import { COUNTRY_CODES } from '../constants/CountryConstants'
import { lstrings } from '../locales/strings'
import type { ThunkAction } from '../types/reduxTypes'
import {
  readSyncedSettings,
  type SyncedAccountSettings,
  updateOneSetting,
  writeSyncedSettings
} from './SettingsActions'

/**
 * Checks if the countryCode and stateProvinceCode are valid. If not, show a
 * modal to select country and stateProvince codes.
 */
export const checkAndSetRegion = (props: {
  account: EdgeAccount
  countryCode: string
  stateProvinceCode?: string
}): ThunkAction<void> => {
  return (dispatch, getState) => {
    const { countryCode, stateProvinceCode } = props

    if (countryCode == null || countryCode === '') {
      // If no countryCode, always show country selection
      dispatch(showCountrySelectionModal(props)).catch((error: unknown) => {
        showError(error)
      })
    } else {
      // Show state province selection if stateProvinceCode is required according
      // to the country data
      const countryData = COUNTRY_CODES.find(
        cc => cc['alpha-2'] === countryCode
      )
      if (countryData != null && stateProvinceCode == null) {
        dispatch(
          showCountrySelectionModal({ ...props, skipCountry: true })
        ).catch((error: unknown) => {
          showError(error)
        })
      }
    }
  }
}

/**
 * Opens a country list modal, then a state province modal if needed.
 * If skipCountry is set, only a state province modal is shown.
 * If skipStateProvince is set, no state province modal is shown (useful for
 * flows that only need country, like gift cards).
 */
export const showCountrySelectionModal =
  (props: {
    account: EdgeAccount
    countryCode: string
    stateProvinceCode?: string

    /** Set to true to select stateProvinceCode only */
    skipCountry?: boolean

    /** Set to true to skip state/province selection entirely */
    skipStateProvince?: boolean
  }): ThunkAction<Promise<void>> =>
  async (dispatch, getState) => {
    const {
      account,
      countryCode,
      stateProvinceCode,
      skipCountry,
      skipStateProvince
    } = props

    let selectedCountryCode: string = countryCode
    if (skipCountry !== true) {
      // Always start by picking country unless otherwise specified
      selectedCountryCode = await Airship.show<string>(bridge => (
        <CountryListModal bridge={bridge} countryCode={countryCode} />
      ))
    }

    if (selectedCountryCode != null) {
      try {
        const country = COUNTRY_CODES.find(
          country => country['alpha-2'] === selectedCountryCode
        )
        if (country == null) throw new Error('Invalid country code')
        const { stateProvinces, name } = country
        let selectedStateProvince: string | undefined

        // Only prompt for state/province if not skipped and country has them
        if (skipStateProvince !== true && stateProvinces != null) {
          // This country has states/provinces. Show picker for that
          const previousStateProvince = stateProvinces.some(
            sp => sp['alpha-2'] === stateProvinceCode
          )
            ? stateProvinceCode
            : undefined
          selectedStateProvince = await Airship.show<string>(bridge => (
            <StateProvinceListModal
              countryCode={selectedCountryCode}
              bridge={bridge}
              stateProvince={previousStateProvince}
              stateProvinces={stateProvinces}
            />
          ))
          if (selectedStateProvince == null) {
            showToast(
              sprintf(lstrings.error_must_select_state_province_s, name)
            )
            return
          }
        }

        const syncedSettings = await readSyncedSettings(account)
        // When skipStateProvince is true and country didn't change, preserve
        // existing stateProvinceCode. If country changed, clear it since the
        // old state is no longer valid for the new country.
        const newStateProvinceCode =
          skipStateProvince === true && selectedCountryCode === countryCode
            ? stateProvinceCode
            : selectedStateProvince
        const updatedSettings: SyncedAccountSettings = {
          ...syncedSettings,
          countryCode: selectedCountryCode,
          stateProvinceCode: newStateProvinceCode
        }
        dispatch(
          updateOneSetting({
            countryCode: selectedCountryCode,
            stateProvinceCode: newStateProvinceCode
          })
        )
        await writeSyncedSettings(account, updatedSettings)
      } catch (error: any) {
        showError(error)
      }
    }
  }
