import { f, s } from '../schema'
import { endpoint, group } from '../types'
import { sessionId } from './common'

export const dataStoreGroup = group({
  id: 'data-store',
  title: 'Data store',
  doc: 'The account’s synced key-value store, where plugins keep their own state. One route per `EdgeDataStore` method. Values are opaque strings; encoding is the caller’s business.',
  endpoints: [
    endpoint({
      id: 'listStoreIds',
      summary: 'List store ids',
      coreCall: 'account.dataStore.listStoreIds',
      method: 'GET',
      path: '/accounts/{sessionId}/list-store-ids',
      source: 'src/cli/engine/routes/dataStore.ts',
      cli: [
        {
          command: 'list-store-ids',
          usage: 'list-store-ids',
          example: 'edge-cli list-store-ids'
        }
      ],
      pathParams: [sessionId],
      success: {
        status: 200,
        schema: s.object([f('storeIds', s.array(s.string()))])
      }
    }),

    endpoint({
      id: 'listItemIds',
      summary: 'List item ids in a store',
      coreCall: 'account.dataStore.listItemIds',
      method: 'GET',
      path: '/accounts/{sessionId}/list-item-ids',
      source: 'src/cli/engine/routes/dataStore.ts',
      cli: [
        {
          command: 'list-item-ids',
          usage: 'list-item-ids <storeId>',
          example: 'edge-cli list-item-ids Settings'
        }
      ],
      pathParams: [sessionId],
      query: [
        {
          name: 'storeId',
          schema: s.string({ example: 'Settings' }),
          required: true
        }
      ],
      success: {
        status: 200,
        schema: s.object([f('itemIds', s.array(s.string()))])
      }
    }),

    endpoint({
      id: 'getItem',
      summary: 'Read an item',
      coreCall: 'account.dataStore.getItem',
      method: 'GET',
      path: '/accounts/{sessionId}/get-item',
      source: 'src/cli/engine/routes/dataStore.ts',
      cli: [
        {
          command: 'get-item',
          usage: 'get-item <storeId> --item-id=<itemId>',
          flags: [
            { flag: '--item-id=<itemId>', maps: 'itemId', target: 'query' }
          ],
          example: 'edge-cli get-item Settings --item-id=Settings.json'
        }
      ],
      pathParams: [sessionId],
      query: [
        { name: 'storeId', schema: s.string(), required: true },
        { name: 'itemId', schema: s.string(), required: true }
      ],
      success: {
        status: 200,
        schema: s.object([f('value', s.string())])
      },
      errors: ['NOT_FOUND', 'BAD_REQUEST']
    }),

    endpoint({
      id: 'setItem',
      summary: 'Write an item',
      coreCall: 'account.dataStore.setItem',
      method: 'POST',
      path: '/accounts/{sessionId}/set-item',
      source: 'src/cli/engine/routes/dataStore.ts',
      cli: [
        {
          command: 'set-item',
          usage: 'set-item <storeId> --item-id=<itemId> --value=<text>',
          flags: [
            { flag: '--item-id=<itemId>', maps: 'itemId', target: 'body' },
            { flag: '--value=<text>', maps: 'value', target: 'body' }
          ],
          example: `edge-cli set-item MyPlugin --item-id=state.json --value='{"seen":true}'`
        }
      ],
      pathParams: [sessionId],
      body: s.object([
        f('storeId', s.string()),
        f('itemId', s.string()),
        f('value', s.string())
      ]),
      bodyDoc: 'Creates the store if it does not exist.',
      success: { status: 204 },
      errors: ['BAD_REQUEST']
    }),

    endpoint({
      id: 'deleteItem',
      summary: 'Delete an item',
      coreCall: 'account.dataStore.deleteItem',
      method: 'POST',
      path: '/accounts/{sessionId}/delete-item',
      source: 'src/cli/engine/routes/dataStore.ts',
      cli: [
        {
          command: 'delete-item',
          usage: 'delete-item <storeId> --item-id=<itemId>',
          flags: [
            { flag: '--item-id=<itemId>', maps: 'itemId', target: 'body' }
          ],
          example: 'edge-cli delete-item MyPlugin --item-id=state.json'
        }
      ],
      pathParams: [sessionId],
      body: s.object([f('storeId', s.string()), f('itemId', s.string())]),
      success: { status: 204 },
      errors: ['BAD_REQUEST']
    }),

    endpoint({
      id: 'deleteStore',
      summary: 'Delete an entire store',
      coreCall: 'account.dataStore.deleteStore',
      method: 'POST',
      path: '/accounts/{sessionId}/delete-store',
      source: 'src/cli/engine/routes/dataStore.ts',
      cli: [
        {
          command: 'delete-store',
          usage: 'delete-store <storeId>',
          example: 'edge-cli delete-store MyPlugin'
        }
      ],
      pathParams: [sessionId],
      body: s.object([f('storeId', s.string())]),
      success: { status: 204 },
      errors: ['BAD_REQUEST']
    })
  ]
})
