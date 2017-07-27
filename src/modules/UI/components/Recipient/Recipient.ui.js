import React from 'react'
import {
  View,
  StyleSheet,
  Text
} from 'react-native'
import { connect } from 'react-redux'
import {sprintf} from 'sprintf-js'
import strings from '../../../../locales/default.js'

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 30,
    marginBottom: 15,
    marginHorizontal: 35
  },
  text: {
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 0,
    fontSize: 17,
    marginHorizontal: 5
  }
})

const Recipient = ({ label = '1323424', publicAddress = 'asdcasdc' }) => {
  const getLabel = () => {
    if (label) {
      return <Text style={styles.text} ellipsizeMode='middle' numberOfLines={1}>{label}</Text>
    }
  }
  return (
    <View style={styles.container}>
      <Text style={[ styles.text, {fontSize: 14} ]}>
        {sprintf(strings.enUS['send_to_title'])}
      </Text>
      {getLabel()}
      <Text style={[ styles.text ]}
        ellipsizeMode='middle' numberOfLines={1}>
        {publicAddress}
      </Text>
    </View>
  )
}

export default connect()(Recipient)
