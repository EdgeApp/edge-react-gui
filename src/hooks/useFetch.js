// @flow

import { type Cleaner } from 'cleaners'
import { type RequestInit } from 'node-fetch'

import { useRef, useState } from '../types/reactHooks.js'
import { useAsyncEffect } from './useAsyncEffect.js'
import { useHandler } from './useHandler.js'

type UseFetchOptions<T> = {
  fetchOpts?: RequestInit,
  defaultData?: T,
  errorMessage?: string,
  deferred?: boolean,
  asData?: Cleaner<T>,
  asError?: Cleaner<Error>
}

export function useFetch<T>(
  uri: string,
  options: UseFetchOptions<T>
): { data?: T, error?: Error, loading: boolean, fetchData: (deferedFetchOpts?: RequestInit) => void } {
  const { deferred = false, asData = a => a, asError = a => a } = options
  const [loading, setLoading] = useState(!deferred)
  const [shouldFetch, setShouldFetch] = useState(!deferred)
  const fetchOpts = useRef(options.fetchOpts ?? {})
  const data = useRef(options.defaultData)
  const error = useRef()

  // Allows for fetching a deferred fetch or for re-fetching the data
  const fetchData = useHandler((deferedFetchOpts = {}) => {
    fetchOpts.current = { ...fetchOpts.current, deferedFetchOpts }
    setShouldFetch(true)
  })

  useAsyncEffect(async () => {
    // If were deferred, Don't fetch until we're told to
    if (!shouldFetch) return

    // Set loading to true to show a loading indicator (or whatever other usage you need)
    setLoading(true)

    try {
      const response = await fetch(uri, fetchOpts.current)
      if (!response.ok) throw new Error(options.errorMessage ?? `Error Fetching from ${uri}`)

      const json = await response.json()
      data.current = asData(json)
    } catch (e) {
      error.current = asError(e)
    } finally {
      setLoading(false)
      setShouldFetch(false)
    }
  }, [shouldFetch])

  return {
    data: data.current,
    error: error.current,
    loading,
    fetchData
  }
}
