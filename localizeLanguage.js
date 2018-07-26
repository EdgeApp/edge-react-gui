// @flow

const fs = require('fs')
const masterStrings = require('./src/locales/en_US.js')
const outputEnglish = require('./src/locales/strings/enUS.json')

function isEquivalent (a, b) {
  // Create arrays of property names
  const aProps = Object.getOwnPropertyNames(a)
  const bProps = Object.getOwnPropertyNames(b)
  // If number of properties is different,
  // objects are not equivalent
  if (aProps.length !== bProps.length) {
    console.log('We are false ')
    return false
  }

  for (let i = 0; i < aProps.length; i++) {
    const propName = aProps[i]
    // If values of same property are not equal,
    // objects are not equivalent
    if (a[propName] !== b[propName]) {
      return false
    }
  }
  // If we made it this far, objects
  // are considered equivalent
  return true
}
if (!isEquivalent(masterStrings, outputEnglish)) {
  console.log('write the file')
  fs.writeFileSync('./src/locales/strings/enUS.json', JSON.stringify(masterStrings, null, 2))
}
