import React, {Component} from 'react'
import {
    View,
    TouchableHighlight
} from 'react-native'
import FormattedText from '../../components/FormattedText'
import SearchResults from '../../components/SearchResults/index'
import styles from './style'
import {colors} from '../../../../theme/variables/airbitz'
import platform from '../../../../theme/variables/platform.js'

const categories = ['income', 'expense', 'exchange', 'transfer']

class SubCategorySelect extends Component {
  constructor (props: Props) {
    super(props)
    this.state = {
      subcategories: this.props.subcategoriesList,
      filteredSubcategories: this.props.subcategoriesList.sort(),
      enteredSubcategory: this.props.enteredSubcategory
    }
    // this.props.usableHight = platform.usableHeight
  }

  render () {
    let filteredSubcats = (!this.props.enteredSubcategory) ? this.props.subcategoriesList : this.props.subcategoriesList.filter((entry) => entry.indexOf(this.props.enteredSubcategory) >= 0)
    let newPotentialSubCategories = []
    let newPotentialSubCategoriesFiltered = []
    if (this.props.enteredSubcategory) {
      newPotentialSubCategories = categories.map((cat) => cat.charAt(0).toUpperCase() + cat.slice(1) + ':' + this.props.enteredSubcategory)
      newPotentialSubCategoriesFiltered = newPotentialSubCategories.filter((cat) => this.props.subcategoriesList.indexOf(cat) < 0)
    }

    return (
      <SearchResults
        renderRegularResultFxn={this.renderSubcategory}
        onRegularSelectFxn={this.props.onPressFxn}
        regularArray={filteredSubcats.concat(newPotentialSubCategoriesFiltered)}
        usableHeight={this.props.usableHeight}
        style={[{width: platform.deviceWidth, height: platform.usableHeight}]}
        keyExtractor={this.keyExtractor}
        height={this.props.usableHeight - 51}
        extraTopSpace={0}
      />
    )
  }

  renderSubcategory (data, onRegularSelectFxn) {
    return (
      <TouchableHighlight delayPressIn={60} style={[styles.rowContainer]} underlayColor={colors.gray4} onPress={() => (onRegularSelectFxn(data.item))}>
        <View style={[styles.rowContent]}>
          <View style={[styles.rowCategoryTextWrap]}>
            <FormattedText style={[styles.rowCategoryText]} numberOfLines={1}>{data.item}</FormattedText>
          </View>
          <View style={[styles.rowPlusWrap]}>
            <FormattedText style={[styles.rowPlus]}>+</FormattedText>
          </View>
        </View>
      </TouchableHighlight>
    )
  }

  keyExtractor = (item, index) => index
}

export default SubCategorySelect