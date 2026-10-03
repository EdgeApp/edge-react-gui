/**
 * The example and default loopback TCP port.
 *
 * `--tcp` has no default — the listener is off unless a port is given — so
 * this is the number the help text, the two usage errors, the client's
 * fallback and the OpenAPI server entry all cite. It was written out in four
 * source locations plus the docs, so a change left some of them stale.
 */
export const EXAMPLE_TCP_PORT = 9008

/**
 * A `--tcp` port, validated the same way on both entries.
 *
 * The client demanded `1 <= port <= 65535` while the engine accepted any
 * finite `port >= 0`, so `--tcp=0` — which the docs document as "ephemeral" —
 * worked on the engine and was refused by the client, and `--tcp=1.5` or
 * `--tcp=70000` were accepted by the engine and then crashed at `listen`
 * with `ERR_SOCKET_BAD_PORT`. `0` is allowed, because an ephemeral port is
 * the documented behaviour; everything Node's `listen` rejects is rejected
 * here, with the flag named.
 */
export function parseTcpPort(raw: string | undefined): number | null {
  // `undefined` means the flag is absent, which is the listener's off state.
  // An *empty* value is a typo — `--tcp=` — and used to mean the same thing,
  // so `--tcp` was a usage error while `--tcp=` silently started no
  // listener. One spelling cannot mean "off" at one call site and "bad argv"
  // at another, so the empty string is refused here, once, for both entries.
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
 * spelling. `--tcp-host=[::1]` used to be accepted and then answer nothing:
 * `allowedHostnamesFor` seeded its set from the raw string, so the set held
 * `[::1]`, while `hostnameOf` strips the brackets `URL` keeps — so a
 * caller's `Host: [::1]:9008` arrived as `::1`, missed the set, and every
 * request was refused 403 with a message about DNS rebinding.
 * `server.listen(port, '[::1]')` would not have bound it as an address
 * either, sending a bracketed literal through DNS resolution instead. The
 * unbracketed form worked, which is what made the bracketed one a trap
 * rather than an obvious failure.
 *
 * Loopback only: the TCP transport is for local scripts, and an engine
 * reachable from the LAN exposes `get-raw-private-key` and `spend` to it.
 */
export function parseTcpHost(host: string): string {
  const canonical = host.replace(/^\[|\]$/g, '')
  const loopback =
    canonical === 'localhost' ||
    canonical === '::1' ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(canonical)
  if (!loopback) {
    throw new RangeError(
      `--tcp-host must be a loopback address (127.0.0.0/8, ::1 or localhost), not "${host}": the TCP transport is for local scripts`
    )
  }
  return canonical
}
