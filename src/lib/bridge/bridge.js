// @flow
/* global window */
import { Bridge, bridgifyObject } from 'yaob'

window.originalPostMessage = window.postMessage
window.postMessage = function (data) {
  window.ReactNativeWebView.postMessage(data)
}

setTimeout(function () {
  window.bridge = new Bridge({
    sendMessage: message => window.ReactNativeWebView.postMessage(JSON.stringify(message))
  })

  window.bridge.getRoot().then(api => {
    let counter = 0
    const oldHistory = window.history
    const newHistory = {
      get length () {
        return oldHistory.length
      },
      back () {
        --counter
        if (counter < 0) {
          counter = 0
        }
        oldHistory.back()
      },

      pushState (data, message, url) {
        ++counter
        oldHistory.pushState(data, message, url)
      },

      replaceState (data, message, url) {
        oldHistory.replaceState(data, message, url)
      },

      forward () {
        oldHistory.forward()
      },

      go (arg) {
        oldHistory.go(arg)
      }
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
