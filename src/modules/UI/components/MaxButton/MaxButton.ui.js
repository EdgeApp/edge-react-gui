/* eslint-disable flowtype/require-valid-file-annotation */

import React from 'react'
import { Button } from 'react-native'

import styles from './styles.js'

const MaxButton = ({ onMaxPress, mode }) => <Button onPress={onMaxPress} title="Max" color={styles[mode]['color']} style={[styles.button]} />

export default MaxButton
