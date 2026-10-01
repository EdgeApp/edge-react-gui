/**
 * The protocol version clients branch on.
 *
 * One declaration, because it reaches five protocol-visible surfaces that
 * nothing gated against each other: the run file's `apiVersion`, the
 * `X-Edge-Api-Version` header on both the REST and the SSE responses,
 * `/engine/status`, the OpenAPI document's `info.version` and the HTML
 * reference's header. Separate copies meant bumping one left the others
 * lying about the protocol — the SSE header was exactly that, a literal
 * this comment claimed could not exist.
 *
 * It lived in `router.ts`, which is URL matching, not versioning.
 */
export const API_VERSION = '1.0.0'
