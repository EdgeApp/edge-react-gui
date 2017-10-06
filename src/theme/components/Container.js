import { Platform } from 'react-native';
import _ from 'lodash';

import variable from './../variables/platform';

const deviceHeight = variable.deviceHeight
export default (variables = variable) => {
  const theme = {
    flex: 1,
    backgroundColor: '#FFF', //custom
    height: (Platform.OS === 'ios') ? deviceHeight : deviceHeight - 20
  };

  return theme;
};
