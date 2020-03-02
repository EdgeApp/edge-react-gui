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

type Props = {
  bridge: AirshipBridge<null>,
  categories: Array<string>,
  subCategories: Array<string>,
  category: string,
  subCategory: string,
  onChange: (string, string) => void,
  setNewSubcategory: (string, Array<string>) => void
}

type State = {
  category: string,
  subCategory: string
}

export class TransactionDetailsCategoryInput extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    const { category, subCategory } = props
    this.state = { category, subCategory }
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
    const { bridge, categories, subCategories } = this.props
    const { category, subCategory } = this.state
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
                  const containterStyle = category.toLowerCase() === item.toLowerCase() ?
                    styles.inputCategoryContainterSelected :
                    styles.inputCategoryContainter
                  return (
                    <TouchableWithoutFeedback onPress={() => this.onChangeCategory(item.toLowerCase())} key={item}>
                      <View style={containterStyle}>
                        <FormattedText style={styles.inputCategoryText}>{item}</FormattedText>
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
                onSubmitEditing={this.onChangeSubCategory}
                value={subCategory}
              />
            </View>
            <SubCategorySelect
              bottomGap={0}
              onPressFxn={this.onSelectSubCategory}
              enteredSubcategory={subCategory}
              subcategoriesList={subCategories}
            />
          </View>
        </TouchableWithoutFeedback>
      </AirshipModal>
    )
  }
  // getSubcategories = () => {
  //   const { categories, subCategories } = this.props
  //   const formattedCategories = categories.map(category => {
  //     const lowerCaseCategory = category.toLowerCase()
  //     const formattedSubCategories = subCategories.map(subCategory => {
  //       const splittedSubCategory = subCategory.split(':')
  //       const lowerCaseOwnSubCategory = splittedSubCategory[0].toLowerCase()
  //       return lowerCaseCategory === lowerCaseOwnSubCategory ? splittedSubCategory[1] : null
  //     })
  //     const filteredSubCategories = formattedSubCategories.filter(subCategory => subCategory != null)
  //     return {
  //       [category]: filteredSubCategories
  //     }
  //   })
  //   // This converts an array to object. This should be Object.assign() but having flow error
  //   return formattedCategories.reduce((previous, current) => ({ ...previous, ...current }), {})
  // }
}
