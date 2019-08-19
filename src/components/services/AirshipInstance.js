// @flow

import React from 'react'

import { makeAirship } from '../common/Airship.js'
import { AirshipToast } from '../common/AirshipToast.js'

export const Airship = makeAirship()

export function showToast (message: string) {
  return Airship.show(bridge => <AirshipToast bridge={bridge} message={message} />)
}
