import { Bridge } from 'yaob'
setTimeout(function () {
  window.bridge = new Bridge({
    sendMessage: message => window.postMessage(JSON.stringify(message)),
  })
  window.bridge.getRoot()
    .then(api => {
      window.edgeProvider = api
    })
}, 1)
