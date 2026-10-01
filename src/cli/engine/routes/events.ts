import { asObject, asOptional, asString, asUnknown } from 'cleaners'

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
 * Scope comes from the query string. With no `sessionId` the stream is
 * context-scoped and nothing but the engine stopping ends it, which is what
 * the `subscribe` command asks for. With `sessionId` it is account-scoped: a
 * logout closes it, and the session events of *other* accounts are filtered
 * out. `walletId` narrows it further, for whenever a wallet-scoped event
 * exists — no event carries a wallet scope today, so on its own it changes
 * only which events close the stream.
 *
 * @note Frame types: `core.log`, `session.created`, `session.expired`,
 *   `engine.shutdown`, and `subscription.closed` when the engine ends it.
 * @note The `subscribe` command prints one further frame of its own once the
 *   stream is over, `subscription.ended`, carrying the close reason. It comes
 *   from the client, so `--type` does not filter it.
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
    custom: true,
    extra: {
      type: {
        kind: 'repeat',
        doc: 'Only these event types. Applied by the engine, so an unwanted type never crosses the socket; the client filters again for the types the engine sends regardless, like `subscription.closed`.'
      }
    },
    exits: { interrupted: 0, engineClosed: 7 },
    notes:
      'Prints newline-delimited JSON and runs until interrupted. Exits 0 on SIGINT and 7 when the engine ends the stream. `subscribe` opens an unscoped stream, which only the engine stopping ends; a stream opened with `sessionId` is closed by that session logging out.'
  },
  // `type` is declared once, by `cli.extra` above, which is what carries its
  // repeatability. Declaring it here as well published `--type` twice in the
  // usage line. Inline, not a named const: `extractRoutes` reads this through
  // the checker as an object *literal*.
  query: asObject({
    sessionId: asOptional(
      doc(
        asString,
        'Scope the stream to one account, so a logout closes it. Omitted, the stream is context-scoped and only the engine stopping ends it.'
      )
    ),
    walletId: asOptional(
      doc(
        asString,
        'With `sessionId`, narrow the stream to one wallet. No event carries a wallet scope yet, so today this only narrows which events can close the stream. Ignored on its own.'
      )
    )
  }).withRest,
  // The frame list and the scoping rules are in this route's `@note`s, which
  // is what the reference publishes; `StreamSpec` says why they are not
  // fields here.
  stream: { marker: true },
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
