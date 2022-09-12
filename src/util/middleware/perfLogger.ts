import RNFS from 'react-native-fs'
import { Middleware } from 'redux'

import { Action, RootState } from '../../types/reduxTypes'

const perfLoggerCSV = RNFS.DocumentDirectoryPath + '/perfLogger.csv'
RNFS.writeFile(perfLoggerCSV, 'action type,start,end\n', 'utf8')
  .then(success => console.log(`PERF: PerfLogger initialized @ ${perfLoggerCSV}`))
  .catch(error => console.log(error.message))

export const perfLogger: Middleware<RootState, Action> = store => next => action => {
  const start = Date.now()
  const result = next(action)
  const end = Date.now()

  RNFS.appendFile(perfLoggerCSV, `${action.type},${start},${end}\n`)

  return result
}
