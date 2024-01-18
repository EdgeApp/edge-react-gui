import * as React from 'react'

import { SceneFooterProvider } from './SceneFooterState'
import { SceneScrollProvider } from './SceneScrollState'

const stateProviders = [SceneScrollProvider, SceneFooterProvider]

export const renderStateProviders = (children: React.ReactNode) => stateProviders.reduce((element, Provider) => <Provider>{element}</Provider>, children)
