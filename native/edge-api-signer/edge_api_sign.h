#ifndef EDGE_API_SIGN_H
#define EDGE_API_SIGN_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/** Public API key identifier (not secret). */
const char *edge_api_key(void);

/**
 * HMAC-SHA256 the UTF-8 message with the reassembled API secret.
 * Writes 32 bytes to signature_out.
 * bundle_id is used as a runtime pad (typically "co.edgesecure.app").
 * Returns 0 on success, non-zero on failure.
 */
int edge_api_hmac_sign(
  const uint8_t *message,
  size_t message_len,
  const char *bundle_id,
  uint8_t signature_out[32]
);

#ifdef __cplusplus
}
#endif

#endif /* EDGE_API_SIGN_H */
