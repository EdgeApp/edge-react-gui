import fs from 'fs'
// import { execFile } from 'node:child_process'

const main = async () => {
  // const result = await execFileAsync('yarn', ['tsc'])
  const result = fs.readFileSync('./tsc.txt', { encoding: 'utf8' })

  const lines = result.split('\n')
  const regex = /src\/(.*)\((\d+),(\d+)\): error/

  lines.reverse()
  let currentFile = ''
  let currentFileArray: string[] = []
  for (const line of lines) {
    if (line.startsWith('node_modules')) continue
    const matches = regex.exec(line)
    if (matches == null) continue
    const file = matches[1]
    const lineNum = matches[2]
    const fullFile = `./src/${file}`

    console.log(`file: ${fullFile}, lineNum: ${lineNum}`)
    if (fullFile !== currentFile) {
      if (currentFile.length > 0) {
        fs.writeFileSync(currentFile, currentFileArray.join('\n'), { encoding: 'utf8' })
      }
      currentFile = fullFile
      const fileText = fs.readFileSync(fullFile, { encoding: 'utf8' })
      currentFileArray = fileText.split('\n')
    }

    const ln = Number(lineNum)
    const l = currentFileArray[ln - 1]

    if (line.includes(`Unused '@ts-expect-error' directive`)) {
      currentFileArray[ln - 1] = ''
      continue
    }
    // Check if this is a JSX line
    const jsxMatch = /^(\s*<\w\w* )/.exec(l)
    if (jsxMatch != null) {
      currentFileArray.splice(ln - 1, 0, '{/* @ts-expect-error */}')

      // const firstHalf = jsxMatch[1]
      // const secondHalf = l.slice(firstHalf.length)
      // currentFileArray[ln - 1] = firstHalf
      // currentFileArray.splice(ln, 0, '// @ts-expect-error')
      // currentFileArray.splice(ln + 1, 0, secondHalf)
    } else {
      // Insert the comments line
      currentFileArray.splice(ln - 1, 0, '// @ts-expect-error')
    }
  }
  if (currentFile.length > 0) {
    fs.writeFileSync(currentFile, currentFileArray.join('\n'), { encoding: 'utf8' })
  }
}

// const execFileAsync = async (cmd: string, args: string[]): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     execFile(cmd, args, { encoding: 'utf8' }, (_error, stdio, stderr) => {
//       let out = ''
//       // if (error != null) reject(error)
//       if (typeof stdio === 'string') out += stdio
//       if (typeof stderr === 'string') out += stderr
//       resolve(out)
//     })
//   })
// }

main().catch(e => console.log(e.message))
