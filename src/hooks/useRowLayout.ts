import { useTheme } from '../components/services/ThemeContext'
import { useHandler } from '../hooks/useHandler'

type rowLayoutHandler<T> = (data: T[] | null | undefined, index: number) => { length: number; offset: number; index: number }

export const useRowLayout = <T>(rowHeightRem: number = 4.25): rowLayoutHandler<T> => {
  const theme = useTheme()

  return useHandler((data, index) => ({ length: theme.rem(rowHeightRem), offset: theme.rem(rowHeightRem) * index, index }))
}
