// @flow

import React from 'react'

import { makeAirship } from '../common/Airship.js'
import { AirshipToast } from '../common/AirshipToast.js'

export const Airship = makeAirship()

export function showActivity<T> (message: string, promise: Promise<T>): Promise<T> {
  Airship.show(bridge => <AirshipToast bridge={bridge} message={message} activity={promise} />)
  return promise
}

export function showToast (message: string) {
  return Airship.show(bridge => <AirshipToast bridge={bridge} message={message} />)
}
