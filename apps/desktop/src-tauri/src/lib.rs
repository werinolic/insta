use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(
            tauri_plugin_updater::Builder::default()
                .pubkey(std::env::var("TAURI_SIGNING_PUBLIC_KEY").unwrap_or_default())
                .build(),
        )
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            // Create the system tray icon
            let tray = tauri::tray::TrayIconBuilder::with_id("main")
                .tooltip("Insta")
                .menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Tray context menu
            let menu = tauri::menu::MenuBuilder::new(app)
                .item(
                    &tauri::menu::MenuItemBuilder::with_id("open", "Open Insta")
                        .build(app)?,
                )
                .separator()
                .item(
                    &tauri::menu::MenuItemBuilder::with_id("quit", "Quit")
                        .build(app)?,
                )
                .build()?;

            tray.set_menu(Some(menu))?;

            // Handle menu events
            app.on_menu_event(|app, event| match event.id().as_ref() {
                "open" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            // Hide to tray instead of closing
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap_or_default();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
