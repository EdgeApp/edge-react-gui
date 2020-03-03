// @flow
import { bns } from 'biggystring'
import React, { Component } from 'react'
import { View, TextInput, TouchableWithoutFeedback } from 'react-native'
import s from '../../locales/strings.js'
import { type AirshipBridge, AirshipModal } from '../modals/modalParts'
import { sprintf } from 'sprintf-js'

import { FormField } from '../common/FormField'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import styles, { materialInput } from '../../styles/scenes/TransactionDetailsStyle'
import THEME from '../../theme/variables/airbitz'
import SubCategorySelect from '../common/TransactionSubCategorySelect.js'

type CategoriesType = Array<{
  key: string,
  syntax: string
}>

type Props = {
  bridge: AirshipBridge<null>,
  categories: Object,
  subCategories: Array<string>,
  category: string,
  subCategory: string,
  onChange: (string, string) => void,
  setNewSubcategory: (string, Array<string>) => void
}

type State = {
  categories: CategoriesType,
  category: string,
  subCategory: string
}

export class TransactionDetailsCategoryInput extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    const { category, subCategory } = props
    const categories = this.formattedCategories(props.categories)
    this.state = { categories, category, subCategory }
  }
  formattedCategories = (categories: Object) : CategoriesType => {
    return Object.keys(categories).map(key => {
      return {
        key: categories[key].key,
        syntax: categories[key].syntax
      }
    })
  }
  onChangeCategory = (category: string) => {
    this.setState({ category })
    this.props.onChange(category, this.state.subCategory)
  }
  onChangeSubCategory = (subCategory: string) => {
    this.setState({ subCategory })
    this.props.onChange(this.state.category, subCategory)
  }
  onSelectSubCategory = (input: string) => {
    const { bridge, subCategories, setNewSubcategory } = this.props
    const splittedSubCategory = input.split(':')
    const category = splittedSubCategory[0].toLowerCase()
    const subCategory = splittedSubCategory[1]
    this.setState({ category, subCategory })
    this.props.onChange(category, subCategory)
    if (!subCategories.find(item => item === input)) {
      setNewSubcategory(input, subCategories)
    }
    bridge.resolve(null)
  }
  render() {
    const { bridge, subCategories } = this.props
    const { categories, category, subCategory } = this.state
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(null)}>
        <TouchableWithoutFeedback onPress={() => bridge.resolve(null)}>
          <View style={styles.airshipContainer}>
            <FormattedText style={styles.airshipHeader}>{s.strings.transaction_details_category_title}</FormattedText>
            <View style={styles.inputCategoryMainContainter}>
              <FormattedText style={styles.inputCategoryListHeader}>
                {s.strings.tx_detail_picker_title}
              </FormattedText>
              <View style={styles.InputCategoryRow}>
                {categories.map(item => {
                  const containterStyle = category === item.key ?
                    styles.inputCategoryContainterSelected :
                    styles.inputCategoryContainter
                  return (
                    <TouchableWithoutFeedback onPress={() => this.onChangeCategory(item.key)} key={item.key}>
                      <View style={containterStyle}>
                        <FormattedText style={styles.inputCategoryText}>{item.syntax}</FormattedText>
                      </View>
                    </TouchableWithoutFeedback>
                  )
                })}
              </View>
            </View>
            <View style={styles.inputSubCategoryContainter}>
              <FormField
                autoFocus
                blurOnSubmit
                autoCapitalize="none"
                label="Choose a sub-category"
                returnKeyType={'done'}
                style={materialInput}
                fontSize={materialInput.fontSize}
                labelFontSize={materialInput.labelFontSize}
                onChangeText={this.onChangeSubCategory}
                onSubmitEditing={() => bridge.resolve(null)}
                value={subCategory}
              />
            </View>
            <SubCategorySelect
              bottomGap={0}
              onPressFxn={this.onSelectSubCategory}
              enteredSubcategory={subCategory}
              subcategoriesList={this.getSortedSubCategories()}
              categories={this.getSortedCategories()}
            />
          </View>
        </TouchableWithoutFeedback>
      </AirshipModal>
    )
  }
  getSortedCategories = (): Array<string> => {
    const { categories, category } = this.state
    const selectedCategories = categories.filter(item => item.key === category)
    const filteredCategories = categories.filter(item => item.key !== category)
    const sortedCategories = [ ...selectedCategories, ...filteredCategories ]
    return sortedCategories.map(category => category.key)
  }
  getSortedSubCategories = () => {
    const { categories, subCategories } = this.props
    const { category } = this.state

    const selectedSubcategories = subCategories.filter(subCategory => {
      const splittedSubCategory = subCategory.split(':')
      return splittedSubCategory[0].toLowerCase() === categories[category].syntax.toLowerCase()
    })
    const filteredSubcategories = subCategories.filter(subCategory => {
      const splittedSubCategory = subCategory.split(':')
      return splittedSubCategory[0].toLowerCase() !== categories[category].syntax.toLowerCase()
    })
    return [...selectedSubcategories, ...filteredSubcategories]
  }
}
