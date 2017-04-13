import { View, StyleSheet, Text } from 'react-native';
import { connect } from 'react-redux'
import React from 'react';

const styles = StyleSheet.create({
  view: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  feesInCrypto: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  feesInFiat: {
    alignItems: 'center',
    justifyContent: 'center'
  }
})

const Fees = ({feesInCrypto, feesInFiat}) => {
    return (
      <View style={styles.view}>
        <Text style={styles.label}>
          (Fee)
        </Text>

        <Text style={styles.feesInCrypto}>
          $ + {feesInCrypto}
        </Text>

        <Text style={styles.feesInFiat}>
          b + {feesInFiat}
        </Text>
      </View>
    )
}

export default connect()(Fees)
