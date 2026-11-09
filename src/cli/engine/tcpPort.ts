import net from 'net'

/**
 * The example loopback TCP port.
 *
 * `--tcp` has no default: the listener is off unless a port is given, so
 * nothing resolves this number at runtime, and it only ever appears in text
 * telling a reader what a port looks like. The usage errors in
 * `parseArgs.ts`, `engine/engineArgs.ts` and `parseTcpPort` below, and the
 * OpenAPI text `scripts/buildApiDocs.ts` emits, all read this one
 * declaration, so a change reaches every one of them.
 *
 * `docs/EDGE_CLI.md` is prose and not generated, so it spells the port by
 * hand, and `src/cli/flagTable.ts` cites no example, so `edge-cli --help`
 * renders `--tcp=<port>`.
 */
export const EXAMPLE_TCP_PORT = 9008

/**
 * A `--tcp` port, validated the same way on both entries.
 *
 * One check for the client and the engine, so a port one accepts the other
 * cannot refuse. `0` is allowed, because an ephemeral port is the documented
 * behaviour; everything Node's `listen` rejects, such as `1.5` or `70000`,
 * is rejected here with the flag named, rather than crashing at `listen`
 * with `ERR_SOCKET_BAD_PORT`.
 */
export function parseTcpPort(raw: string | undefined): number | null {
  // `undefined` means the flag is absent, which is the listener's off state.
  // An *empty* value is a typo, `--tcp=`, and is refused here, once, for both
  // entries: read as absent, it would silently start no listener while a
  // bare `--tcp` is a usage error.
  if (raw == null) return null
  if (raw === '') {
    throw new RangeError(
      `Missing value for --tcp: expected a port, e.g. --tcp=${EXAMPLE_TCP_PORT}`
    )
  }
  const port = Number(raw)
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new RangeError(
      `Invalid --tcp port "${raw}": expected 0-65535, where 0 picks an ephemeral port`
    )
  }
  return port
}

/**
 * A `--tcp-host` value, canonicalised.
 *
 * Normalised here and nowhere else, so the bind address, the allowed-name set
 * in `transportAuth` and the `Host` header comparison all speak one
 * spelling. The brackets come off `[::1]`: `allowedHostnamesFor` seeds its
 * set from this string while `hostnameOf` strips the brackets `URL` keeps,
 * so a set holding `[::1]` would refuse every request 403, and
 * `server.listen(port, '[::1]')` sends a bracketed literal through DNS
 * resolution rather than binding it as an address.
 *
 * Loopback only: the TCP transport is for local scripts, and an engine
 * reachable from the LAN exposes `get-raw-private-key` and `spend` to it.
 */
export function parseTcpHost(host: string): string {
  const canonical = host.replace(/^\[|\]$/g, '')
  // `net.isIPv4` before the prefix test: the prefix alone would accept
  // `127.000.000.001` and `127.999.999.999`, which are not addresses at all,
  // and `server.listen` would send them through DNS resolution, giving a
  // startup failure with a DNS error for an argv mistake, or a listener whose
  // `Host` set matches nothing and refuses every request.
  const loopback =
    canonical === 'localhost' ||
    canonical === '::1' ||
    (net.isIPv4(canonical) && canonical.startsWith('127.'))
  if (!loopback) {
    throw new RangeError(
      `--tcp-host must be a loopback address (127.0.0.0/8, ::1 or localhost), not "${host}": the TCP transport is for local scripts`
    )
  }
  return canonical
}
