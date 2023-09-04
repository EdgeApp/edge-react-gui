import { FlashList, ListRenderItem } from '@shopify/flash-list'
import * as React from 'react'
import { TouchableHighlight, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { Category, displayCategories, formatCategory, getSubcategories, joinCategory, setNewSubcategory, splitCategory } from '../../actions/CategoriesActions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { scale } from '../../util/scaling'
import { MinimalButton } from '../buttons/MinimalButton'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { DividerLine } from '../themed/DividerLine'
import { EdgeText } from '../themed/EdgeText'
import { ModalFooter, ModalFooterFade, ModalTitle } from '../themed/ModalParts'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'
import { ThemedModal } from '../themed/ThemedModal'

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
  const theme = useTheme()
  const styles = getStyle(theme)

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

  const handleCategoryUpdate = async (fullCategory: string) => {
    if (!categories.includes(fullCategory)) {
      await dispatch(setNewSubcategory(fullCategory))
    }
    bridge.resolve(fullCategory)
  }

  const handleSubmit = useHandler(async () => {
    const fullCategory = joinCategory({ category, subcategory })
    await handleCategoryUpdate(fullCategory)
  })

  const keyExtractor = useHandler((row: CategoryRow) => row.raw)

  const renderRow: ListRenderItem<CategoryRow> = useHandler(({ item }) => (
    <TouchableHighlight delayPressIn={60} style={styles.rowContainer} onPress={async () => await handleCategoryUpdate(item.raw)}>
      <>
        <View style={styles.rowContent}>
          <View style={styles.rowCategoryTextWrap}>
            <EdgeText style={styles.rowCategoryText}>{item.display}</EdgeText>
          </View>
          {item.new ? (
            <View style={styles.rowPlusWrap}>
              <EdgeText style={styles.rowPlus}>+</EdgeText>
            </View>
          ) : null}
        </View>
        <DividerLine marginRem={[0, 0]} />
      </>
    </TouchableHighlight>
  ))

  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      <ModalTitle center>{lstrings.category_modal_title}</ModalTitle>
      <View style={styles.inputCategoryRow}>
        {categoryOrder.map(item => (
          <MinimalButton key={item} highlighted={category === item} label={displayCategories[item]} onPress={() => setCategory(item)} />
        ))}
      </View>
      <OutlinedTextInput
        autoFocus
        returnKeyType="done"
        autoCapitalize="words"
        label={lstrings.sub_category_label}
        onChangeText={setSubcategory}
        onSubmitEditing={handleSubmit}
        value={subcategory}
      />
      <View style={styles.categoryListContainer}>
        <FlashList
          contentContainerStyle={styles.scrollPadding}
          data={sortedCategories}
          estimatedItemSize={theme.rem(3)}
          keyboardShouldPersistTaps="handled"
          keyExtractor={keyExtractor}
          renderItem={renderRow}
        />
        <ModalFooterFade />
      </View>
    </ThemedModal>
  )
}

// This is the order we display the categories in:
const categoryOrder: Category[] = ['income', 'expense', 'transfer', 'exchange']

const getStyle = cacheStyles((theme: Theme) => ({
  inputCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: theme.rem(1),
    marginBottom: theme.rem(1)
  },
  categoryListContainer: {
    flex: 1
  },
  rowContainer: {
    flex: 1,
    height: theme.rem(3.1),
    paddingLeft: theme.rem(0.6)
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    paddingRight: scale(20),
    justifyContent: 'space-between'
  },
  rowCategoryTextWrap: {
    flex: 1,
    justifyContent: 'center',
    marginRight: scale(5)
  },
  rowCategoryText: {
    fontSize: theme.rem(0.95)
  },
  rowPlusWrap: {
    justifyContent: 'center'
  },
  rowPlus: {
    fontSize: theme.rem(0.95)
  },
  scrollPadding: {
    paddingBottom: theme.rem(ModalFooter.bottomRem)
  }
}))
