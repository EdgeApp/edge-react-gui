import THEME from '../../theme/variables/airbitz'
const IconButtonStyle = {
  container: {
    width: 40,
    height: 40,
    justifyContent:'space-around',
    alignItems:'center',
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
    width:'100%',
    height: '100%',
    justifyContent:'space-around',
    alignItems:'center',
  },
  inner:{
    width:'80%',
    position:'relative',
    flexDirection: 'row',
    justifyContent:'space-around',
    alignItems:'center'
  },
  text: {
    flexDirection:'row',
    color: THEME.COLORS.WHITE,
    fontSize: 20,
    alignItems: 'center'
  },
  textPressed: {
    color: THEME.COLORS.GRAY_2,
    fontSize: 20
  },
  icon: {
    position:'absolute',
    top:20,
    color: THEME.COLORS.WHITE,
  },
  iconPressed: {
    position:'absolute',
    top:20,
    color: THEME.COLORS.GRAY_2
  },
  iconSize: 25,
  underlayColor: THEME.COLORS.CLEAR
}

export {IconButtonStyle}
export {TextAndIconButtonStyle}
