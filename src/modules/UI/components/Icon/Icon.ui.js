import React from 'react'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import IonIcon from 'react-native-vector-icons/Ionicons'
import SimpleIcon from 'react-native-vector-icons/SimpleLineIcons'
import Entypo from 'react-native-vector-icons/Entypo'
import * as Constants from '../../../../constants/indexConstants'


export const Icon = ({style, name, size, type}) => {
  switch (type) {
  case Constants.ENTYPO:
    return <Entypo
      style={style}
      name={name}
      size={size}/>
  case Constants.MATERIAL_ICONS:
    return <MaterialIcon
      style={style}
      name={name}
      size={size}/>
  case Constants.FONT_AWESOME:
    return <FAIcon
      style={style}
      name={name}
      size={size}/>
  case Constants.ION_ICONS:
    return <IonIcon
      style={style}
      name={name}
      size={size}/>
  case Constants.SIMPLE_ICONS:
    return <SimpleIcon
      style={style}
      name={name}
      size={size}/>
  }
}
