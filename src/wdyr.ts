import whyDidYouRender from '@welldone-software/why-did-you-render'
import React from 'react'

whyDidYouRender(React, {
  onlyLogs: true,
  titleColor: 'green',
  diffNameColor: 'aqua',
  logOnDifferentValues: false,
  trackAllPureComponents: true
})
