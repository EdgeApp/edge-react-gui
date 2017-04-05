import { Platform } from 'react-native';
import _ from 'lodash';

import variable from './../variables/platform';

export default (variables = variable) => {
  const platformStyle = variables.platformStyle;
  const platform = variables.platform;
  const textFont = 12;
  const iconFont = 36;

  const footerTabTheme = {
      'NativeBase.Button': {
        '.active': {
          'NativeBase.Text': {
            color: variables.tabBarActiveTextColor,
            fontSize: textFont, //custom
            lineHeight: 16,
          },
          'NativeBase.Icon': {
            fontSize: iconFont, //custom
            color: variables.tabBarActiveTextColor,
          },
          'NativeBase.IconNB': {
            fontSize: iconFont, //custom
            color: variables.tabBarActiveTextColor,
          },
          backgroundColor: variables.tabActiveBgColor,
        },
        flexDirection: null,
        backgroundColor: 'transparent',
        borderColor: null,
        elevation: 0,
        shadowColor: null,
        shadowOffset: null,
        shadowRadius: null,
        shadowOpacity: null,
        alignSelf: 'center',
        flex: 1,
        height: variables.footerHeight,
        justifyContent: 'center',
        '.badge': {
          'NativeBase.Badge': {
            'NativeBase.Text': {
              fontSize: 11,
              fontWeight: (platform === 'ios') ? '600' : undefined,
              lineHeight: 14,
            },
            top: -3,
            alignSelf: 'center',
            left: 10,
            zIndex: 99,
            height: 18,
            padding: 1.7,
            paddingHorizontal: 3,
          },
          'NativeBase.Icon': {
            marginTop: -18,
          },
        },
        'NativeBase.Icon': {
          color: variables.tabBarTextColor,
          fontSize: iconFont, //custom
        },
        'NativeBase.IconNB': {
          color: variables.tabBarTextColor,
          fontSize: iconFont, //custom
        },
        'NativeBase.Text': {
          color: variables.tabBarTextColor,
          fontSize: textFont, //custom
          lineHeight: 16,
        },
        //Custom Style
        paddingHorizontal: 0,
      },
      backgroundColor: (Platform.OS === 'android') ? variables.tabActiveBgColor : undefined,
      flexDirection: 'row',
      justifyContent: 'space-between',
      flex: 1,
      alignSelf: 'stretch',
  };


  return footerTabTheme;
};
