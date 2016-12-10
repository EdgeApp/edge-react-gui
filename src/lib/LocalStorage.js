const MAX_CHARACTERS_IN_FILE = 2048
const WRITE_TIMEOUT = 50
var RNFS = require('react-native-fs')
const writeAsJSON = (pathToDb, data) => {
  var json = JSON.stringify(data)

  if (json.length < MAX_CHARACTERS_IN_FILE) {
    RNFS.writeFile(pathToDb, json).then(err => {
      if (err) {
        throw err
      }
    })
  } else {
    throw new Error(`LocalStorage: Count of characters
      in file must be less then ${MAX_CHARACTERS_IN_FILE + 1}`)
  }
}

const readJSONDb = (pathToDb, callback) => {
  var text = RNFS.readFile(pathToDb).then(function (err) {
    return callback(JSON.parse(text))
  }).catch((err) => {
    console.log('local store load error', err.message)
    return callback([])
  })
}

const isString = val =>
  typeof val === 'string' || val instanceof String

const copy = v => {
  return {
    key: v.key,
    value: v.value
  }
}

const defineLocalVariable = (ctx, name, value) => {
  Object.defineProperty(ctx, name, {
    value,
    configurable: false,
    enumerable: false
  })
}

const init = (ctx, data) => {
  var def = defineLocalVariable.bind(null, ctx)
  var list = data.map(copy)
  var map = new Map()
  list.forEach(record => map.set(record.key, record))

  def('map', map)
  def('list', list)
}

const writeToDisk = ctx => {
  var timeoutId = ctx.writeTimerId

  if (timeoutId === -1) {
    ctx.writeTimerId = setTimeout(() => {
      if (ctx.pathToDb) {
        writeAsJSON(ctx.pathToDb, ctx.list)
      }

      ctx.writeTimerId = -1
    }, WRITE_TIMEOUT)

    return
  }

  clearTimeout(ctx.writeTimerId)
  ctx.writeTimerId = -1
  writeToDisk(ctx)
}

/**
 * Generaly object of storage.
 * @constructor
 * @param {string} absolutePathToDbFile - Absolute path to db.
 * @param {Array} data - List of key value pairs.
 */
function LocalStorage (absolutePathToDbFile) {
  var self = this
  readJSONDb(absolutePathToDbFile, function (data) {
    init(self, data)

    defineLocalVariable(self, 'pathToDb', absolutePathToDbFile)

    Object.defineProperty(self, 'writeTimerId', {
      value: -1,
      writable: true,
      enumerable: false
    })

    Object.defineProperty(self, 'length', {
      get: () => {
        return self.list.length
      },
      configurable: false,
      enumerable: false
    })
  })
}

LocalStorage.prototype.setItem = function (key, value) {
  if (!isString(key)) {
    throw new Error('LocalStorage#setItem(key, value): key must be a string')
  }

  if (value === undefined || value === null) {
    throw new Error('LocalStorage#setItem(key, value):' +
      ' setItem should take two arguments')
  }

  var map = this.map
  var list = this.list
  var field
  value = value.toString()

  if (map.has(key)) {
    field = map.get(key)
    field.value = value
  } else {
    field = {key, value}
    list.push(field)
    map.set(key, field)
  }

  writeToDisk(this)
}

LocalStorage.prototype.getItem = function (key) {
  var map = this.map

  if (map.has(key)) {
    return map.get(key).value
  }
}

LocalStorage.prototype.removeItem = function (key) {
  var map = this.map
  var list = this.list

  if (map.has(key)) {
    var field

    map.delete(key)

    for (var i = 0; i < list.length; i++) {
      field = list[i]

      if (field.key === key) {
        list.splice(i, 1)
        break
      }
    }
  }

  writeToDisk(this)
}

LocalStorage.prototype.clear = function () {
  this.map.clear()
  this.list.splice(0, this.list.length)
  writeToDisk(this)
}

module.exports = LocalStorage
