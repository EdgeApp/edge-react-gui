// @flow

import React, { Component } from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'

import s from '../../locales/strings.js'
import FormattedText from '../../modules/UI/components/FormattedText/index.js'
import styles, { materialInput } from '../../styles/scenes/TransactionDetailsStyle.js'
import { splitTransactionCategory } from '../../util/utils.js'
import { FormField } from '../common/FormField.js'
import SubCategorySelect from '../common/TransactionSubCategorySelect.js'
import { type AirshipBridge, AirshipModal } from './modalParts.js'

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
  constructor(props: Props) {
    super(props)
    const { category, subCategory } = props
    const categories = this.formattedCategories(props.categories)
    this.state = { categories, category, subCategory }
  }

  formattedCategories = (categories: Object): CategoriesType => {
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
    const splittedFullCategory = splitTransactionCategory(input)
    const { subCategory } = splittedFullCategory
    const category = splittedFullCategory.category.toLowerCase()
    this.setState({ category, subCategory })
    this.props.onChange(category, subCategory)
    if (!subCategories.find(item => item === input)) {
      setNewSubcategory(input, subCategories)
    }
    bridge.resolve(null)
  }

  render() {
    const { bridge } = this.props
    const { categories, category, subCategory } = this.state
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(null)}>
        <TouchableWithoutFeedback onPress={() => bridge.resolve(null)}>
          <View style={styles.airshipContainer}>
            <FormattedText style={styles.airshipHeader}>{s.strings.transaction_details_category_title}</FormattedText>
            <View style={styles.inputCategoryMainContainter}>
              <FormattedText style={styles.inputCategoryListHeader}>{s.strings.tx_detail_picker_title}</FormattedText>
              <View style={styles.InputCategoryRow}>
                {categories.map(item => {
                  const containterStyle = category === item.key ? styles.inputCategoryContainterSelected : styles.inputCategoryContainter
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
                returnKeyType="done"
                autoCapitalize="none"
                label={s.strings.transaction_details_choose_a_sub_category}
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
    const sortedCategories = [...selectedCategories, ...filteredCategories]
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
