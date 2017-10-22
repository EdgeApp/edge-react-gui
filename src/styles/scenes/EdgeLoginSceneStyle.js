import THEME from '../../theme/variables/airbitz'
// import platform from '../../theme/variables/platform'
import * as Styles from '../indexStyles'

const EdgeLoginScreen = {
  container: {...Styles.SceneContainer,
    height:'100%'
  },
  header: {
    flex: 2,
    flexDirection: 'column',
  },
  headerTopShim: {
    flex: 2
  },
  headerImageContainer: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'space-around'

  },
  headerTextRow: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  headerText: {
    color: THEME.COLORS.PRIMARY,
    fontSize: 36,
  },
  headerBottomShim: {
    flex: 1
  },

  body: {
    flex: 4
  },
  buttons: {
    flex: 1,
    marginRight: '5%',
    marginLeft: '5%',
    flexDirection: 'row',
    alignSelf: 'flex-end'
  },
  buttonsProcessing: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerContainer: {
    flex: 1,
  },
  bodyText: {
    marginRight: '5%',
    marginLeft: '5%',
    color: THEME.COLORS.GRAY_1,
    fontSize: 18,
    textAlign: 'center',
    fontFamily: THEME.FONTS.DEFAULT
  },
  cancel: {
    flex: 1,
    marginRight: '1.5%',
    backgroundColor: THEME.COLORS.GRAY_2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  },
  cancelSolo: {
    flex: 1,
    backgroundColor: THEME.COLORS.GRAY_2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  },
  submit: {
    flex: 1,
    marginLeft: '1.5%',
    backgroundColor: THEME.COLORS.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  }
}

export {EdgeLoginScreen}
