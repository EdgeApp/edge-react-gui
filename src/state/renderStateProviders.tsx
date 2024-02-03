import * as React from 'react'

import { SceneFooterProvider, SceneFooterRenderProvider } from './SceneFooterState'
import { SceneScrollProvider } from './SceneScrollState'

const stateProviders = [SceneScrollProvider, SceneFooterProvider, SceneFooterRenderProvider]

export const renderStateProviders = (children: React.ReactNode) => stateProviders.reduce((element, Provider) => <Provider>{element}</Provider>, children)
