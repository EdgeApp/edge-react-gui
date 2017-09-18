const Permissions = require('react-native-permissions')

export async function checkCameraPermission (callback) {
  try {
    Permissions.check('camera')
      .then((response) => {
        let granted = false
        if (response === 'authorized') {
          granted = true
        }
        // response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
        callback(null, granted)
      })
  } catch (err) {
    // console.error(err)
    callback(err, null)
  }
}

export async function requestCameraPermission (callback) {
  try {
    Permissions.request('camera')
      .then((response) => {
        let granted = false
        if (response === 'authorized') {
          granted = true
        }
        // response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
        callback(null, granted)
      })
  } catch (err) {
    // console.error(err)
    callback(err, null)
  }
}

export async function checkReadContactPermission (callback) {
  try {
    Permissions.check('contacts')
      .then((response) => {
        let granted = false
        if (response === 'authorized') {
          granted = true
        }
        // response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
        callback(null, granted)
      })
  } catch (err) {
    // console.error(err)
    callback(err, null)
  }
}

export async function requestReadContactPermission (callback) {
  try {
    Permissions.request('contacts')
      .then((response) => {
        let granted = false
        if (response === 'authorized') {
          granted = true
        }
        // response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
        callback(null, granted)
      })
  } catch (err) {
    // console.error(err)
    callback(err, null)
  }
}
