// @flow

import { useState } from '../types/reactHooks.js'

const CACHE_MAX_SIZE = 10

export function useFilter<T>(allData: T[], filterData?: (filter: string, item: T, index: number) => boolean = () => true): [T[], (filter: string) => void] {
  const [filteredData, setFilteredData] = useState(allData)
  const [filteredDataCache, setFilteredDataCache] = useState({ '': allData })
  const [fifoCache, setFifoCache] = useState([''])

  const setFilter = (filter: string) => {
    // If already existing in cache just return the existing sort
    if (filteredDataCache[filter] != null) {
      setFilteredData(filteredDataCache[filter])
    } else {
      // Create the new filtered Array
      const newFilteredData = allData.filter((item, index) => filterData(filter, item, index))
      // Updated the cache
      filteredDataCache[filter] = newFilteredData
      fifoCache.unshift(filter)
      // Check if over maximum cache size
      if (fifoCache.length >= CACHE_MAX_SIZE) {
        const cacheKey = fifoCache.pop()
        delete filteredDataCache[cacheKey]
      }
      // Update state
      setFifoCache(fifoCache)
      setFilteredDataCache(filteredDataCache)
      setFilteredData(newFilteredData)
    }
  }

  return [filteredData, setFilter]
}
