fn main() {
    #[cfg(feature = "napi-backend")]
    napi_build::setup();

    #[cfg(feature = "uniffi-backend")]
    uniffi::generate_scaffolding("src/dash.udl").unwrap();
}
