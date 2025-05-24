use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::fs;
use id3::{Tag, TagLike};
use mp3_duration;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Song {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub artist_id: Option<String>,
    pub album: String,
    pub album_id: Option<String>,
    pub duration: u32, // Duration in seconds
    pub path: String,
    pub file_size: u64,
    pub format: String,
    pub date_added: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Artist {
    pub id: String,
    pub name: String,
    pub genre: Option<String>,
    pub image_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Album {
    pub id: String,
    pub name: String,
    pub artist_id: String,
    pub artist_name: String,
    pub year: Option<u32>,
    pub cover_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Playlist {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub song_ids: Vec<String>,
    pub date_created: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportResult {
    pub success: bool,
    pub imported_count: usize,
    pub failed_count: usize,
    pub songs: Vec<Song>,
    pub errors: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub file_type: String,
}

// Generate a unique ID
pub fn generate_id() -> String {
    use chrono::Utc;
    let timestamp = Utc::now().timestamp_millis();
    format!("{}", timestamp)
}

// Get current timestamp
pub fn get_timestamp() -> String {
    use chrono::Utc;
    Utc::now().to_rfc3339()
}

// Extract metadata from audio file
pub fn extract_metadata(path: &Path) -> Result<Song, String> {
    let path_str = path.to_string_lossy().to_string();
    let file_name = path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Unknown");
    
    // Get file metadata
    let metadata = fs::metadata(path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;
    let file_size = metadata.len();
    
    // Determine format from extension
    let format = path.extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("unknown")
        .to_lowercase();
    
    // Default values
    let mut title = file_name.trim_end_matches(&format!(".{}", format)).to_string();
    let mut artist = "Unknown Artist".to_string();
    let mut album = "Unknown Album".to_string();
    let mut duration = 0u32;
    
    // Try to read ID3 tags for MP3 files
    if format == "mp3" {
        // Get duration
        if let Ok(dur) = mp3_duration::from_path(path) {
            duration = dur.as_secs() as u32;
        }
        
        // Get ID3 tags
        match Tag::read_from_path(path) {
            Ok(tag) => {
                if let Some(t) = tag.title() {
                    title = t.to_string();
                }
                if let Some(a) = tag.artist() {
                    artist = a.to_string();
                }
                if let Some(al) = tag.album() {
                    album = al.to_string();
                }
            }
            Err(_) => {
                // Fallback: try to parse filename
                // Format: "Artist - Title.mp3"
                if let Some(_dash_pos) = file_name.find(" - ") {
                    let parts: Vec<&str> = file_name.split(" - ").collect();
                    if parts.len() >= 2 {
                        artist = parts[0].trim().to_string();
                        title = parts[1].trim_end_matches(&format!(".{}", format)).trim().to_string();
                    }
                }
            }
        }
    }
    // Add support for other formats here (M4A, FLAC, etc.)
    
    Ok(Song {
        id: generate_id(),
        title,
        artist: artist.clone(),
        artist_id: None, // Will be set later when matching with artists
        album: album.clone(),
        album_id: None, // Will be set later when matching with albums
        duration,
        path: path_str,
        file_size,
        format,
        date_added: get_timestamp(),
    })
}

// Import multiple music files
pub async fn import_music_files(file_paths: Vec<String>) -> ImportResult {
    let mut songs = Vec::new();
    let mut errors = Vec::new();
    let mut imported_count = 0;
    let mut failed_count = 0;
    
    for path_str in file_paths {
        let path = Path::new(&path_str);
        
        if !path.exists() {
            errors.push(format!("File not found: {}", path_str));
            failed_count += 1;
            continue;
        }
        
        match extract_metadata(path) {
            Ok(song) => {
                songs.push(song);
                imported_count += 1;
            }
            Err(e) => {
                errors.push(format!("Failed to import {}: {}", path_str, e));
                failed_count += 1;
            }
        }
    }
    
    ImportResult {
        success: failed_count == 0,
        imported_count,
        failed_count,
        songs,
        errors,
    }
}

// Create music library directory structure
pub fn ensure_library_structure(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_dir = app_handle.path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;
    
    let music_dir = app_dir.join("music_library");
    let artists_dir = music_dir.join("artists");
    let playlists_dir = music_dir.join("playlists");
    let covers_dir = music_dir.join("covers");
    
    // Create directories if they don't exist
    fs::create_dir_all(&music_dir)
        .map_err(|e| format!("Failed to create music directory: {}", e))?;
    fs::create_dir_all(&artists_dir)
        .map_err(|e| format!("Failed to create artists directory: {}", e))?;
    fs::create_dir_all(&playlists_dir)
        .map_err(|e| format!("Failed to create playlists directory: {}", e))?;
    fs::create_dir_all(&covers_dir)
        .map_err(|e| format!("Failed to create covers directory: {}", e))?;
    
    Ok(music_dir)
}

// Save artist image
pub async fn save_artist_image(
    app_handle: &tauri::AppHandle,
    artist_id: &str,
    image_data: Vec<u8>,
    extension: &str,
) -> Result<String, String> {
    let music_dir = ensure_library_structure(app_handle)?;
    let artists_dir = music_dir.join("artists");
    
    let file_name = format!("{}.{}", artist_id, extension);
    let file_path = artists_dir.join(&file_name);
    
    fs::write(&file_path, image_data)
        .map_err(|e| format!("Failed to save artist image: {}", e))?;
    
    Ok(file_path.to_string_lossy().to_string())
}

// Format duration from seconds to "M:SS" format
pub fn format_duration(seconds: u32) -> String {
    let minutes = seconds / 60;
    let secs = seconds % 60;
    format!("{}:{:02}", minutes, secs)
}