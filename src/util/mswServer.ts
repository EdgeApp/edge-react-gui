import { setupServer } from 'msw/node'
import { snapshot } from 'msw-snapshot'

export const mswServer = setupServer(
  snapshot({
    basePath: './src/__mocks__/snapshots/',
    updateSnapshots: 'missing'
  })
)
