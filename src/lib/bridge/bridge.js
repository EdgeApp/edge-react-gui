// @flow
/* global window */
import { Bridge, bridgifyObject } from 'yaob'
setTimeout(function () {
  window.bridge = new Bridge({
    sendMessage: message => window.postMessage(JSON.stringify(message))
  })
  window.bridge.getRoot().then(api => {
    let counter = 0
    const oldHistory = window.history
    const newHistory = {
      get length () {
        return oldHistory.length
      },
      back () {
        console.log('new history back clicked')
        --counter
        if (counter < 0) {
          counter = 0
        }
        oldHistory.back()
      },

      pushState (data, message, url) {
        console.log('someone was doing a push state $$$$$ ++ ', counter)
        ++counter
        console.log('someone was doing a push state ++ ', counter)
        oldHistory.pushState(data, message, url)
      }
      // ... and shim all the others too
    }

    const myBackHandler = {
      handleBack () {
        return counter
      }
    }
    bridgifyObject(myBackHandler)
    api.setBackHandler(myBackHandler)
    window.edgeProvider = api
    Object.defineProperty(window, 'history', {
      enumerable: true,
      configurable: true,
      value: newHistory
    })
  })
}, 1)
