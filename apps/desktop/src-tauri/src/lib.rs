#[cfg(not(debug_assertions))]
use tauri_plugin_shell::ShellExt;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Set window icon
            if let Some(window) = app.get_webview_window("main") {
                let icon = tauri::image::Image::from_bytes(include_bytes!("../icons/icon.png"))
                    .expect("Failed to load icon");
                let _ = window.set_icon(icon);
            }

            #[cfg(not(debug_assertions))]
            {
                let sidecar = app.shell().sidecar("kintsugi-server").unwrap();
                let (mut _rx, mut _child) = sidecar.spawn().expect("Failed to spawn sidecar");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
