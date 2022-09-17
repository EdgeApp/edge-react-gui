import * as React from 'react'

type SetState<S> = (value: S | ((state: S) => S)) => void

type UseState = <S>(init: S | (() => S)) => [S, SetState<S>]

export const useState: UseState = React.useState
