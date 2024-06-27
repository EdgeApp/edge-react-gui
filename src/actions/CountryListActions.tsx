import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { CountryListModal } from '../components/modals/CountryListModal'
import { StateProvinceListModal } from '../components/modals/StateProvinceListModal'
import { Airship, showError, showToast } from '../components/services/AirshipInstance'
import { COUNTRY_CODES } from '../constants/CountryConstants'
import { lstrings } from '../locales/strings'
import { ThunkAction } from '../types/reduxTypes'
import { readSyncedSettings, SyncedAccountSettings, updateOneSetting, writeSyncedSettings } from './SettingsActions'

/**
 * Checks if the countryCode and stateProvinceCode are valid. If not, show a
 * modal to select country and stateProvince codes.
 */
export const checkAndSetRegion = (props: { account: EdgeAccount; countryCode: string; stateProvinceCode?: string }): ThunkAction<void> => {
  return async (dispatch, getState) => {
    const { countryCode, stateProvinceCode } = props

    if (countryCode == null || countryCode === '') {
      // If no countryCode, always show country selection
      await dispatch(showCountrySelectionModal(props))
    } else {
      // Show state province selection if stateProvinceCode is required according
      // to the country data
      const countryData = COUNTRY_CODES.find(cc => cc['alpha-2'] === countryCode)
      if (countryData != null && stateProvinceCode == null) {
        await dispatch(showCountrySelectionModal({ ...props, skipCountry: true }))
      }
    }
  }
}

/**
 * Opens a country list modal, then a state province modal if needed.
 * If skipCountry is set, only a state province modal is shown
 */
export const showCountrySelectionModal =
  (props: {
    account: EdgeAccount
    countryCode: string
    stateProvinceCode?: string

    /** Set to true to select stateProvinceCode only */
    skipCountry?: boolean
  }): ThunkAction<Promise<void>> =>
  async (dispatch, getState) => {
    const { account, countryCode, stateProvinceCode, skipCountry } = props

    let selectedCountryCode: string = countryCode
    if (skipCountry !== true) {
      // Always start by picking country unless otherwise specified
      selectedCountryCode = await Airship.show<string>(bridge => <CountryListModal bridge={bridge} countryCode={countryCode} />)
    }

    if (selectedCountryCode != null) {
      try {
        const country = COUNTRY_CODES.find(country => country['alpha-2'] === selectedCountryCode)
        if (country == null) throw new Error('Invalid country code')
        const { stateProvinces, name } = country
        let selectedStateProvince: string | undefined
        if (stateProvinces != null) {
          // This country has states/provinces. Show picker for that
          const previousStateProvince = stateProvinces.some(sp => sp['alpha-2'] === stateProvinceCode) ? stateProvinceCode : undefined
          selectedStateProvince = await Airship.show<string>(bridge => (
            <StateProvinceListModal countryCode={selectedCountryCode} bridge={bridge} stateProvince={previousStateProvince} stateProvinces={stateProvinces} />
          ))
          if (selectedStateProvince == null) {
            showToast(sprintf(lstrings.error_must_select_state_province_s, name))
            return
          }
        }
        const syncedSettings = await readSyncedSettings(account)
        const updatedSettings: SyncedAccountSettings = {
          ...syncedSettings,
          countryCode: selectedCountryCode,
          stateProvinceCode: selectedStateProvince
        }
        await dispatch(updateOneSetting({ countryCode: selectedCountryCode, stateProvinceCode: selectedStateProvince }))
        await writeSyncedSettings(account, updatedSettings)
      } catch (error: any) {
        showError(error)
      }
    }
  }
