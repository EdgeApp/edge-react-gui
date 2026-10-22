/* Compact public-domain SHA-256 + HMAC-SHA256 for Edge API signing.
 * Based on Brad Conte's public-domain SHA-256 (unlicense / public domain). */

#ifndef EDGE_HMAC_H
#define EDGE_HMAC_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define EDGE_SHA256_DIGEST_SIZE 32
#define EDGE_SHA256_BLOCK_SIZE 64

typedef struct {
  uint8_t data[EDGE_SHA256_BLOCK_SIZE];
  uint32_t datalen;
  uint64_t bitlen;
  uint32_t state[8];
} edge_sha256_ctx;

void edge_sha256_init(edge_sha256_ctx *ctx);
void edge_sha256_update(edge_sha256_ctx *ctx, const uint8_t *data, size_t len);
void edge_sha256_final(edge_sha256_ctx *ctx, uint8_t hash[EDGE_SHA256_DIGEST_SIZE]);

/** HMAC-SHA256. out must be EDGE_SHA256_DIGEST_SIZE bytes. */
void edge_hmac_sha256(
  const uint8_t *key,
  size_t key_len,
  const uint8_t *msg,
  size_t msg_len,
  uint8_t out[EDGE_SHA256_DIGEST_SIZE]
);

/** Best-effort wipe that compilers should not optimize away. */
void edge_secure_wipe(void *ptr, size_t len);

#ifdef __cplusplus
}
#endif

#endif /* EDGE_HMAC_H */
