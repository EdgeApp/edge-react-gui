import Sound from 'react-native-sound'

let receiveSoundPromise: Promise<Sound> | undefined
let sendSoundPromise: Promise<Sound> | undefined
Sound.setCategory('Ambient', true)

export async function playReceiveSound(): Promise<void> {
  if (!receiveSoundPromise)
    receiveSoundPromise = loadSound('audio_received.mp3')
  await receiveSoundPromise.then(playSound)
}

export async function playSendSound(): Promise<void> {
  if (!sendSoundPromise) sendSoundPromise = loadSound('audio_sent.mp3')
  await sendSoundPromise.then(playSound)
}

/**
 * Turn the node-style Sound constructor into a promise.
 */
async function loadSound(name: string): Promise<Sound> {
  return await new Promise((resolve, reject) => {
    const sound = new Sound(name, Sound.MAIN_BUNDLE, error => {
      if (error != null) reject(error)
      else resolve(sound)
    })
  })
}

/**
 * Turn the node-style Sound.play method into a promise.
 */
async function playSound(sound: Sound): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    sound.play(success => {
      if (success) resolve()
      else reject(new Error('Could not play sound'))
    })
  })
}
