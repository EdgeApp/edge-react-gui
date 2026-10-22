import RNFS from 'react-native-fs'
import type { Middleware } from 'redux'

import { CONFIG } from '../../config'
import type { Dispatch, RootState } from '../../types/reduxTypes'

const perfLoggerCSV = RNFS.DocumentDirectoryPath + '/perfLogger.csv'

if (CONFIG.ENABLE_REDUX_PERF_LOGGING) {
  RNFS.writeFile(perfLoggerCSV, 'action type,start,end\n', 'utf8')
    .then(success => {
      console.log(`PERF: PerfLogger initialized @ ${perfLoggerCSV}`)
    })
    .catch((error: unknown) => {
      console.log(String(error))
    })
}

export const perfLogger: Middleware<unknown, RootState, Dispatch> =
  store => next => action => {
    const start = Date.now()
    const result = next(action)
    const end = Date.now()

    if (CONFIG.ENABLE_REDUX_PERF_LOGGING) {
      RNFS.appendFile(perfLoggerCSV, `${action.type},${start},${end}\n`)
        // Log to the console instead of showError to not spam the user
        .catch((err: unknown) => {
          console.error(err)
        })
    }
    return result
  }
