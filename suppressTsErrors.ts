import fs from 'fs'
import { execFile } from 'node:child_process'

const main = async () => {
  const result = await execFileAsync('yarn', ['tsc'])
  // const result = fs.readFileSync('./tsc.txt', { encoding: 'utf8' })

  const lines = result.split('\n')
  const regex = /src\/(.*)\((\d+),(\d+)\): error/

  lines.reverse()
  let currentFile = ''
  let currentFileArray: string[] = []
  let lastFile: string = ''
  let lastLine: number = 0
  for (const line of lines) {
    if (line.startsWith('node_modules')) continue
    const matches = regex.exec(line)
    if (matches == null) continue
    const file = matches[1]
    const lineNum = Number(matches[2])
    const fullFile = `./src/${file}`

    // See if we have already processed this line:
    if (file === lastFile && lineNum === lastLine) {
      continue
    }

    console.log(`file: ${fullFile}, lineNum: ${lineNum}`)
    if (fullFile !== currentFile) {
      if (currentFile.length > 0) {
        fs.writeFileSync(currentFile, currentFileArray.join('\n'), { encoding: 'utf8' })
      }
      currentFile = fullFile
      const fileText = fs.readFileSync(fullFile, { encoding: 'utf8' })
      currentFileArray = fileText.split('\n')
    }

    const ln = lineNum - 1
    const l = currentFileArray[ln]

    if (line.includes(`Unused '@ts-expect-error' directive`)) {
      currentFileArray[ln] = ''
      continue
    }
    // Check if this is a JSX line
    const jsxMatch = /^(\s*<\w\w* )/.exec(l)
    if (jsxMatch != null) {
      currentFileArray.splice(ln, 0, '{/* @ts-expect-error */}')
    } else {
      currentFileArray.splice(ln, 0, '// @ts-expect-error')
    }
    lastFile = file
    lastLine = lineNum
  }
  if (currentFile.length > 0) {
    fs.writeFileSync(currentFile, currentFileArray.join('\n'), { encoding: 'utf8' })
  }
}

const execFileAsync = async (cmd: string, args: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { encoding: 'utf8' }, (_error, stdio, stderr) => {
      let out = ''
      // if (error != null) reject(error)
      if (typeof stdio === 'string') out += stdio
      if (typeof stderr === 'string') out += stderr
      resolve(out)
    })
  })
}

main().catch(e => console.log(e.message))
