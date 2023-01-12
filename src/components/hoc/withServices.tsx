import * as React from 'react'

import { Services } from '../services/Services'

export function withServices<Props>(Component: React.ComponentType<Props>): React.FunctionComponent<Props> {
  function WithServices(props: any) {
    return (
      <>
        <Component {...props} />
        <Services />
      </>
    )
  }
  const displayName = Component.displayName ?? Component.name ?? 'Component'
  WithServices.displayName = `WithServices(${displayName})`
  return WithServices
}
