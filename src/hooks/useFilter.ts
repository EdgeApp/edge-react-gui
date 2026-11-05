import * as React from 'react'

import { useHandler } from './useHandler'

/**
 * Filters a list by the latest filter text. The result follows `allData`,
 * so rows that arrive after mount (such as contacts loaded once access is
 * granted) show without the user typing again.
 */
export function useFilter<T>(
  allData: T[],
  filterData: (filter: string, item: T, index: number) => boolean = () => true
): [T[], (filter: string) => void] {
  const [filter, setFilter] = React.useState('')
  const handleFilterData = useHandler(filterData)

  const filteredData = React.useMemo(
    () =>
      filter === ''
        ? allData
        : allData.filter((item, index) =>
            handleFilterData(filter, item, index)
          ),
    [allData, filter, handleFilterData]
  )

  return [filteredData, setFilter]
}
