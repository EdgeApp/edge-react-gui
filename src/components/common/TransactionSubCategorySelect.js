// @flow

import * as React from 'react'
import { FlatList, StyleSheet, TouchableHighlight, View } from 'react-native'

import { FormattedText } from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import type { SubcategorySearchResultData } from '../../types/types.js'
import { scale } from '../../util/scaling.js'

type State = {
  subcategories: string[],
  filteredSubcategories: string[],
  enteredSubcategory: string
}
type Props = {
  bottomGap: number,
  subcategoriesList: string[],
  enteredSubcategory: string,
  onPressFxn: (input: string) => void,
  categories: string[]
}

export class SubCategorySelect extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      subcategories: this.props.subcategoriesList,
      filteredSubcategories: this.props.subcategoriesList,
      enteredSubcategory: this.props.enteredSubcategory
    }
  }

  filterSubcategory = () => {
    const { subcategoriesList, enteredSubcategory } = this.props
    return subcategoriesList.filter(subCategory => subCategory.toLowerCase().includes(enteredSubcategory.toLowerCase()))
  }

  render() {
    const { categories } = this.props
    const filteredSubcats = !this.props.enteredSubcategory ? this.props.subcategoriesList : this.filterSubcategory()
    let newPotentialSubCategories = []
    let newPotentialSubCategoriesFiltered = []
    if (this.props.enteredSubcategory) {
      newPotentialSubCategories = categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1) + ':' + this.props.enteredSubcategory)
      newPotentialSubCategoriesFiltered = newPotentialSubCategories.filter(cat => this.props.subcategoriesList.indexOf(cat) < 0)
    }

    return (
      <FlatList
        style={styles.resultList}
        contentContainerStyle={{ paddingBottom: this.props.bottomGap }}
        data={filteredSubcats.concat(newPotentialSubCategoriesFiltered)}
        initialNumToRender={12}
        keyboardShouldPersistTaps="handled"
        keyExtractor={this.keyExtractor}
        renderItem={rowData => this.renderSubcategory(rowData, newPotentialSubCategoriesFiltered)}
      />
    )
  }

  renderSubcategory = (data: SubcategorySearchResultData, filterArray: any[]) => {
    const renderAdd = () => {
      if (filterArray.find(item => item === data.item)) {
        return (
          <View style={styles.rowPlusWrap}>
            <FormattedText style={styles.rowPlus}>+</FormattedText>
          </View>
        )
      }
    }

    return (
      <TouchableHighlight delayPressIn={60} style={styles.rowContainer} underlayColor={THEME.COLORS.GRAY_4} onPress={() => this.props.onPressFxn(data.item)}>
        <View style={styles.rowContent}>
          <View style={styles.rowCategoryTextWrap}>
            <FormattedText style={styles.rowCategoryText} numberOfLines={1}>
              {data.item}
            </FormattedText>
          </View>
          {renderAdd()}
        </View>
      </TouchableHighlight>
    )
  }

  keyExtractor = (item: any, index: number) => String(index)
}

const rawStyles = {
  resultList: {
    backgroundColor: THEME.COLORS.WHITE,
    borderTopColor: THEME.COLORS.GRAY_3,
    borderTopWidth: 1,
    flex: 1
  },
  rowContainer: {
    flex: 1,
    height: THEME.rem(3.1),
    paddingLeft: THEME.rem(0.6),
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.COLORS.WHITE,
    borderBottomWidth: 1,
    borderColor: THEME.COLORS.TRANSACTION_DETAILS_GREY_4
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    paddingRight: scale(20)
  },
  rowCategoryTextWrap: {
    flex: 1,
    justifyContent: 'center',
    marginRight: scale(5)
  },
  rowCategoryText: {
    fontSize: THEME.rem(0.95)
  },
  rowPlusWrap: {
    justifyContent: 'center'
  },
  rowPlus: {
    fontSize: THEME.rem(0.95)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
