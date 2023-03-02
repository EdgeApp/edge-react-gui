import { asDate, asJSON, asMaybe, asObject, uncleaner } from 'cleaners'
import { useEffect } from 'react'

import { clearAllLogs } from '../../actions/LogActions'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { showError } from './AirshipInstance'

const LOG_WIPE_INFO_FILENAME = 'logWipeInfo.json'
const WIPE_LOGS_BEFORE_TIME = new Date('2023-02-21T00:00:00.000Z')

type LogWipeInfo = ReturnType<typeof asLogWipeInfo>
const asLogWipeInfo = asJSON(
  asObject({
    lastWipeTimestamp: asDate
  })
)
const wasLogWipeInfo = uncleaner(asLogWipeInfo)

export const WipeLogsService = () => {
  const dispatch = useDispatch()
  const disklet = useSelector(state => state.core.disklet)

  useEffect(() => {
    const handler = async () => {
      console.log('Checking for expired logs')
      const dataItem = await disklet.getText(LOG_WIPE_INFO_FILENAME).catch(err => {
        console.warn(`Failed to access ${LOG_WIPE_INFO_FILENAME} data: ${String(err)}`)
      })
      const logWipeInfo = asMaybe(asLogWipeInfo)(dataItem)

      if (logWipeInfo?.lastWipeTimestamp == null || logWipeInfo.lastWipeTimestamp.valueOf() < WIPE_LOGS_BEFORE_TIME.valueOf()) {
        console.log('Wiping expired logs...')
        await clearAllLogs()
        const newLogWipeInfo: LogWipeInfo = {
          lastWipeTimestamp: new Date()
        }

        await disklet.setText(LOG_WIPE_INFO_FILENAME, wasLogWipeInfo(newLogWipeInfo))
        console.log('Completed wipe of expired logs')
      }
    }

    handler().catch(err => {
      console.error(err)
      showError(`Failed to wipe logs: ${String(err)}`)
    })
  }, [dispatch, disklet])

  return null
}
