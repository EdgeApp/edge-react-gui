import childProcess from 'child_process'
import { randomBytes } from 'crypto'
// import fs from 'fs'
import { join } from 'path'
import prompts from 'prompts'

let _currentPath = __dirname

const main = async (): Promise<void> => {
  mylog(_currentPath)
  const newpath = join(_currentPath, '..', 'keystores')
  chdir(newpath)
  const password = (await randomBytes(16)).toString('hex')

  const { alias } = await prompts({
    name: 'alias',
    type: 'text',
    message: 'Enter app alias (ie. "edge-develop")',
    validate: (v: string) => v.trim() !== ''
  })

  const { encryptionKey } = await prompts({
    name: 'encryptionKey',
    type: 'text',
    message: 'Enter encryptionKey provided by Google Play under the option "Export and upload a key from Java keystore"',
    validate: (v: string) => v.trim() !== ''
  })

  call(
    `keytool -genkey -keystore ${alias}-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias ${alias} -dname "cn=Unknown, ou=Unknown, o=Unknown, c=Unknown" -storepass ${password} -keypass ${password}`
  )
  mylog(`Enter the following password at the prompts: ${password}`)
  call(`java -jar ~/bin/pepk.jar --keystore=${alias}-keystore.jks --alias=${alias} --output=${alias}.zip --include-cert --encryptionkey=${encryptionKey}`)

  // Uncomment out if creating a separate upload key

  // call(
  //   `keytool -genkey -keystore ${alias}-upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias ${alias}-upload -dname "cn=Unknown, ou=Unknown, o=Unknown, c=Unknown" -storepass ${password} -keypass ${password}`
  // )
  // call(
  //   `keytool -export -rfc -keystore ${alias}-upload-keystore.jks -alias ${alias}-upload -file ${alias}-upload-cert.pem -storepass ${password} -keypass ${password}`
  // )

  mylog('Keystore created in keystores directory. Save the following keystore password. It cannot be recovered if lost.')
  mylog('********************************')
  mylog(password)
  mylog('********************************')
}

const mylog = console.log

function call(cmdstring: string) {
  // console.log('call: ' + cmdstring)
  childProcess.execSync(cmdstring, {
    encoding: 'utf8',
    timeout: 3600000,
    stdio: 'inherit',
    cwd: _currentPath,
    killSignal: 'SIGKILL'
  })
}

function chdir(path: string) {
  console.log('chdir: ' + path)
  _currentPath = path
}

main().catch(e => console.log(e.message))
