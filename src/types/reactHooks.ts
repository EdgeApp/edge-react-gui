import * as React from 'react'

type SetState<S> = (value: S | ((state: S) => S)) => void

type UseRef = {
  // Value container:
  <T>(init: T): { current: T }
  <T>(): { current: T | undefined }

  // Component ref:
  <T>(init: T | null): { current: T | null }
}

type UseState = <S>(init: S | (() => S)) => [S, SetState<S>]

export const useRef: UseRef = React.useRef

export const useState: UseState = React.useState
