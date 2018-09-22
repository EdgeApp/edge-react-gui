// @flow

import Sound from 'react-native-sound'

import type { Action } from '../modules/ReduxTypes.js'

const AUDIO_RECEUVED_FILE = 'audio_received.mp3'
const AUDIO_SEND_FILE = 'audio_sent.mp3'

Sound.setCategory('Ambient')

const audioReceived = new Sound(AUDIO_RECEUVED_FILE, Sound.MAIN_BUNDLE, error => {
  if (error) console.warn(`failed to load the sound ${AUDIO_RECEUVED_FILE}`, error)
})

const audioSent = new Sound(AUDIO_SEND_FILE, Sound.MAIN_BUNDLE, error => {
  if (error) console.error(`failed to load the sound ${AUDIO_SEND_FILE}`, error)
})

const playCb = audioName => success => {
  if (success) {
    console.info(`successfully finished playing ${audioName}`)
  } else {
    console.warn(`playback ${audioName} failed due to audio decoding errors `)
  }
}

export default () => (next: Function) => (action: Action) => {
  if (action.type === 'UI/COMPONENTS/TRANSACTION_ALERT/DISPLAY_TRANSACTION_ALERT') {
    audioReceived.play(playCb(AUDIO_RECEUVED_FILE))
  }
  if (action.type === 'OPEN_AB_ALERT' && action.data && action.data.success) {
    audioSent.play(playCb(AUDIO_SEND_FILE))
  }
  next(action)
}
