// @flow

import { useEffect, useState } from '../../types/reactHooks'

export const useIsEffectRender = (isRunEffect: boolean, druration: number) => {
  const [isRender, setIsRender] = useState(true)

  useEffect(() => {
    isRunEffect ? setIsRender(true) : setTimeout(() => setIsRender(false), druration + 100)
  }, [isRunEffect, druration])

  return { isRender, setIsRender }
}
