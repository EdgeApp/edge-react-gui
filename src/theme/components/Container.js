import { Platform } from 'react-native';
import _ from 'lodash';

import {PLATFORM} from './../variables/platform';

const deviceHeight = PLATFORM.deviceHeight
export default (PLATFORM = PLATFORM) => {
  const theme = {
    flex: 1,
    backgroundColor: '#FFF', //custom
    height: (Platform.OS === 'ios') ? deviceHeight : deviceHeight - 20
  };

  return theme;
};
