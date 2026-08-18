#include <jni.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include "edge_api_sign.h"

static void throw_by_name(JNIEnv *env, const char *class_name, const char *msg) {
  jclass ex = (*env)->FindClass(env, class_name);
  if (ex != NULL) {
    (*env)->ThrowNew(env, ex, msg);
  }
}

static void throw_illegal_argument(JNIEnv *env, const char *msg) {
  throw_by_name(env, "java/lang/IllegalArgumentException", msg);
}

static void throw_runtime(JNIEnv *env, const char *msg) {
  throw_by_name(env, "java/lang/RuntimeException", msg);
}

JNIEXPORT jbyteArray JNICALL
Java_co_edgesecure_app_EdgeApiSignerModule_nativeSignMessage(
  JNIEnv *env,
  jobject thiz,
  jbyteArray message_utf8,
  jbyteArray package_name_utf8
) {
  if (message_utf8 == NULL || package_name_utf8 == NULL) {
    throw_illegal_argument(env, "messageUtf8 and packageNameUtf8 are required");
    return NULL;
  }

  jsize msg_len = (*env)->GetArrayLength(env, message_utf8);
  jbyte *msg_bytes = (*env)->GetByteArrayElements(env, message_utf8, NULL);
  if (msg_bytes == NULL) return NULL;

  jsize pkg_len = (*env)->GetArrayLength(env, package_name_utf8);
  jbyte *pkg_bytes = (*env)->GetByteArrayElements(env, package_name_utf8, NULL);
  if (pkg_bytes == NULL) {
    (*env)->ReleaseByteArrayElements(env, message_utf8, msg_bytes, JNI_ABORT);
    return NULL;
  }

  /* edge_api_hmac_sign expects a C string bundle id (NUL-terminated). */
  char *bundle_id = (char *)malloc((size_t)pkg_len + 1);
  if (bundle_id == NULL) {
    (*env)->ReleaseByteArrayElements(env, message_utf8, msg_bytes, JNI_ABORT);
    (*env)->ReleaseByteArrayElements(env, package_name_utf8, pkg_bytes, JNI_ABORT);
    throw_by_name(env, "java/lang/OutOfMemoryError", "bundle id allocation failed");
    return NULL;
  }
  memcpy(bundle_id, pkg_bytes, (size_t)pkg_len);
  bundle_id[pkg_len] = '\0';

  uint8_t signature[32];
  int rc = edge_api_hmac_sign(
    (const uint8_t *)msg_bytes,
    (size_t)msg_len,
    bundle_id,
    signature
  );
  (*env)->ReleaseByteArrayElements(env, message_utf8, msg_bytes, JNI_ABORT);
  (*env)->ReleaseByteArrayElements(env, package_name_utf8, pkg_bytes, JNI_ABORT);
  free(bundle_id);

  if (rc != 0) {
    throw_runtime(env, "edge_api_hmac_sign failed");
    return NULL;
  }

  /* nativeSignMessage is declared non-null in Kotlin, so a bare NULL return
     would surface as an NPE far from its cause. */
  jbyteArray out = (*env)->NewByteArray(env, 32);
  if (out == NULL) {
    throw_by_name(env, "java/lang/OutOfMemoryError", "signature allocation failed");
    return NULL;
  }
  (*env)->SetByteArrayRegion(env, out, 0, 32, (const jbyte *)signature);
  memset(signature, 0, sizeof(signature));
  return out;
}

JNIEXPORT jstring JNICALL
Java_co_edgesecure_app_EdgeApiSignerModule_nativeApiKey(
  JNIEnv *env,
  jobject thiz
) {
  jstring out = (*env)->NewStringUTF(env, edge_api_key());
  if (out == NULL) {
    throw_runtime(env, "apiKey allocation failed");
  }
  return out;
}
