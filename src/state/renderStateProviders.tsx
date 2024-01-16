import * as React from 'react'

import { SceneDrawerProvider } from './SceneFooterState'
import { SceneScrollProvider } from './SceneScrollState'

const stateProviders = [SceneScrollProvider, SceneDrawerProvider]

export const renderStateProviders = (children: React.ReactNode) => stateProviders.reduce((element, Provider) => <Provider>{element}</Provider>, children)
