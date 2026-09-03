/**
 * Node N-API bindings for the shared Edge API HMAC C core.
 *
 * The runtime pad comes from the generated edge_api_secret.h rather than a
 * literal here, so it is always the id scripts/makeApiSigner.ts baked into the
 * shards. A stale or hand-edited header fails the build instead of silently
 * producing signatures the login server rejects.
 */

#include <node_api.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include "edge_api_secret.h"
#include "edge_api_sign.h"

#ifndef EDGE_NODE_BUNDLE_ID
#error "EDGE_NODE_BUNDLE_ID missing - regenerate with scripts/makeApiSigner.ts"
#endif

static const char kBase64Table[] =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

static char *edge_base64_encode(const uint8_t *data, size_t len) {
  size_t out_len = 4 * ((len + 2) / 3);
  char *out = (char *)malloc(out_len + 1);
  size_t i;
  size_t j = 0;
  if (out == NULL) return NULL;

  for (i = 0; i + 2 < len; i += 3) {
    uint32_t n = ((uint32_t)data[i] << 16) | ((uint32_t)data[i + 1] << 8) |
                 (uint32_t)data[i + 2];
    out[j++] = kBase64Table[(n >> 18) & 63];
    out[j++] = kBase64Table[(n >> 12) & 63];
    out[j++] = kBase64Table[(n >> 6) & 63];
    out[j++] = kBase64Table[n & 63];
  }
  if (i < len) {
    uint32_t n = ((uint32_t)data[i] << 16);
    out[j++] = kBase64Table[(n >> 18) & 63];
    if (i + 1 < len) {
      n |= ((uint32_t)data[i + 1] << 8);
      out[j++] = kBase64Table[(n >> 12) & 63];
      out[j++] = kBase64Table[(n >> 6) & 63];
      out[j++] = '=';
    } else {
      out[j++] = kBase64Table[(n >> 12) & 63];
      out[j++] = '=';
      out[j++] = '=';
    }
  }
  out[j] = '\0';
  return out;
}

static napi_value edge_throw(napi_env env, const char *message) {
  napi_throw_error(env, NULL, message);
  return NULL;
}

static napi_value SignMessage(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value argv[1];
  napi_status status;
  napi_valuetype value_type;
  size_t msg_len = 0;
  char *msg = NULL;
  uint8_t signature[32];
  char *signature_b64 = NULL;
  napi_value result;
  napi_value api_key_val;
  napi_value signature_val;
  int rc;

  status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  if (status != napi_ok || argc < 1) {
    return edge_throw(env, "signMessage(message) requires a string");
  }

  status = napi_typeof(env, argv[0], &value_type);
  if (status != napi_ok || value_type != napi_string) {
    return edge_throw(env, "message must be a string");
  }

  status = napi_get_value_string_utf8(env, argv[0], NULL, 0, &msg_len);
  if (status != napi_ok) {
    return edge_throw(env, "failed to read message length");
  }

  msg = (char *)malloc(msg_len + 1);
  if (msg == NULL) {
    return edge_throw(env, "out of memory");
  }

  status = napi_get_value_string_utf8(env, argv[0], msg, msg_len + 1, &msg_len);
  if (status != napi_ok) {
    free(msg);
    return edge_throw(env, "failed to read message");
  }

  rc = edge_api_hmac_sign(
    (const uint8_t *)msg, msg_len, EDGE_NODE_BUNDLE_ID, signature
  );
  free(msg);
  if (rc != 0) {
    return edge_throw(env, "edge_api_hmac_sign failed");
  }

  signature_b64 = edge_base64_encode(signature, 32);
  if (signature_b64 == NULL) {
    return edge_throw(env, "out of memory");
  }

  status = napi_create_object(env, &result);
  if (status != napi_ok) {
    free(signature_b64);
    return edge_throw(env, "failed to create result object");
  }

  status = napi_create_string_utf8(env, edge_api_key(), NAPI_AUTO_LENGTH, &api_key_val);
  if (status != napi_ok) {
    free(signature_b64);
    return edge_throw(env, "failed to create apiKey");
  }

  status = napi_create_string_utf8(
    env, signature_b64, NAPI_AUTO_LENGTH, &signature_val
  );
  free(signature_b64);
  if (status != napi_ok) {
    return edge_throw(env, "failed to create signature");
  }

  status = napi_set_named_property(env, result, "apiKey", api_key_val);
  if (status != napi_ok) {
    return edge_throw(env, "failed to set apiKey");
  }
  status = napi_set_named_property(env, result, "signature", signature_val);
  if (status != napi_ok) {
    return edge_throw(env, "failed to set signature");
  }

  return result;
}

static napi_value GetApiKey(napi_env env, napi_callback_info info) {
  napi_value result;
  napi_status status =
    napi_create_string_utf8(env, edge_api_key(), NAPI_AUTO_LENGTH, &result);
  if (status != napi_ok) {
    return edge_throw(env, "failed to create apiKey");
  }
  return result;
}

static napi_value Init(napi_env env, napi_value exports) {
  napi_value sign_fn;
  napi_value get_key_fn;
  napi_status status;

  status = napi_create_function(env, "signMessage", NAPI_AUTO_LENGTH, SignMessage, NULL, &sign_fn);
  if (status != napi_ok) return NULL;
  status = napi_set_named_property(env, exports, "signMessage", sign_fn);
  if (status != napi_ok) return NULL;

  status = napi_create_function(env, "getApiKey", NAPI_AUTO_LENGTH, GetApiKey, NULL, &get_key_fn);
  if (status != napi_ok) return NULL;
  status = napi_set_named_property(env, exports, "getApiKey", get_key_fn);
  if (status != napi_ok) return NULL;

  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
