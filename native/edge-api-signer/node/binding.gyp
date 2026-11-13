{
  "targets": [
    {
      "target_name": "edge_api_signer",
      "sources": [
        "edge_api_signer_napi.c",
        "edge_api_secret.c",
        "../edge_hmac.c"
      ],
      "include_dirs": ["..", "."],
      # `-Wno-unused-parameter` with `-Wextra`: every N-API entry point has
      # the `(napi_env, napi_callback_info)` signature whether or not it
      # reads both, so the warning fires on correct code and would bury the
      # ones worth reading.
      "cflags": ["-Wall", "-Wextra", "-Wno-unused-parameter"],
      "xcode_settings": {
        "OTHER_CFLAGS": ["-Wall", "-Wextra", "-Wno-unused-parameter"],
        # Below 11.0 the Apple Silicon arm64 slice is not produced, so an
        # `npm install` on an M-series Mac builds an x86_64 addon that Node
        # then refuses to load. 11.0 is Big Sur, the first release with
        # arm64, and the floor every other native target in this repository
        # is at or above.
        "MACOSX_DEPLOYMENT_TARGET": "11.0"
      }
    }
  ]
}
