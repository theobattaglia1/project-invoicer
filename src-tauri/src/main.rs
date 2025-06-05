#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

// Minimal Tauri entrypoint—no other modules imported.
fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
