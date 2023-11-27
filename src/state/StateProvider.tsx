import React from 'react'

import { RegisteredProviders } from './index'

type ProviderComponent = React.FunctionComponent<{ children: React.ReactNode }>

export function StateProviders({ children }: { children: React.ReactNode }) {
  const AllProviders = RegisteredProviders.reduce((AllProviders, Provider) => withComponents(AllProviders, Provider))

  if (AllProviders == null) return null

  return <AllProviders>{children}</AllProviders>
}

const withComponents = (A: ProviderComponent, B: ProviderComponent) => {
  function WithComponent({ children }: { children: React.ReactNode }) {
    return (
      <A>
        <B>{children}</B>
      </A>
    )
  }

  return WithComponent
}
