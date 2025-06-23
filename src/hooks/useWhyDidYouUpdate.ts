import * as React from 'react'

export const useWhyDidYouUpdate = <T extends object>(
  name: string,
  props: T
) => {
  // Get a mutable ref object where we can store props ...
  // ... for comparison next time this hook runs.
  const previousProps = React.useRef({})
  React.useEffect(() => {
    if (previousProps.current) {
      // Get all keys from previous and current props
      const allKeys = Object.keys({ ...previousProps.current, ...props })
      // Use this object to keep track of changed props
      const changesObj = {}
      // Iterate through keys
      allKeys.forEach(key => {
        // If previous is different from current
        // @ts-expect-error
        if (previousProps.current[key] !== props[key]) {
          // Add to changesObj
          // @ts-expect-error
          changesObj[key] = {
            // @ts-expect-error
            from: previousProps.current[key],
            // @ts-expect-error
            to: props[key]
          }
        }
      })
      // If changesObj not empty then output to console
      if (Object.keys(changesObj).length) {
        console.log('[why-did-you-update]', name, changesObj)
      }
    }
    // Finally update previousProps with current props for next hook call
    previousProps.current = props
  })
}
