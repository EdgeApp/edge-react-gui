import { setupServer } from 'msw/node'
import { context, getSortedEntries, snapshot, toHashString } from 'msw-snapshot'

export const mswServer = setupServer(
  snapshot({
    basePath: './src/__mocks__/snapshots/',
    updateSnapshots: 'missing',
    // msw-snapshot's default path, minus the colons: it nests files under
    // `url.origin`, whose scheme and port separators Windows cannot check
    // out, so a clone there failed. The hash is the default one, unchanged.
    createSnapshotPath: async info => {
      const url = new URL(info.request.url)
      const hash = toHashString([
        getSortedEntries(url.searchParams),
        getSortedEntries(info.request.headers),
        getSortedEntries(info.cookies),
        new TextDecoder('utf-8').decode(await info.request.arrayBuffer())
      ])
      return [
        context.namespace,
        info.request.method,
        url.protocol.replace(':', ''),
        url.host.replace(':', '_') + url.pathname,
        hash
      ].join('/')
    }
  })
)
