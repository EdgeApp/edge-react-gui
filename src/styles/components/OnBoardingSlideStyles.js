// @flow

import { Dimensions } from 'react-native'

import THEME from '../../theme/variables/airbitz'

const OnBoardingSlideStyles = {
  container: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height
  },
  innerTop: {
    flex: 7
  },
  innerBottom: {
    flex: 6,
    alignItems: 'center',
    justifyContent: 'flex-start'
  },

  textBox: {
    width: '90%',
    height: '80%',
    padding: 5
  },
  textBoxSlide2: {
    width: '90%',
    height: '80%',
    padding: 5,
    marginTop: 20
  },
  text: {
    color: THEME.COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center'
  }
}
const OnBoardingSlideTabletStyles = {
  container: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height
  },
  innerTop: {
    flex: 7
  },
  innerBottom: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'flex-start'
  },

  textBox: {
    width: '90%',
    height: '80%',
    padding: 5
  },
  text: {
    color: THEME.COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center'
  }
}
export { OnBoardingSlideTabletStyles }
export { OnBoardingSlideStyles }
