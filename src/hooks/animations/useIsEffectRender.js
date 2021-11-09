// @flow

import { useEffect, useState } from '../../types/reactHooks'

export const useIsEffectRender = (isRunEffect: boolean, duration: number) => {
  const [isRender, setIsRender] = useState(true)

  useEffect(() => {
    isRunEffect ? setIsRender(true) : setTimeout(() => setIsRender(false), duration)
  }, [isRunEffect, duration])

  return { isRender, setIsRender }
}
