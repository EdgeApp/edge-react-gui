// @flow

import React, { Component } from 'react'
import { TouchableHighlight, View } from 'react-native'

import FormattedText from '../../modules/UI/components/FormattedText/index'
import SearchResults from '../../modules/UI/components/SearchResults/index'
import styles from '../../styles/scenes/TransactionDetailsStyle'
import { colors } from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform.js'
import type { SubcategorySearchResultData } from '../../types.js'

const categories = ['income', 'expense', 'exchange', 'transfer']

type State = {
  subcategories: Array<string>,
  filteredSubcategories: Array<string>,
  enteredSubcategory: string
}
type Props = {
  subcategoriesList: Array<string>,
  enteredSubcategory: string,
  usableHeight: number,
  onPressFxn: (input: string) => void
}

class SubCategorySelect extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      subcategories: this.props.subcategoriesList,
      filteredSubcategories: this.props.subcategoriesList.sort(),
      enteredSubcategory: this.props.enteredSubcategory
    }
    // this.props.usableHight = PLATFORM.usableHeight
  }

  render () {
    const filteredSubcats = !this.props.enteredSubcategory
      ? this.props.subcategoriesList
      : this.props.subcategoriesList.filter(entry => entry.indexOf(this.props.enteredSubcategory) >= 0)
    let newPotentialSubCategories = []
    let newPotentialSubCategoriesFiltered = []
    if (this.props.enteredSubcategory) {
      newPotentialSubCategories = categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1) + ':' + this.props.enteredSubcategory)
      newPotentialSubCategoriesFiltered = newPotentialSubCategories.filter(cat => this.props.subcategoriesList.indexOf(cat) < 0)
    }

    return (
      <SearchResults
        renderRegularResultFxn={this.renderSubcategory}
        onRegularSelectFxn={this.props.onPressFxn}
        regularArray={filteredSubcats.concat(newPotentialSubCategoriesFiltered)}
        usableHeight={this.props.usableHeight}
        style={[{ width: PLATFORM.deviceWidth, height: PLATFORM.usableHeight }]}
        keyExtractor={this.keyExtractor}
        height={this.props.usableHeight - 67}
        extraTopSpace={0}
        filterArray={newPotentialSubCategoriesFiltered}
      />
    )
  }

  renderSubcategory = (data: SubcategorySearchResultData, onRegularSelectFxn: Function, filterArray: Array<any>) => {
    const renderAdd = () => {
      if (filterArray.find(item => item === data.item)) {
        return (
          <View style={[styles.rowPlusWrap]}>
            <FormattedText style={[styles.rowPlus]}>+</FormattedText>
          </View>
        )
      }
    }

    return (
      <TouchableHighlight delayPressIn={60} style={[styles.rowContainer]} underlayColor={colors.gray4} onPress={() => this.props.onPressFxn(data.item)}>
        <View style={[styles.rowContent]}>
          <View style={[styles.rowCategoryTextWrap]}>
            <FormattedText style={[styles.rowCategoryText]} numberOfLines={1}>
              {data.item}
            </FormattedText>
          </View>
          {renderAdd()}
        </View>
      </TouchableHighlight>
    )
  }

  keyExtractor = (item: any, index: number) => index
}

export default SubCategorySelect
