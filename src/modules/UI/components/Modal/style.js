import React, {StyleSheet, Dimensions, Platform} from 'react-native';

const screenDimensions = {
  height: Dimensions.get('window').height,
  width: Dimensions.get('window').width
}


module.exports = StyleSheet.create({

  // modal styles
  topLevelModal: {

  },
  modalContainer: {
    flex: 1 ,
    alignItems: 'center',
    zIndex: 1,
    elevation: 1
  },
  modalOverlay: {
    flex: 1,
    padding: 10
  },
  modalBox: {
    top: (screenDimensions.height / 8),
    left: (screenDimensions.width / 8) - 20,
    width: screenDimensions.width * 3 / 4,
    borderRadius: 3,
    alignItems: 'stretch',
    position: 'absolute',
    //height: (screenDimensions.height) / 3,
    backgroundColor: 'white',
    padding: 15,
    paddingTop: 25,
    flexDirection: 'column',
    justifyContent: 'flex-start'
  },
  iconWrapper: {

  },
  modalHeaderIconWrapBottom: {
    position: 'absolute', 
    left: (screenDimensions.width / 2) - 47, 
    top: (screenDimensions.height / 8) - 28,
    borderRadius: 27,
    backgroundColor: 'white', 
    height: 54, 
    width: 54    
  },
  modalHeaderIconWrapTop: {
    position: 'relative', 
    top: 3, 
    left: 3, 
    borderRadius: 27, 
    backgroundColor: 'white', 
    zIndex: 100, 
    elevation: 100,
    height: 48, 
    width: 48
  },

  // beginning of rename wallet modal
  modalBody: {
    position: 'relative',
   
    justifyContent: 'space-between'
  },
  modalTopTextWrap: {
    padding: 10,
    paddingBottom: 4
  },
  modalTopText: {
    textAlign: 'center',
    color: '#2A5799',
    fontSize: 16
  },
  modalTopSubtext  : {
    fontSize: 14,
    color: '#58595C',
    textAlign: 'center',
    paddingTop: 4
  },
  modalMiddle: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: 10,
    paddingTop: 4

  },
  modalMiddleTextWrap: {

  },
  modalMiddleText: {

  },
  modalBottom: {
    height: 50,
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'flex-end'
  },


  //buttons
  buttonsWrap: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'flex-end'
  },
  stylizedButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderRadius: 3
  },
  stylizedButtonTextWrap: {

  },  
  stylizedButtonText: {
    color: 'white',
    fontSize: 16,    
  },
  cancelButtonWrap: {
    backgroundColor: '#909091',
    alignSelf: 'flex-start'
  },
  cancelButton: {
    color: '#3c76cd'
  },
  doneButtonWrap: {
    backgroundColor: '#4977BB',
    alignSelf: 'flex-end',
    marginLeft: 4    
  },
  doneButton: {
    color: '#3c76cd'
  }       
})
