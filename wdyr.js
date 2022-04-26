import React from 'react'

console.log('3. process.env.NODE_ENV', process.env.NODE_ENV)
if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render')
  const ReactRedux = require('react-redux')
  whyDidYouRender(React, {
    trackHooks: true,
    trackAllPureComponents: true,
    trackExtraHooks: [[ReactRedux, 'useSelector', 'useDispatch']]
  })
}
