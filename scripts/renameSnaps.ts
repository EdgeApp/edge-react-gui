const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'src')

console.log(DIR)

const getAllFiles = function (dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath)

  arrayOfFiles = arrayOfFiles || []

  files.forEach(function (file: string) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles)
    } else {
      arrayOfFiles.push(path.join(dirPath, '/', file))
    }
  })

  return arrayOfFiles
}

const files = getAllFiles(DIR)

const snapFiles = files.filter(f => f.endsWith('test.js.snap'))
const tsxFiles = files.filter(f => f.endsWith('test.tsx'))

for (const sf of snapFiles) {
  const prefix = sf.slice(0, -8)
  const tsxName = prefix + '.tsx'
  const tsName = prefix + '.ts'
  const tempArray = tsxName.split('/')
  const tsxFileOnly = tempArray[tempArray.length - 1]
  let newFile = ''
  if (tsxFiles.find(f => f.endsWith(tsxFileOnly))) {
    newFile = `${tsxName}.snap`
  } else {
    newFile = `${tsName}.snap`
  }
  console.log(`Rename ${sf} to ${newFile}`)
  fs.renameSync(sf, newFile)
}
