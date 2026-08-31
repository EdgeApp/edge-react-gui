import { Audio, InterruptionModeIOS } from 'expo-av'

import receivedSound from '../assets/sounds/audio_received.mp3'
import sentSound from '../assets/sounds/audio_sent.mp3'

/**
 * Transaction send/receive sounds via expo-av.
 * react-native-sound stays linked.
 */

let audioModePromise: Promise<void> | undefined
let receiveSoundPromise: Promise<Audio.Sound> | undefined
let sendSoundPromise: Promise<Audio.Sound> | undefined

const ensureAudioMode = async (): Promise<void> => {
  audioModePromise ??= Audio.setAudioModeAsync({
    playsInSilentModeIOS: false,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    shouldDuckAndroid: false,
    staysActiveInBackground: false
  })
  await audioModePromise
}

const loadSound = async (source: number): Promise<Audio.Sound> => {
  await ensureAudioMode()
  const { sound } = await Audio.Sound.createAsync(source)
  return sound
}

const replaySound = async (sound: Audio.Sound): Promise<void> => {
  await sound.setPositionAsync(0)
  const status = await sound.playAsync()
  if (!status.isLoaded) {
    throw new Error('Could not play sound')
  }
}

export async function playReceiveSound(): Promise<void> {
  receiveSoundPromise ??= loadSound(receivedSound)
  await receiveSoundPromise.then(replaySound)
}

export async function playSendSound(): Promise<void> {
  sendSoundPromise ??= loadSound(sentSound)
  await sendSoundPromise.then(replaySound)
}
