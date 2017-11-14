import THEME from '../../theme/variables/airbitz'

const MaterialInput = {
  container: {
    position: 'relative',
    width: 230,
    minHeight: 60
  },
  baseColor: THEME.COLORS.WHITE,
  tintColor: THEME.COLORS.ACCENT_MINT,
  errorColor: THEME.COLORS.ACCENT_RED,
  textColor: THEME.COLORS.WHITE,
  affixTextStyle: {
    color: THEME.COLORS.WHITE
  },
  titleTextStyle: {
    color: THEME.COLORS.WHITE
  }
}

const MaterialInputOnWhite = {
  container: {
    position: 'relative',
    width: 230,
    height: 60
  },
  baseColor: THEME.COLORS.PRIMARY,
  tintColor: THEME.COLORS.SECONDARY,
  errorColor: THEME.COLORS.ACCENT_RED,
  textColor: THEME.COLORS.BLACK,
  affixTextStyle: {
    color: THEME.COLORS.ACCENT_RED
  },
  titleTextStyle: {
    color: THEME.COLORS.PRIMARY
  }
}
export { MaterialInputOnWhite }
export { MaterialInput }
