// @flow

import THEME from '../../theme/variables/airbitz'

const OnBoardingSlideStyles = {
  container: {
    flex: 1
  },
  innerTop: {
    flex: 4
  },
  innerBottom: {
    flex: 3,
    alignItems: 'center'
  },
  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 10
  },
  button: {
    width: '30%'
  },
  textBox: {
    width: '86%',
    height: '80%',
    padding: 10,
    marginBottom: 15
  },
  text: {
    color: THEME.COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold'
  }
}

export { OnBoardingSlideStyles }
