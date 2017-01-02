
const Permissions = require('react-native-permissions')

export async function checkCameraPermission (callback) {
  try {
    Permissions.getPermissionStatus('camera')
      .then(response => {
        let granted = false
        if (response === 'authorized') {
          granted = true
        }
        // response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
        callback(null, granted)
      })
  } catch (err) {
    console.error(err)
    callback(err, null)
  }
}

export async function requestCameraPermission (callback) {
  try {
    Permissions.requestPermission('camera')
      .then(response => {
        let granted = false
        if (response === 'authorized') {
          granted = true
        }
        // response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
        callback(null, granted)
      })
  } catch (err) {
    console.error(err)
    callback(err, null)
  }
}

export async function checkReadContactPermission (callback) {
  try {
    Permissions.getPermissionStatus('contacts')
      .then(response => {
        let granted = false
        if (response === 'authorized') {
          granted = true
        }
        // response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
        callback(null, granted)
      })
  } catch (err) {
    console.error(err)
    callback(err, null)
  }
}

export async function requestReadContactPermission (callback) {
  try {
    Permissions.requestPermission('contacts')
      .then(response => {
        let granted = false
        if (response === 'authorized') {
          granted = true
        }
        // response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
        callback(null, granted)
      })
  } catch (err) {
    console.error(err)
    callback(err, null)
  }
}
