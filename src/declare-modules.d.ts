/* eslint-disable import/no-default-export */

declare const imageRequire: number

// Make image imports work:
declare module '*.gif' {
  export default imageRequire
}
declare module '*.png' {
  export default imageRequire
}
declare module '*.jpeg' {
  export default imageRequire
}
declare module '*.jpg' {
  export default imageRequire
}
declare module '*.svg' {
  export default imageRequire
}

// These modules lack type definitions:
declare module 'react-native-smart-splash-screen'
declare module 'react-native-sortable-listview'
