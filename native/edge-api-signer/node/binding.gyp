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
      "cflags": ["-Wall", "-Wextra", "-Wno-unused-parameter"],
      "xcode_settings": {
        "OTHER_CFLAGS": ["-Wall", "-Wextra", "-Wno-unused-parameter"],
        "MACOSX_DEPLOYMENT_TARGET": "11.0"
      }
    }
  ]
}
