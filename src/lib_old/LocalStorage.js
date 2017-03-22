var RNFS = require('react-native-fs')

const readJSONDb = (pathToDb, callback) => {
  RNFS.readFile(RNFS.DocumentDirectoryPath + pathToDb).then(function (text) {
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
    configurable: true,
    enumerable: false,
    writable: true
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
  RNFS.writeFile(RNFS.DocumentDirectoryPath + ctx.pathToDb, JSON.stringify(ctx.list), 'utf8').then((success) => {

  }).catch(err => {
    throw err
  })
}

/**
 * Generaly object of storage.
 * @constructor
 * @param {string} absolutePathToDbFile - Absolute path to db.
 * @param {Array} data - List of key value pairs.
 */
function LocalStorage (absolutePathToDbFile, callback) {
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
      configurable: true,
      enumerable: false
    })
    callback(self)
  })
}
LocalStorage.prototype.key = function (index) {
  return this.list[index].key || undefined
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
  try {
    if (map.has(key)) {
      // console.log(key, map.get(key).value)
      return map.get(key).value
    }
  } catch (e) {
    console.log(e)
    return null
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
