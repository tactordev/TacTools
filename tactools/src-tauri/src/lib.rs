// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use std::path::{Component, Path, PathBuf};
use tauri::{AppHandle, Runtime};
use tauri_plugin_fs::FsExt;

#[tauri::command]
fn scope_drive<R: Runtime>(app: AppHandle<R>, path: PathBuf) -> Result<String, String> {
    let root_drive = path
        .components()
        .next()
        .map(|component| match component {
            Component::Prefix(prefix) => {
                PathBuf::from(format!("{}\\", prefix.as_os_str().to_string_lossy()))
            }
            Component::RootDir => PathBuf::from("/"),
            other => Path::new(other.as_os_str()).to_path_buf(),
        })
        .ok_or_else(|| "Could not determine the root drive of the provided path.".to_string())?;

    let scope = app.fs_scope();

    scope
        .allow_directory(&root_drive, true)
        .map_err(|err| format!("Failed to extend scope: {}", err))?;

    Ok(format!("Successfully scoped entire drive: {:?}", root_drive))
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![scope_drive])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
