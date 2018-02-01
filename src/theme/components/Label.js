import { Platform } from 'react-native';
import _ from 'lodash';

import { PLATFORM as variable } from './../variables/platform';

export default (variables = variable) => {
  const labelTheme = {
      '.focused': {
        width: 0,
      },
      fontSize: 17,
  };


  return labelTheme;
};
