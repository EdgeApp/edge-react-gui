import React, { Component } from 'react'
import { View, Text, Platform} from 'react-native'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import styles from './style'
import Modal from 'react-native-modal'
import LinearGradient from 'react-native-linear-gradient'
import FormattedText from '../FormattedText'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import MAIcon from 'react-native-vector-icons/MaterialIcons'
import Ionicon from 'react-native-vector-icons/Ionicons'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'
import EvilIcons from 'react-native-vector-icons/EvilIcons'

class StylizedModal extends Component {
    constructor(props) {
        super(props)
    }

    render = () => {
        return(
            <Modal isVisible={this.props.visibilityBoolean}>
                <View style={[styles.modalContainer]}>
                    <View style={[styles.modalOverlay]}>
                        <View style={[styles.modalBox]}>
                            <View style={[styles.iconWrapper]}>
                                {Platform.OS === 'ios' && 
                                    <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={[styles.modalHeaderIconWrapBottom]} colors={['#3B7ADA', '#2B5698']}>
                                        <View style={styles.modalHeaderIconWrapTop}>
                                            {this.props.featuredIcon}  
                                        </View>
                                    </LinearGradient>
                                }
                            </View>
                            <View style={[styles.modalBody, this.border('purple')]}>
                                <View style={[styles.modalTopTextWrap]}>
                                    <FormattedText style={styles.modalTopText}>{this.props.headerText}</FormattedText>
                                    <FormattedText numberOfLines={2} style={styles.modalTopSubtext}>{this.props.headerSubtext}</FormattedText>
                                </View>
                                <View style={[styles.modalMiddle, this.border('brown')]}>
                                    {this.props.modalMiddle}
                                </View>
                                <View style={[styles.modalBottom, this.border('green')]}>
                                    {this.props.modalBottom}
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal> 
        )       
    }

  border (color) {
    return {
      borderColor: color,
      borderWidth: 0
    }
  }    
}

StylizedModal.propTypes = {
  visibilityBoolean: PropTypes.bool
}

export default connect(state => ({

}))(StylizedModal)