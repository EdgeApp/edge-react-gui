/**
 * Milliseconds since an arbitrary fixed point, from a source no date change can
 * move. Every interval the attestation engine measures - backoff, handshake
 * spacing, token lifetime - is a duration, and durations must not be measured
 * against a clock a user can set backwards.
 */
export const monotonicNow = (): number => performance.now()
