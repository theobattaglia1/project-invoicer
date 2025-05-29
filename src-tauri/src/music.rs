use lofty::{Accessor, AudioFile, Probe, TaggedFileExt};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Song {
    pub id: String,
    pub name: String,
    pub artist: String,
    pub album: String,
    pub duration: f64,
    pub path: String,
    pub genre: Option<String>,
    pub year: Option<u32>,
    pub track_number: Option<u32>,
    pub artist_id: Option<String>,
    pub album_id: Option<String>,
    pub date_added: String,
    pub play_count: u32,
    pub last_played: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Artist {
    pub id: String,
    pub name: String,
    pub genre: Option<String>,
    pub bio: Option<String>,
    pub image_path: Option<String>,
    pub artwork_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Album {
    pub id: String,
    pub name: String,
    pub artist_id: String,
    pub artist_name: String,
    pub year: Option<u32>,
    pub cover_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Playlist {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub artwork_path: Option<String>,
    pub song_ids: Vec<String>,
    pub artist_id: Option<String>,
    pub date_created: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportResult {
    pub success: bool,
    pub imported_count: usize,
    pub failed_count: usize,
    pub errors: Vec<String>,
    pub songs: Vec<Song>,
}

pub fn generate_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    format!("{}", timestamp)
}

pub fn get_timestamp() -> String {
    use chrono::Utc;
    Utc::now().to_rfc3339()
}

pub async fn import_music_files(file_paths: Vec<String>) -> ImportResult {
    let mut result = ImportResult {
        success: true,
        imported_count: 0,
        failed_count: 0,
        errors: Vec::new(),
        songs: Vec::new(),
    };

    for path in file_paths {
        match extract_metadata(&path) {
            Ok(song) => {
                result.songs.push(song);
                result.imported_count += 1;
            }
            Err(e) => {
                result.failed_count += 1;
                result.errors.push(format!("Failed to import {}: {}", path, e));
            }
        }
    }

    result.success = result.failed_count == 0;
    result
}

fn extract_metadata(file_path: &str) -> Result<Song, String> {
    let path = Path::new(file_path);
    
    // Get file name as fallback
    let file_name = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown")
        .to_string();

    // Try to read metadata
    let tagged_file = Probe::open(path)
        .map_err(|e| format!("Failed to open file: {}", e))?
        .read()
        .map_err(|e| format!("Failed to read file: {}", e))?;

    let tag = tagged_file.primary_tag().or_else(|| tagged_file.first_tag());
    
    let properties = tagged_file.properties();
    let duration = properties.duration().as_secs_f64();

    // Extract metadata with fallbacks
    let (title, artist, album, genre, year, track_number) = if let Some(tag) = tag {
        (
            tag.title()
                .map(|t| t.to_string())
                .unwrap_or_else(|| file_name.clone()),
            tag.artist()
                .map(|a| a.to_string())
                .unwrap_or_else(|| "Unknown Artist".to_string()),
            tag.album()
                .map(|a| a.to_string())
                .unwrap_or_else(|| "Unknown Album".to_string()),
            tag.genre().map(|g| g.to_string()),
            tag.year(),
            tag.track(),
        )
    } else {
        (
            file_name.clone(),
            "Unknown Artist".to_string(),
            "Unknown Album".to_string(),
            None,
            None,
            None,
        )
    };

    Ok(Song {
        id: generate_id(),
        name: title,
        artist,
        album,
        duration,
        path: file_path.to_string(),
        genre,
        year,
        track_number,
        artist_id: None,
        album_id: None,
        date_added: get_timestamp(),
        play_count: 0,
        last_played: None,
    })
}

pub async fn save_artist_image(
    app_handle: &tauri::AppHandle,
    artist_id: &str,
    image_data: Vec<u8>,
    extension: &str,
) -> Result<String, String> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;

    // Create artwork directory
    let artwork_dir = app_dir.join("artwork").join("artists");
    std::fs::create_dir_all(&artwork_dir)
        .map_err(|e| format!("Failed to create artwork directory: {}", e))?;

    // Generate filename
    let filename = format!("{}.{}", artist_id, extension);
    let file_path = artwork_dir.join(&filename);

    // Save the image
    std::fs::write(&file_path, image_data)
        .map_err(|e| format!("Failed to save image: {}", e))?;

    Ok(file_path.to_string_lossy().to_string())
}

pub async fn save_playlist_artwork(
    app_handle: &tauri::AppHandle,
    playlist_id: &str,
    image_data: Vec<u8>,
    extension: &str,
) -> Result<String, String> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;
    
    // Create artwork directory structure
    let artwork_dir = app_dir.join("artwork").join("playlists");
    std::fs::create_dir_all(&artwork_dir)
        .map_err(|e| format!("Failed to create artwork directory: {}", e))?;
    
    // Generate filename
    let filename = format!("{}.{}", playlist_id, extension);
    let file_path = artwork_dir.join(&filename);
    
    // Save the image
    std::fs::write(&file_path, image_data)
        .map_err(|e| format!("Failed to save artwork: {}", e))?;
    
    Ok(file_path.to_string_lossy().to_string())
}

pub async fn save_album_cover(
    app_handle: &tauri::AppHandle,
    album_id: &str,
    image_data: Vec<u8>,
    extension: &str,
) -> Result<String, String> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;
    
    // Create artwork directory structure
    let artwork_dir = app_dir.join("artwork").join("albums");
    std::fs::create_dir_all(&artwork_dir)
        .map_err(|e| format!("Failed to create artwork directory: {}", e))?;
    
    // Generate filename
    let filename = format!("{}.{}", album_id, extension);
    let file_path = artwork_dir.join(&filename);
    
    // Save the image
    std::fs::write(&file_path, image_data)
        .map_err(|e| format!("Failed to save album cover: {}", e))?;
    
    Ok(file_path.to_string_lossy().to_string())
}

pub fn ensure_library_structure(app_handle: &tauri::AppHandle) -> Result<(), String> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;

    // Create all necessary directories
    let dirs = [
        app_dir.join("artwork"),
        app_dir.join("artwork").join("artists"),
        app_dir.join("artwork").join("albums"),
        app_dir.join("artwork").join("playlists"),
    ];

    for dir in &dirs {
        std::fs::create_dir_all(dir)
            .map_err(|e| format!("Failed to create directory {:?}: {}", dir, e))?;
    }

    Ok(())
}