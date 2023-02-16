import { useNavigation } from '@react-navigation/native'
import { useEffect } from 'react'

/**
 * This hook allows scenes to handle the router's back event.
 * It accepts a handler which must return a boolean to indicate whether to
 * allow the back navigation or not.
 *
 * **_This hook should only be used within scene components_**
 */
export const useBackEvent = (handler: (actionType: string) => boolean) => {
  const navigation = useNavigation()
  useEffect(
    () =>
      navigation.addListener('beforeRemove', ev => {
        if (!handler(ev.data.action.type)) {
          ev.preventDefault()
        }
      }),
    [handler, navigation]
  )
}
