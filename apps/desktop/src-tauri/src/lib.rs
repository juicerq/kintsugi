#[cfg(not(debug_assertions))]
use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            #[cfg(not(debug_assertions))]
            {
                let sidecar = app.shell().sidecar("kintsugi-server").unwrap();
                let (mut _rx, mut _child) = sidecar.spawn().expect("Failed to spawn sidecar");
            }
            let _ = app;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
