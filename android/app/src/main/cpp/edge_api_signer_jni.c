#include <jni.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include "edge_api_sign.h"

JNIEXPORT jbyteArray JNICALL
Java_co_edgesecure_app_EdgeApiSignerModule_nativeSignMessage(
  JNIEnv *env,
  jobject thiz,
  jstring message,
  jstring package_name
) {
  const char *msg = (*env)->GetStringUTFChars(env, message, NULL);
  if (msg == NULL) return NULL;
  jsize msg_len = (*env)->GetStringUTFLength(env, message);

  const char *bundle_id = (*env)->GetStringUTFChars(env, package_name, NULL);
  if (bundle_id == NULL) {
    (*env)->ReleaseStringUTFChars(env, message, msg);
    return NULL;
  }

  uint8_t signature[32];
  int rc = edge_api_hmac_sign(
    (const uint8_t *)msg,
    (size_t)msg_len,
    bundle_id,
    signature
  );
  (*env)->ReleaseStringUTFChars(env, message, msg);
  (*env)->ReleaseStringUTFChars(env, package_name, bundle_id);

  if (rc != 0) {
    jclass ex = (*env)->FindClass(env, "java/lang/RuntimeException");
    if (ex != NULL) {
      (*env)->ThrowNew(env, ex, "edge_api_hmac_sign failed");
    }
    return NULL;
  }

  jbyteArray out = (*env)->NewByteArray(env, 32);
  if (out == NULL) return NULL;
  (*env)->SetByteArrayRegion(env, out, 0, 32, (const jbyte *)signature);
  return out;
}

JNIEXPORT jstring JNICALL
Java_co_edgesecure_app_EdgeApiSignerModule_nativeApiKey(
  JNIEnv *env,
  jobject thiz
) {
  return (*env)->NewStringUTF(env, edge_api_key());
}
