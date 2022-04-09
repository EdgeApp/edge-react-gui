// @flow
import { hook } from 'cavy'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'

import s from '../../locales/strings.js'
import { FormattedText } from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { TouchableWithoutFeedback } from '../../types/reactNative.js'
import { splitTransactionCategory } from '../../util/utils.js'
import { AirshipModal } from '../common/AirshipModal.js'
import { FormField, MaterialInputOnWhite } from '../common/FormField.js'
import { SubCategorySelect } from '../common/TransactionSubCategorySelect.js'

type CategoriesType = Array<{
  key: string,
  syntax: string
}>

type Props = {
  bridge: AirshipBridge<{ category: string, subCategory: string } | void>,
  categories: Object,
  subCategories: string[],
  category: string,
  subCategory: string,
  setNewSubcategory: (string, string[]) => void,
  generateTestHook: (id: string, ref: any) => void
}

type State = {
  categories: CategoriesType,
  category: string,
  subCategory: string
}

export class TransactionDetailsCategoryInputComponenet extends React.Component<Props, State> {
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
  }

  onChangeSubCategory = (subCategory: string) => {
    this.setState({ subCategory })
  }

  onSelectSubCategory = (input: string) => {
    const { bridge, subCategories, setNewSubcategory } = this.props
    const splittedFullCategory = splitTransactionCategory(input)
    const { subCategory } = splittedFullCategory
    const category = splittedFullCategory.category.toLowerCase()
    if (!subCategories.find(item => item === input)) {
      setNewSubcategory(input, subCategories)
    }
    bridge.resolve({ category, subCategory })
  }

  render() {
    const { bridge } = this.props
    const { categories, category, subCategory } = this.state
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve()}>
        <TouchableWithoutFeedback onPress={() => bridge.resolve()} ref={this.props.generateTestHook('TransactionDetailsCategoryInput.Close')}>
          <View style={styles.airshipContainer}>
            <FormattedText style={styles.airshipHeader}>{s.strings.transaction_details_category_title}</FormattedText>
            <View style={styles.inputCategoryMainContainter}>
              <FormattedText style={styles.inputCategoryListHeader}>{s.strings.tx_detail_picker_title}</FormattedText>
              <View style={styles.inputCategoryRow}>
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
                {...MaterialInputOnWhite}
                containerStyle={{
                  ...MaterialInputOnWhite.containerStyle,
                  height: THEME.rem(3.44),
                  width: '100%'
                }}
                autoFocus
                returnKeyType="done"
                autoCapitalize="none"
                label={s.strings.transaction_details_choose_a_sub_category}
                fontSize={THEME.rem(0.9)}
                labelFontSize={THEME.rem(0.65)}
                onChangeText={this.onChangeSubCategory}
                onSubmitEditing={() => bridge.resolve({ category, subCategory })}
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

  getSortedCategories = (): string[] => {
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

const rawStyles = {
  airshipContainer: {
    flex: 1,
    padding: THEME.rem(0.8)
  },
  airshipHeader: {
    fontSize: THEME.rem(1.2),
    marginBottom: THEME.rem(1),
    alignSelf: 'center'
  },
  inputCategoryListHeader: {
    fontSize: THEME.rem(0.7),
    marginBottom: THEME.rem(0.3),
    color: THEME.COLORS.SECONDARY
  },
  inputCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  inputCategoryContainter: {
    paddingHorizontal: THEME.rem(0.5),
    paddingVertical: THEME.rem(0.2),
    marginRight: THEME.rem(0.6),
    borderWidth: 1,
    borderColor: THEME.COLORS.TRANSACTION_DETAILS_SECONDARY,
    borderRadius: 3
  },
  inputCategoryContainterSelected: {
    paddingHorizontal: THEME.rem(0.5),
    paddingVertical: THEME.rem(0.2),
    marginRight: THEME.rem(0.6),
    borderWidth: 1,
    borderRadius: 3,
    borderColor: THEME.COLORS.TRANSACTION_DETAILS_SECONDARY,
    backgroundColor: THEME.COLORS.TRANSACTION_DETAILS_SECONDARY
  },
  inputCategoryText: {
    color: THEME.COLORS.SECONDARY,
    fontSize: THEME.rem(0.9)
  },
  inputCategoryMainContainter: {
    marginBottom: THEME.rem(0.8)
  },
  inputSubCategoryContainter: {
    marginTop: THEME.rem(0.8)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
export const TransactionDetailsCategoryInput = hook(TransactionDetailsCategoryInputComponenet)
