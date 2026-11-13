/**
 * The protocol version clients branch on.
 *
 * One declaration, because it reaches five protocol-visible surfaces: the
 * run file's `apiVersion`, the `X-Edge-Api-Version` header on both the REST
 * and the SSE responses, `/engine/status`, the OpenAPI document's
 * `info.version` and the HTML reference's header. Separate copies would let
 * bumping one leave the others lying about the protocol.
 */
export const API_VERSION = '1.0.0'

/**
 * The header's own name, beside the value it carries.
 *
 * Shared by `server.ts` and `events.ts`, so the two cannot spell it
 * differently. `transportAuth.ts` sets the precedent with `TCP_TOKEN_HEADER`.
 */
export const API_VERSION_HEADER = 'X-Edge-Api-Version'
