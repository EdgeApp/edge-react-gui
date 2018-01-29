import React, {Component} from 'react'
import {
  View,
  TouchableHighlight,
  Image,
  KeyboardAvoidingView
} from 'react-native'
import SearchResults from '../../components/SearchResults'
import FormattedText from '../../components/FormattedText'
import ContactImage from '../../../../assets/images/contact.png'
import styles from './style'

class ContactSearchResults extends Component {
  render () {
    const filteredArray = this.props.contacts.filter((entry) =>
      (entry.givenName + ' ' + entry.familyName).indexOf(this.props.currentPayeeText) >= 0)

    return (
      <SearchResults
        renderRegularResultFxn={this.renderResult}
        onRegularSelectFxn={this.props.onSelectPayee}
        regularArray={filteredArray}
        usableHeight={this.props.usableHeight}
        style={styles.SearchResults}
        keyExtractor={this.keyExtractor}
        height={this.props.usableHeight - 32}
        extraTopSpace={-10}
      />
    )
  }

  renderResult = (data, onRegularSelectFxn) => {
    const fullName = data.item.familyName ? data.item.givenName + ' ' + data.item.familyName : data.item.givenName

    return (
      <KeyboardAvoidingView style={styles.singleContactWrap} behavior="height">
        <TouchableHighlight style={[styles.singleContact]}
          onPress={() => onRegularSelectFxn(fullName, data.item.thumbnailPath)}
          underlayColor={styles.underlayColor.color}>
          <View style={[styles.contactInfoWrap]}>
            <View style={styles.contactLeft}>
              <View style={[styles.contactLogo]} >
                {
                  data.item.thumbnailPath
                  ? <Image source={{uri: data.item.thumbnailPath}} style={{height: 40, width: 40, borderRadius: 20}} />
                  : <Image source={ContactImage} style={{height: 40, width: 40, borderRadius: 20}} />
                }

              </View>
              <View style={[styles.contactLeftTextWrap]}>
                <FormattedText style={[styles.contactName]}>{fullName}</FormattedText>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </KeyboardAvoidingView>
    )
  }

  keyExtractor = (item, index) => index
}

export default ContactSearchResults
