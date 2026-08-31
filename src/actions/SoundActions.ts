import {
  type AudioPlayer,
  createAudioPlayer,
  setAudioModeAsync
} from 'expo-audio'

import receivedSound from '../assets/sounds/audio_received.mp3'
import sentSound from '../assets/sounds/audio_sent.mp3'

/**
 * Transaction send/receive sounds via expo-audio.
 * react-native-sound stays linked.
 */

let audioModePromise: Promise<void> | undefined
let receivePlayer: AudioPlayer | undefined
let sendPlayer: AudioPlayer | undefined

const ensureAudioMode = async (): Promise<void> => {
  audioModePromise ??= setAudioModeAsync({
    playsInSilentMode: false,
    interruptionMode: 'mixWithOthers',
    shouldPlayInBackground: false
  })
  await audioModePromise
}

const replaySound = async (player: AudioPlayer): Promise<void> => {
  await ensureAudioMode()
  await player.seekTo(0)
  player.play()
}

export async function playReceiveSound(): Promise<void> {
  receivePlayer ??= createAudioPlayer(receivedSound)
  await replaySound(receivePlayer)
}

export async function playSendSound(): Promise<void> {
  sendPlayer ??= createAudioPlayer(sentSound)
  await replaySound(sendPlayer)
}
