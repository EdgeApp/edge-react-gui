import { asObject, asString, asUnknown } from 'cleaners'

import { doc } from '../doc'
import { route } from '../route'

/**
 * Subscribe to engine events.
 *
 * Holds a Server-Sent Events stream open until the caller disconnects or the
 * engine closes it. Runs concurrently with one-shot calls, so a subscriber in
 * one terminal watches what another terminal does.
 *
 * A live subscription holds the engine open past its idle timeout. It does not
 * hold an account logged in: the auto-logout timer still fires, and closes any
 * subscription scoped to that account or one of its wallets. Context-scoped
 * subscriptions survive, because the context outlives every account.
 *
 * @note Frame types: `core.log`, `session.created`, `session.expired`,
 *   `engine.shutdown`, and `subscription.closed` when the engine ends it.
 * @note `sessionId` in event payloads is truncated to its first 10 characters.
 * @note A client more than 1 MiB behind is disconnected rather than buffered.
 * @note Served directly by the HTTP handler rather than through the router,
 *   because the response never ends.
 * @coreNote Engine-side fan-out; `core.log` frames carry core's onLog output.
 */
export const engineEvents = route({
  core: null,
  method: 'GET',
  path: '/engine/events',
  cli: {
    command: 'subscribe',
    extra: {
      type: {
        kind: 'repeat',
        doc: 'Client-side filter; the engine always sends everything the scope allows.'
      }
    },
    exits: { interrupted: 0, sessionClosed: 3, engineClosed: 7 },
    notes:
      'Prints newline-delimited JSON and runs until interrupted. Exits 0 on SIGINT, 3 when a session ended the stream, 7 when the engine went away.'
  },
  stream: {
    scope: 'context',
    frames: [
      'core.log',
      'session.created',
      'session.expired',
      'engine.shutdown',
      'subscription.closed'
    ]
  },
  returns: doc(
    asObject({
      type: doc(asString, 'The event name.'),
      data: doc(asUnknown, 'Payload, shaped by the event type.')
    }),
    'One frame per event, as `event:` then `data:` lines.'
  ),

  handler() {
    // The SSE upgrade happens in server.ts, which owns the response.
    return undefined
  }
})
