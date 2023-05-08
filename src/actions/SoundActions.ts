import Sound from 'react-native-sound'

let receiveSoundPromise: Promise<Sound> | undefined
let sendSoundPromise: Promise<Sound> | undefined
Sound.setCategory('Ambient', true)

export async function playReceiveSound(): Promise<void> {
  if (!receiveSoundPromise) receiveSoundPromise = loadSound('audio_received.mp3')
  return await receiveSoundPromise.then(playSound)
}

export async function playSendSound(): Promise<void> {
  if (!sendSoundPromise) sendSoundPromise = loadSound('audio_sent.mp3')
  return await sendSoundPromise.then(playSound)
}

/**
 * Turn the node-style Sound constructor into a promise.
 */
async function loadSound(name: string): Promise<Sound> {
  return await new Promise((resolve, reject) => {
    const sound: Sound = new Sound(name, Sound.MAIN_BUNDLE, error => (error ? reject(error) : resolve(sound)))
  })
}

/**
 * Turn the node-style Sound.play method into a promise.
 */
async function playSound(sound: Sound): Promise<void> {
  return await new Promise((resolve, reject) => {
    sound.play(success => (success ? resolve() : new Error('Could not play sound')))
  })
}
