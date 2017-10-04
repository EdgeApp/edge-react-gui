import React, {Component} from 'react'
import {
    View,
    Picker,
    TextInput,
    TouchableOpacity,
    Keyboard,
    TouchableWithoutFeedback
} from 'react-native'
import strings from '../../../../locales/default'
import FormattedText from '../../components/FormattedText'
import Modal from 'react-native-modal'
import {PrimaryButton} from '../../components/Buttons'
import styles from './style'
import {colors} from '../../../../theme/variables/airbitz'
import platform from '../../../../theme/variables/platform.js'
import * as UTILS from '../../../utils'


const categories = ['income', 'expense', 'exchange', 'transfer']

class AmountArea extends Component<Prop, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      color: ''
    }
  }

  render () {
    // console.log('rendering amountArea, this.props is: ', this.props, ' , and this.state is: ', this.state)
    const stepOne = UTILS.convertNativeToDisplay(this.props.walletDefaultDenomProps.multiplier)(this.props.guiTransaction.abcTransaction.nativeAmount.replace('-', ''))

    const amountString = Math.abs(parseFloat(UTILS.truncateDecimals(stepOne, 6)))
    return (
      <View style={[styles.amountAreaContainer]}>
        <View style={[styles.amountAreaCryptoRow]}>
          <View style={[styles.amountAreaLeft]}>
            <FormattedText style={[styles.amountAreaLeftText, {color: this.props.leftData.color}]}>{strings.enUS['fragment_transaction_' + this.props.direction + '_past']}</FormattedText>
          </View>
          <View style={[styles.amountAreaMiddle]}>
            <View style={[styles.amountAreaMiddleTop]}>
              <FormattedText style={[styles.amountAreaMiddleTopText]}>{(this.props.walletDefaultDenomProps.symbol + ' ') || ''}{amountString}</FormattedText>
            </View>
            <View style={[styles.amountAreaMiddleBottom]}>
              <FormattedText style={[styles.amountAreaMiddleBottomText]}>{this.props.feeSyntax}</FormattedText>
            </View>
          </View>
          <View style={[styles.amountAreaRight]}>
            <FormattedText style={[styles.amountAreaRightText]}>{this.props.cryptoCurrencyCode}</FormattedText>
          </View>
        </View>
        <View style={[styles.editableFiatRow]}>
          <View style={[styles.editableFiatLeft]}>
            <FormattedText style={[styles.editableFiatLeftText]} />
          </View>
          <View style={[styles.editableFiatArea]}>
            <FormattedText style={styles.fiatSymbol}>{this.props.fiatCurrencySymbol}</FormattedText>
            <TextInput
              returnKeyType='done'
              autoCapitalize='none'
              autoCorrect={false}
              onFocus={this.props.onFocusFiatAmount}
              onChangeText={this.props.onChangeFiatFxn}
              style={[styles.editableFiat]}
              keyboardType='numeric'
              placeholder={''}
              value={UTILS.truncateDecimals(this.props.fiatAmount.toString().replace('-',''), 2, true)}
              defaultValue={''}
              onBlur={this.props.onBlurFiatFxn}
              blurOnSubmit={true}
            />
          </View>
          <View style={[styles.editableFiatRight]}>
            <FormattedText style={[styles.editableFiatRightText]}>{this.props.fiatCurrencyCode}</FormattedText>
          </View>
        </View>
        <View style={[styles.categoryRow]}>
          <TouchableOpacity style={[styles.categoryLeft, {borderColor: this.props.color}]} onPress={this.props.onEnterCategories} disabled={this.props.subCategorySelectVisibility}>
            <FormattedText style={[{color: this.props.color}, styles.categoryLeftText]}>{this.props.type.syntax}</FormattedText>
          </TouchableOpacity>
          <View style={[styles.categoryInputArea]}>
            <TextInput
              blurOnSubmit
              autoCapitalize='words'
              placeholderTextColor={colors.gray2}
              onFocus={this.props.onEnterSubcategories}
              onChangeText={this.props.onChangeSubcategoryFxn}
              onSubmitEditing={this.props.onSubcategoryKeyboardReturn}
              style={[styles.categoryInput]}
              defaultValue={this.props.subCategory || ''}
              placeholder={strings.enUS['transaction_details_category_title']}
              autoCorrect={false}
            />
          </View>
        </View>
        <Modal isVisible={this.props.categorySelectVisibility} animationIn='slideInUp' animationOut='slideOutDown' backdropColor='black' backdropOpacity={0.6}>
          <Picker style={[ UTILS.border(),
            {
              backgroundColor: 'white',
              width: platform.deviceWidth,
              height: platform.deviceHeight / 3,
              position: 'absolute',
              top: (2/3) * platform.deviceHeight,
              left: -20
            }
          ]}
            itemStyle={{fontFamily: 'SourceSansPro-Black', color: colors.gray1, fontSize: 30, paddingBottom: 14}}
            selectedValue={this.props.type.key}
            onValueChange={(itemValue) => this.props.selectCategory({itemValue})}>
            {categories.map((x) => (
              <Picker.Item label={this.props.types[x].syntax} value={x} key={this.props.types[x].key} />
            ))}
          </Picker>
        </Modal>
        <View style={[styles.notesRow]}>
          <View style={[styles.notesInputWrap]} >
            <TextInput
              onChangeText={this.props.onChangeNotesFxn}
              multiline
              numberOfLines={3}
              defaultValue={this.props.guiTransaction.abcTransaction.metadata.notes || ''}
              style={[styles.notesInput]}
              placeholderTextColor={colors.gray2}
              placeholder={strings.enUS['transaction_details_notes_title']}
              autoCapitalize='sentences'
              autoCorrect={false}
              onFocus={this.props.onFocusNotes}
              onBlur={this.props.onBlurNotes}
              // onSubmitEditing={this.props.onBlurNotes}
              blurOnSubmit={false}
              onScroll={() => Keyboard.dismiss()}
            />
          </View>
        </View>
        <View style={[styles.footerArea]}>
          <View style={[styles.buttonArea]}>
            <PrimaryButton text={strings.enUS['string_save']} style={[styles.saveButton]} onPressFunction={this.props.onPressFxn} />
          </View>
          <TouchableWithoutFeedback onPress={() => this.props.openModalFxn()} style={[styles.advancedTxArea]}>
            <FormattedText style={[styles.advancedTxText]}>{strings.enUS['transaction_details_view_advanced_data']}</FormattedText>
          </TouchableWithoutFeedback>
        </View>
      </View>
    )
  }
}
export default AmountArea
