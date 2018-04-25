// @flow

import React from 'react'
import { Button } from 'react-native'

import styles from './styles.js'

const MaxButton = ({ onMaxPress, mode }: { onMaxPress: () => void, mode: string }) => (
  <Button onPress={onMaxPress} title="Max" color={styles[mode]['color']} style={[styles.button]} />
)

export default MaxButton
