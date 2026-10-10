/**
 * The protocol version clients branch on.
 *
 * One declaration, because it reaches five protocol-visible surfaces that
 * nothing gated against each other: the run file's `apiVersion`, the
 * `X-Edge-Api-Version` header on both the REST and the SSE responses,
 * `/engine/status`, the OpenAPI document's `info.version` and the HTML
 * reference's header. Separate copies meant bumping one left the others
 * lying about the protocol, and the SSE header was a literal.
 *
 * It lived in `router.ts`, which is URL matching, not versioning.
 */
export const API_VERSION = '1.0.0'

/**
 * The header's own name, beside the value it carries.
 *
 * A literal in `server.ts` and again in `events.ts`, which is the drift this
 * module exists to end — and the docblock above already records that "the
 * SSE header was a literal". `transportAuth.ts` sets the precedent with
 * `TCP_TOKEN_HEADER`.
 */
export const API_VERSION_HEADER = 'X-Edge-Api-Version'
