import React from 'react'
import {
  View,
  StyleSheet,
  Text,
  TouchableHighlight,
  Button
} from 'react-native'
import { connect } from 'react-redux'
// import styles from './styles.js'

const MaxButton = ({onPressMax}) => {

    return <Button
      onPress={onPressMax}
      title="Max"
      style={{flex: 1}}
    />
}

export default connect()(MaxButton)
