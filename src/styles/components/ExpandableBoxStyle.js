// @flow

// import * as Constants from '../../constants/indexConstants.js'
import * as Styles from '../../styles/indexStyles'
import THEME from '../../theme/variables/airbitz.js'
const ExpandableBoxStyle = {
  container: {
    flex: 1,
    width: '100%',
    flexDirection: 'column'
  },
  textIconButton: {
    ...Styles.TextAndIconButtonStyle,
    text: {
      ...Styles.TextAndIconButtonStyle.text,
      fontSize: 14,
      color: THEME.COLORS.SECONDARY
    },
    textPressed: {
      ...Styles.TextAndIconButtonStyle.text,
      fontSize: 14,
      color: THEME.COLORS.SECONDARY
    },
    icon: {
      ...Styles.TextAndIconButtonStyle.icon,
      color: THEME.COLORS.SECONDARY
    }
  },
  top: {
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: THEME.COLORS.GRAY_3,
    height: THEME.BUTTONS.HEIGHT
  },
  shim: { height: 5, backgroundColor: THEME.COLORS.TRANSPARENT },
  bottom: {
    width: '100%',
    flexDirection: 'column'
  },
  bottomInfo: {
    width: '100%',
    minHeight: 40,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    padding: 5,
    borderColor: THEME.COLORS.GRAY_3
  },
  bottomInner: {
    width: '100%',
    flexDirection: 'column',
    padding: 5
  }
}

export { ExpandableBoxStyle }
