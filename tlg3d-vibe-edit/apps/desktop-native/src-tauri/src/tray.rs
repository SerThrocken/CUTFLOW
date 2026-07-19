// ============================================================
//  CutFlow — Tauri System Tray Module (tray.rs)
//  Sets up native OS system tray icon with context menu.
//  Shows connection status, quick actions, open window.
// ============================================================

use tauri::{
    AppHandle, Manager, Runtime,
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    image::Image,
};

pub fn setup_tray<R: Runtime>(app: &tauri::App<R>) -> Result<(), Box<dyn std::error::Error>> {
    let open_item   = MenuItem::with_id(app, "open",   "Open CutFlow",        true, None::<&str>)?;
    let status_item = MenuItem::with_id(app, "status", "Status: Running",     false, None::<&str>)?;
    let sep1        = PredefinedMenuItem::separator(app)?;
    let projects_item = MenuItem::with_id(app, "projects", "My Projects",     true, None::<&str>)?;
    let marketplace_item = MenuItem::with_id(app, "marketplace", "Marketplace", true, None::<&str>)?;
    let sep2        = PredefinedMenuItem::separator(app)?;
    let quit_item   = MenuItem::with_id(app, "quit",   "Quit CutFlow",        true, None::<&str>)?;

    let menu = Menu::with_items(app, &[
        &open_item,
        &status_item,
        &sep1,
        &projects_item,
        &marketplace_item,
        &sep2,
        &quit_item,
    ])?;

    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "projects" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit("navigate", "/projects");
                }
            }
            "marketplace" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit("navigate", "/marketplace");
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button:       MouseButton::Left,
                button_state: MouseButtonState::Up,
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

    Ok(())
}
