// @flow

import Sound from 'react-native-sound'

let receiveSoundPromise, sendSoundPromise
Sound.setCategory('Ambient')

export function playReceiveSound (): Promise<void> {
  if (!receiveSoundPromise) receiveSoundPromise = loadSound('audio_received.mp3')
  return receiveSoundPromise.then(playSound)
}

export function playSendSound (): Promise<void> {
  if (!sendSoundPromise) sendSoundPromise = loadSound('audio_sent.mp3')
  return sendSoundPromise.then(playSound)
}

/**
 * Turn the node-style Sound constructor into a promise.
 */
function loadSound (name): Promise<Sound> {
  return new Promise((resolve, reject) => {
    const sound = new Sound(name, Sound.MAIN_BUNDLE, error => (error ? reject(error) : resolve(sound)))
  })
}

/**
 * Turn the node-style Sound.play method into a promise.
 */
function playSound (sound: Sound): Promise<void> {
  return new Promise((resolve, reject) => {
    sound.play(success => (success ? resolve() : new Error('Could not play sound')))
  })
}
