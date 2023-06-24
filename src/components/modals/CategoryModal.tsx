import { FlashList, ListRenderItem } from '@shopify/flash-list'
import * as React from 'react'
import { StyleSheet, TouchableHighlight, TouchableWithoutFeedback, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { getSubcategories, setNewSubcategory } from '../../actions/TransactionDetailsActions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { THEME } from '../../theme/variables/airbitz'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { Category, displayCategories, formatCategory, joinCategory, splitCategory } from '../../util/categories'
import { scale } from '../../util/scaling'
import { AirshipModal } from '../legacy/AirshipModal'
import { FormattedText } from '../legacy/FormattedText/FormattedText.ui'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'

interface Props {
  bridge: AirshipBridge<string | undefined>
  initialCategory: string
}

interface CategoryRow {
  display: string // As localized for display, like 'Ingreso: Regalo'
  raw: string // As saved on disk, like 'Income:Regalo'
  new: boolean // To show the + icon
  selected: boolean // True if the main category is selected
}

/**
 * Allows the user to select a transaction category.
 * Returns a joined category string, such as "Expense:Food"
 */
export function CategoryModal(props: Props) {
  const { bridge, initialCategory } = props
  const dispatch = useDispatch()

  // We split the state into category and subcategory internally:
  const split = splitCategory(initialCategory)
  const [category, setCategory] = React.useState(split.category)
  const [subcategory, setSubcategory] = React.useState(split.subcategory)

  const categories = useSelector(state => state.ui.subcategories)

  // Load the categories from disk:
  useAsyncEffect(async () => {
    await dispatch(getSubcategories())
  }, [dispatch])

  const sortedCategories = React.useMemo(() => {
    // Transform the raw categories into row objects:
    const rows = categories.map(raw => {
      const split = splitCategory(raw)
      return {
        display: formatCategory(split),
        raw,
        new: false,
        selected: split.category === category
      }
    })

    // If the user has entered text, append the text to each main category:
    if (subcategory !== '') {
      for (const mainCategory of categoryOrder) {
        const split = { category: mainCategory, subcategory }
        const raw = joinCategory(split)
        if (categories.includes(raw)) continue
        rows.push({
          display: formatCategory(split),
          raw,
          new: true,
          selected: split.category === category
        })
      }
    }

    // Filter and sort this new list:
    // The `toLocaleLowerCase` method fails for blank strings on Android:
    const target = subcategory === '' ? '' : subcategory.toLocaleLowerCase()
    return rows
      .filter(row => row.display.toLocaleLowerCase().includes(target))
      .sort((a, b) => {
        if (a.new && !b.new) return 1
        if (!a.new && b.new) return -1
        if (a.selected && !b.selected) return -1
        if (!a.selected && b.selected) return 1
        return a.display.localeCompare(b.display)
      })
  }, [categories, category, subcategory])

  const handleCancel = useHandler(() => {
    bridge.resolve(undefined)
  })

  const handleSubmit = useHandler(async () => {
    const result = joinCategory({ category, subcategory })
    if (!categories.includes(result)) {
      await dispatch(setNewSubcategory(result))
    }
    bridge.resolve(result)
  })

  const keyExtractor = useHandler((row: CategoryRow) => row.raw)

  const renderRow: ListRenderItem<CategoryRow> = useHandler(({ item }) => (
    <TouchableHighlight delayPressIn={60} style={styles.rowContainer} underlayColor={THEME.COLORS.GRAY_4} onPress={() => bridge.resolve(item.raw)}>
      <View style={styles.rowContent}>
        <View style={styles.rowCategoryTextWrap}>
          <FormattedText style={styles.rowCategoryText}>{item.display}</FormattedText>
        </View>
        {item.new ? (
          <View style={styles.rowPlusWrap}>
            <FormattedText style={styles.rowPlus}>+</FormattedText>
          </View>
        ) : null}
      </View>
    </TouchableHighlight>
  ))

  return (
    <AirshipModal bridge={bridge} onCancel={handleCancel}>
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={styles.airshipContainer}>
          <FormattedText style={styles.airshipHeader}>{lstrings.transaction_details_category_title}</FormattedText>
          <View style={styles.inputCategoryMainContainter}>
            <FormattedText style={styles.inputCategoryListHeader}>{lstrings.tx_detail_picker_title}</FormattedText>
            <View style={styles.inputCategoryRow}>
              {categoryOrder.map(item => (
                <TouchableWithoutFeedback onPress={() => setCategory(item)} key={item}>
                  <View style={category === item ? styles.inputCategoryContainterSelected : styles.inputCategoryContainter}>
                    <FormattedText style={styles.inputCategoryText}>{displayCategories[item]}</FormattedText>
                  </View>
                </TouchableWithoutFeedback>
              ))}
            </View>
          </View>
          <View style={styles.inputSubCategoryContainter}>
            <OutlinedTextInput
              autoFocus
              returnKeyType="done"
              autoCapitalize="none"
              label={lstrings.transaction_details_choose_a_sub_category}
              onChangeText={setSubcategory}
              onSubmitEditing={handleSubmit}
              value={subcategory}
            />
          </View>
          <FlashList
            data={sortedCategories}
            estimatedItemSize={THEME.rem(3)}
            keyboardShouldPersistTaps="handled"
            keyExtractor={keyExtractor}
            renderItem={renderRow}
          />
        </View>
      </TouchableWithoutFeedback>
    </AirshipModal>
  )
}

// This is the order we display the categories in:
const categoryOrder: Category[] = ['income', 'expense', 'transfer', 'exchange']

const styles = StyleSheet.create({
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
    marginTop: THEME.rem(0.8),
    borderBottomColor: THEME.COLORS.GRAY_3,
    borderBottomWidth: 1
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
    color: THEME.COLORS.SECONDARY,
    fontSize: THEME.rem(0.95)
  },
  rowPlusWrap: {
    justifyContent: 'center'
  },
  rowPlus: {
    color: THEME.COLORS.SECONDARY,
    fontSize: THEME.rem(0.95)
  }
})
