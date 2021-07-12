// @flow

import * as ReactRedux from 'react-redux'

import { type Dispatch, type RootState } from '../types/reduxTypes.js'

type UseDispatch = () => Dispatch

type UseSelector = <T>((state: RootState) => T) => T

// $FlowFixMe
export const useDispatch: UseDispatch = ReactRedux.useDispatch
// $FlowFixMe
export const useSelector: UseSelector = ReactRedux.useSelector
