// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod music;
mod database;

use music::{Song, Artist, Album, Playlist, ImportResult};
use database::Database;
use std::sync::Mutex;
use tauri::{Manager, State};
use serde::{Serialize, Deserialize};
use sha1::{Digest, Sha1};

struct AppState {
    db: Mutex<Option<Database>>,
    app_handle: tauri::AppHandle,
}

// Metadata Update Structs
#[derive(Debug, Deserialize)]
pub struct SongUpdate {
    pub id: String,
    pub name: String,
    pub artist: String,
    pub album: String,
    pub genre: String,
    pub year: String,
    pub artwork: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PlaylistUpdate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub artwork: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ArtistUpdate {
    pub id: String,
    pub name: String,
    pub bio: String,
    pub artwork: Option<String>,
}

// Sidebar Configuration Structs
#[derive(Debug, Serialize, Deserialize)]
pub struct SidebarConfig {
    pub sections: Vec<SidebarSection>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SidebarSection {
    pub id: String,
    pub name: Option<String>,
    pub items: Vec<SidebarItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SidebarItem {
    pub id: String,
    #[serde(rename = "type")]
    pub item_type: String,
    pub label: String,
    pub icon: Option<String>,
    pub view: Option<String>,
    pub playlist_id: Option<String>,
    pub count: Option<u32>,
}

// Initialize the database
fn init_database(app_handle: &tauri::AppHandle) -> Result<Database, String> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;

    std::fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app directory: {}", e))?;

    let db_path = app_dir.join("music_library.db");
    Database::new(&db_path).map_err(|e| format!("Failed to initialize database: {}", e))
}

// Import music files command
#[tauri::command]
async fn import_music_files(
    _app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    file_paths: Vec<String>,
) -> Result<ImportResult, String> {
    // Import the files and extract metadata
    let mut import_result = music::import_music_files(file_paths).await;

    // Get database
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;

    // Process each imported song
    for song in &mut import_result.songs {
        // Check if artist exists, create if not
        match db.find_artist_by_name(&song.artist) {
            Ok(Some(artist)) => {
                song.artist_id = Some(artist.id);
            }
            Ok(None) => {
                // Create new artist
                let artist = Artist {
                    id: music::generate_id(),
                    name: song.artist.clone(),
                    genre: None,
                    bio: None,
                    image_path: None,
                    artwork_path: None,
                };
                db.insert_artist(&artist)
                    .map_err(|e| format!("Failed to insert artist: {}", e))?;
                song.artist_id = Some(artist.id.clone());
            }
            Err(e) => return Err(format!("Database error: {}", e)),
        }

        // Check if album exists, create if not
        if let Some(artist_id) = &song.artist_id {
            match db.find_album_by_name_and_artist(&song.album, artist_id) {
                Ok(Some(album)) => {
                    song.album_id = Some(album.id);
                }
                Ok(None) => {
                    // Create new album
                    let album = Album {
                        id: music::generate_id(),
                        name: song.album.clone(),
                        artist_id: artist_id.clone(),
                        artist_name: song.artist.clone(),
                        year: None,
                        cover_path: None,
                    };
                    db.insert_album(&album)
                        .map_err(|e| format!("Failed to insert album: {}", e))?;
                    song.album_id = Some(album.id);
                }
                Err(e) => return Err(format!("Database error: {}", e)),
            }
        }

        // Insert the song
        db.insert_song(song)
            .map_err(|e| format!("Failed to insert song: {}", e))?;
    }

    Ok(import_result)
}

// Get all songs
#[tauri::command]
fn get_all_songs(state: State<'_, AppState>) -> Result<Vec<Song>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;

    db.get_all_songs()
        .map_err(|e| format!("Failed to get songs: {}", e))
}

// Get all songs with album covers
#[tauri::command]
fn get_all_songs_with_covers(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;

    let songs = db.get_all_songs()
        .map_err(|e| format!("Failed to get songs: {}", e))?;
    
    let albums = db.get_all_albums()
        .map_err(|e| format!("Failed to get albums: {}", e))?;
    
    // Create a map of album_id to cover_path
    let album_covers: std::collections::HashMap<String, Option<String>> = albums
        .into_iter()
        .map(|album| (album.id, album.cover_path))
        .collect();
    
    // Enhance songs with cover paths
    let enhanced_songs: Vec<serde_json::Value> = songs
        .into_iter()
        .map(|song| {
            let cover_path = song.album_id.as_ref()
                .and_then(|id| album_covers.get(id))
                .and_then(|path| path.clone());
            
            serde_json::json!({
                "id": song.id,
                "name": song.name,
                "artist": song.artist,
                "album": song.album,
                "duration": song.duration,
                "path": song.path,
                "genre": song.genre,
                "year": song.year,
                "track_number": song.track_number,
                "artist_id": song.artist_id,
                "album_id": song.album_id,
                "date_added": song.date_added,
                "play_count": song.play_count,
                "last_played": song.last_played,
                "artwork_path": cover_path,
                "artwork_updated": std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis()
            })
        })
        .collect();
    
    Ok(enhanced_songs)
}

// Get all artists
#[tauri::command]
fn get_all_artists(state: State<'_, AppState>) -> Result<Vec<Artist>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;

    db.get_all_artists()
        .map_err(|e| format!("Failed to get artists: {}", e))
}

// Get all playlists
#[tauri::command]
fn get_all_playlists(state: State<'_, AppState>) -> Result<Vec<Playlist>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;

    let playlists = db.get_all_playlists()
        .map_err(|e| format!("Failed to get playlists: {}", e))?;
    
    // Debug log
    println!("🎵 Fetched {} playlists from database", playlists.len());
    for playlist in &playlists {
        println!("  - Playlist '{}' (ID: {}) has artist_id: {:?}", 
            playlist.name, playlist.id, playlist.artist_id);
    }
    
    Ok(playlists)
}

// Get all albums
#[tauri::command]
fn get_all_albums(state: State<'_, AppState>) -> Result<Vec<Album>, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;

    db.get_all_albums()
        .map_err(|e| format!("Failed to get albums: {}", e))
}

// Create artist
#[tauri::command]
fn create_artist(
    state: State<'_, AppState>,
    name: String,
    genre: Option<String>,
) -> Result<Artist, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;

    let artist = Artist {
        id: music::generate_id(),
        name,
        genre,
        bio: None,
        image_path: None,
        artwork_path: None,
    };

    db.insert_artist(&artist)
        .map_err(|e| format!("Failed to create artist: {}", e))?;

    Ok(artist)
}

// Create playlist - Uses camelCase parameters
#[tauri::command]
fn create_playlist(
    state: State<'_, AppState>,
    name: String,
    description: Option<String>,
    color: Option<String>,
    artistId: Option<String>,  // camelCase parameter
) -> Result<Playlist, String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;

    println!("🎵 Creating playlist '{}' with artistId: {:?}", name, artistId);

    let playlist = Playlist {
        id: music::generate_id(),
        name,
        description,
        color,
        artwork_path: None,
        song_ids: Vec::new(),
        artist_id: artistId,  // Map from camelCase parameter to snake_case field
        date_created: music::get_timestamp(),
    };

    db.insert_playlist(&playlist)
        .map_err(|e| format!("Failed to create playlist: {}", e))?;

    println!("✅ Created playlist with ID: {} and artist_id: {:?}", playlist.id, playlist.artist_id);

    Ok(playlist)
}

// Add songs to playlist - FIXED to use camelCase
#[tauri::command]
fn add_songs_to_playlist(
    state: State<'_, AppState>,
    playlistId: String,    // Changed to camelCase
    songIds: Vec<String>,  // Changed to camelCase
) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;

    println!("🎵 Adding {} songs to playlist {}", songIds.len(), playlistId);

    for song_id in songIds {
        db.add_song_to_playlist(&playlistId, &song_id)
            .map_err(|e| format!("Failed to add song to playlist: {}", e))?;
    }

    Ok(())
}

// Remove song from playlist - FIXED to use camelCase
#[tauri::command]
fn remove_song_from_playlist(
    state: State<'_, AppState>,
    playlistId: String,  // Changed to camelCase
    songId: String,      // Changed to camelCase
) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;

    db.remove_song_from_playlist(&playlistId, &songId)
        .map_err(|e| format!("Failed to remove song from playlist: {}", e))
}

// Delete song
#[tauri::command]
fn delete_song(state: State<'_, AppState>, song_id: String) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;

    db.delete_song(&song_id)
        .map_err(|e| format!("Failed to delete song: {}", e))
}

// Delete playlist - Fixed to use camelCase
#[tauri::command]
fn delete_playlist(
    state: State<'_, AppState>,
    playlistId: String,  // Changed to camelCase to match frontend
) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    
    db.delete_playlist(&playlistId)
        .map_err(|e| format!("Failed to delete playlist: {}", e))
}

// Delete artist
#[tauri::command]
fn delete_artist(
    state: State<'_, AppState>,
    artist_id: String,
) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    
    db.delete_artist(&artist_id)
        .map_err(|e| format!("Failed to delete artist: {}", e))
}

// Save artist image - FIXED to use camelCase
#[tauri::command]
async fn save_artist_image(
    app_handle: tauri::AppHandle,
    artistId: String,       // Changed to camelCase
    imageData: Vec<u8>,     // Changed to camelCase
    extension: String,
) -> Result<String, String> {
    music::save_artist_image(&app_handle, &artistId, imageData, &extension).await
}

// Save playlist artwork - FIXED to use camelCase
#[tauri::command]
async fn save_playlist_artwork(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    playlistId: String,     // Changed to camelCase
    imageData: Vec<u8>,     // Changed to camelCase
    extension: String,
) -> Result<String, String> {
    // Save the artwork file
    let artwork_path = music::save_playlist_artwork(
        &app_handle,
        &playlistId,
        imageData,
        &extension
    ).await?;
    
    // Update the playlist in database to store the artwork path
    {
        let db = state.db.lock().unwrap();
        let db = db.as_ref().ok_or("Database not initialized")?;
        
        if let Ok(Some(mut playlist)) = db.get_playlist_by_id(&playlistId) {
            playlist.artwork_path = Some(artwork_path.clone());
            db.update_playlist(&playlist)
                .map_err(|e| format!("Failed to update playlist artwork: {}", e))?;
        }
    }
    
    Ok(artwork_path)
}

// Scan music directory
#[tauri::command]
async fn scan_music_directory(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    directory_path: String,
) -> Result<ImportResult, String> {
    use walkdir::WalkDir;

    let mut file_paths = Vec::new();
    let valid_extensions = ["mp3", "m4a", "flac", "wav", "ogg"];

    for entry in WalkDir::new(&directory_path).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            if let Some(ext) = entry.path().extension() {
                if valid_extensions
                    .contains(&ext.to_str().unwrap_or("").to_lowercase().as_str())
                {
                    if let Some(path_str) = entry.path().to_str() {
                        file_paths.push(path_str.to_string());
                    }
                }
            }
        }
    }

    import_music_files(app_handle, state, file_paths).await
}

// Helper commands
#[tauri::command]
fn hash_file(path: String) -> Result<String, String> {
    use std::{fs::File, io::Read};
    let mut file = File::open(&path).map_err(|e| e.to_string())?;
    let mut hasher = Sha1::new();
    let mut buf = [0u8; 8192];
    loop {
        let n = file.read(&mut buf).map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

#[tauri::command]
fn save_state(payload: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;
    std::fs::create_dir_all(&app_dir).ok();
    std::fs::write(app_dir.join("library.json"), payload).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_state(app_handle: tauri::AppHandle) -> Result<Option<String>, String> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;
    let file = app_dir.join("library.json");
    match std::fs::read_to_string(&file) {
        Ok(s) => Ok(Some(s)),
        Err(_) => Ok(None),
    }
}

#[tauri::command]
fn read_audio(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(path).map_err(|e| e.to_string())
}

// Update song metadata
#[tauri::command]
async fn update_song(
    state: State<'_, AppState>,
    payload: SongUpdate,
) -> Result<(), String> {
    // Extract all the data we need before any async operations
    let (song, app_handle_clone, album_id_for_cover) = {
        let db = state.db.lock().unwrap();
        let db = db.as_ref().ok_or("Database not initialized")?;

        // First, get the existing song to preserve unchanged fields
        let mut song = db.get_song_by_id(&payload.id)
            .map_err(|e| format!("Failed to get song: {}", e))?
            .ok_or("Song not found")?;

        // Update the song fields
        song.name = payload.name.clone();
        song.artist = payload.artist.clone();
        song.album = payload.album.clone();
        song.genre = Some(payload.genre.clone());
        song.year = payload.year.parse::<u32>().ok();

        // Handle artist update/creation
        match db.find_artist_by_name(&payload.artist) {
            Ok(Some(artist)) => {
                song.artist_id = Some(artist.id);
            }
            Ok(None) => {
                // Create new artist
                let artist = Artist {
                    id: music::generate_id(),
                    name: payload.artist.clone(),
                    genre: None,
                    bio: None,
                    image_path: None,
                    artwork_path: None,
                };
                db.insert_artist(&artist)
                    .map_err(|e| format!("Failed to insert artist: {}", e))?;
                song.artist_id = Some(artist.id);
            }
            Err(e) => return Err(format!("Database error: {}", e)),
        }

        // Handle album update/creation
        if let Some(artist_id) = &song.artist_id {
            match db.find_album_by_name_and_artist(&payload.album, artist_id) {
                Ok(Some(album)) => {
                    song.album_id = Some(album.id);
                }
                Ok(None) => {
                    // Create new album
                    let album = Album {
                        id: music::generate_id(),
                        name: payload.album.clone(),
                        artist_id: artist_id.clone(),
                        artist_name: payload.artist.clone(),
                        year: song.year,
                        cover_path: None,
                    };
                    db.insert_album(&album)
                        .map_err(|e| format!("Failed to insert album: {}", e))?;
                    song.album_id = Some(album.id);
                }
                Err(e) => return Err(format!("Database error: {}", e)),
            }
        }

        let app_handle_clone = state.app_handle.clone();
        let album_id_for_cover = song.album_id.clone();
        
        (song, app_handle_clone, album_id_for_cover)
    }; // Release the lock here before any async operations

    // Handle artwork if provided (this is async, so do it after releasing the lock)
    if let Some(artwork_base64) = payload.artwork {
        // Extract base64 data (remove data:image/jpeg;base64, prefix)
        let base64_data = artwork_base64
            .split(',')
            .nth(1)
            .ok_or("Invalid base64 image data")?;
        
        // Decode base64 using the new API
        use base64::{Engine as _, engine::general_purpose};
        let image_data = general_purpose::STANDARD
            .decode(base64_data)
            .map_err(|e| format!("Failed to decode base64: {}", e))?;
        
        // Save artwork file
        if let Some(album_id) = &album_id_for_cover {
            let cover_path = music::save_album_cover(
                &app_handle_clone,
                album_id,
                image_data,
                "jpg"
            ).await?;
            
            println!("🖼️ Saved album cover to: {}", cover_path);
            
            // Update album with cover path (need to re-acquire the lock)
            let db = state.db.lock().unwrap();
            let db = db.as_ref().ok_or("Database not initialized")?;
            
            if let Ok(Some(mut album)) = db.get_album_by_id(album_id) {
                album.cover_path = Some(cover_path.clone());
                db.update_album(&album)
                    .map_err(|e| format!("Failed to update album cover: {}", e))?;
                println!("✅ Updated album cover path in database");
            }
        }
    }

    // Update the song in the database (re-acquire the lock)
    {
        let db = state.db.lock().unwrap();
        let db = db.as_ref().ok_or("Database not initialized")?;
        db.update_song(&song)
            .map_err(|e| format!("Failed to update song: {}", e))?;
    }

    Ok(())
}

// Update playlist metadata - Uses camelCase
#[tauri::command]
async fn update_playlist(
    state: State<'_, AppState>,
    playlistId: String,  // camelCase
    name: String,
    description: Option<String>,
    color: Option<String>,
    artistId: Option<String>,  // camelCase
) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    
    println!("🎵 Updating playlist '{}' with artistId: {:?}", name, artistId);
    
    // Get existing playlist
    let mut playlist = db.get_playlist_by_id(&playlistId)
        .map_err(|e| format!("Failed to get playlist: {}", e))?
        .ok_or("Playlist not found")?;
    
    // Update fields
    playlist.name = name;
    playlist.description = description;
    playlist.color = color;
    playlist.artist_id = artistId;  // Update artist_id
    
    // Update in database
    db.update_playlist(&playlist)
        .map_err(|e| format!("Failed to update playlist: {}", e))?;
    
    println!("✅ Updated playlist with artist_id: {:?}", playlist.artist_id);
    
    Ok(())
}

// Update artist metadata - Uses camelCase
#[tauri::command]
async fn update_artist(
    state: State<'_, AppState>,
    artistId: String,  // camelCase
    name: String,
    genre: Option<String>,
    bio: Option<String>,
) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let db = db.as_ref().ok_or("Database not initialized")?;
    
    // Get existing artist
    let mut artist = db.get_artist_by_id(&artistId)
        .map_err(|e| format!("Failed to get artist: {}", e))?
        .ok_or("Artist not found")?;
    
    // Update fields
    artist.name = name;
    artist.genre = genre;
    artist.bio = bio;
    
    // Update in database
    db.update_artist(&artist)
        .map_err(|e| format!("Failed to update artist: {}", e))?;
    
    Ok(())
}

// Save sidebar configuration
#[tauri::command]
fn save_sidebar_config(
    state: State<'_, AppState>,
    config: SidebarConfig,
) -> Result<(), String> {
    let config_json = serde_json::to_string(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    let app_dir = state.app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;
    
    let config_path = app_dir.join("sidebar_config.json");
    std::fs::write(config_path, config_json)
        .map_err(|e| format!("Failed to save config: {}", e))?;
    
    Ok(())
}

// Load sidebar configuration
#[tauri::command]
fn load_sidebar_config(
    state: State<'_, AppState>,
) -> Result<Option<SidebarConfig>, String> {
    let app_dir = state.app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;
    
    let config_path = app_dir.join("sidebar_config.json");
    
    if !config_path.exists() {
        return Ok(None);
    }
    
    let config_json = std::fs::read_to_string(config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;
    
    let config: SidebarConfig = serde_json::from_str(&config_json)
        .map_err(|e| format!("Failed to parse config: {}", e))?;
    
    Ok(Some(config))
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Initialize database
            let db = init_database(&app.handle())?;
            let app_handle = app.handle();

            // Set up app state
            app.manage(AppState {
                db: Mutex::new(Some(db)),
                app_handle: app_handle.clone(),
            });

            // Ensure library directory structure exists
            music::ensure_library_structure(&app_handle)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            import_music_files,
            get_all_songs,
            get_all_songs_with_covers,
            get_all_artists,
            get_all_albums,
            get_all_playlists,
            create_artist,
            create_playlist,
            add_songs_to_playlist,
            remove_song_from_playlist,
            delete_song,
            delete_playlist,
            delete_artist,
            save_artist_image,
            save_playlist_artwork,
            scan_music_directory,
            hash_file,
            save_state,
            load_state,
            read_audio,
            update_song,
            update_playlist,
            update_artist,
            save_sidebar_config,
            load_sidebar_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}