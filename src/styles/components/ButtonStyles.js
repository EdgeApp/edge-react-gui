/* eslint-disable flowtype/require-valid-file-annotation */

import THEME from '../../theme/variables/airbitz'
const IconButtonStyle = {
  container: {
    width: 40,
    height: 40,
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  icon: {
    color: THEME.COLORS.WHITE
  },
  iconPressed: {
    color: THEME.COLORS.GRAY_2
  },
  iconSize: 36,
  underlayColor: THEME.COLORS.CLEAR
}

const TextAndIconButtonStyle = {
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  centeredContent: {
    width: '100%',
    alignItems: 'center'
  },
  inner: {
    position: 'relative',
    flexDirection: 'row'
  },
  textContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  iconContainer: {
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center'
  },
  text: {
    color: THEME.COLORS.WHITE,
    fontSize: 20
  },
  textPressed: {
    color: THEME.COLORS.GRAY_2,
    fontSize: 20
  },
  icon: {
    color: THEME.COLORS.WHITE
  },
  iconPressed: {
    color: THEME.COLORS.GRAY_2
  },
  iconSize: 25,
  underlayColor: THEME.COLORS.TRANSPARENT
}

export { IconButtonStyle }
export { TextAndIconButtonStyle }
