/* eslint-disable react-native/no-raw-text */
import { DrawerContentComponentProps } from '@react-navigation/drawer'
import * as React from 'react'

import { getRootNavigation } from '../../actions/LoginActions'
import { Services } from '../services/Services'

export function SideMenu(props: DrawerContentComponentProps) {
  const rootNavigation = getRootNavigation(props.navigation as any)

  return <Services navigation={rootNavigation} />
}
