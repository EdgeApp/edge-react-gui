// @flow
import { Bridge } from 'yaob'

window.bridge = new Bridge({
  sendMessage: message => window.postMessage(JSON.stringify(message)),
  getColor: () => {
    return '#FFCC00'
  }
})

window.bridge.getRoot().then(api => (window.edgeApi = api))
