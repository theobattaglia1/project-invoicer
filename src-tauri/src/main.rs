// src-tauri/src/main.rs
#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::Manager;
use id3::{Tag, TagLike};
use rusqlite::{Connection, Result};
use std::sync::Mutex;

// Data structures
#[derive(Debug, Serialize, Deserialize)]
struct Artist {
  id: i64,
  name: String,
  image_path: Option<String>,
  created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Album {
  id: i64,
  name: String,
  artist_id: Option<i64>,
  cover_path: Option<String>,
  year: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Song {
  id: i64,
  title: String,
  artist: Option<String>,
  artist_id: Option<i64>,
  album: Option<String>,
  album_id: Option<i64>,
  file_path: String,
  duration: Option<i32>,
  track_number: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Playlist {
  id: i64,
  name: String,
  description: Option<String>,
  #[serde(rename = "type")]
  playlist_type: String,
  artist_id: Option<i64>,
  songs: Vec<i64>,
  created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ImportResult {
  success: Vec<Song>,
  failed: Vec<String>,
}

// State
struct AppState {
  db: Mutex<Connection>,
}

// Initialize database
fn init_database() -> Result<Connection> {
  let conn = Connection::open("music_library.db")?;
  
  conn.execute_batch(
      "
      CREATE TABLE IF NOT EXISTS artists (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          image_path TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS albums (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          artist_id INTEGER,
          cover_path TEXT,
          year INTEGER,
          FOREIGN KEY (artist_id) REFERENCES artists(id)
      );

      CREATE TABLE IF NOT EXISTS songs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          artist TEXT,
          artist_id INTEGER,
          album TEXT,
          album_id INTEGER,
          file_path TEXT NOT NULL UNIQUE,
          duration INTEGER,
          track_number INTEGER,
          FOREIGN KEY (artist_id) REFERENCES artists(id),
          FOREIGN KEY (album_id) REFERENCES albums(id)
      );

      CREATE TABLE IF NOT EXISTS playlists (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT DEFAULT 'general',
          artist_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (artist_id) REFERENCES artists(id)
      );

      CREATE TABLE IF NOT EXISTS playlist_songs (
          playlist_id INTEGER,
          song_id INTEGER,
          position INTEGER,
          PRIMARY KEY (playlist_id, song_id),
          FOREIGN KEY (playlist_id) REFERENCES playlists(id),
          FOREIGN KEY (song_id) REFERENCES songs(id)
      );
      "
  )?;
  
  Ok(conn)
}

// Commands
#[tauri::command]
fn scan_music_directory(path: String) -> Result<Vec<String>, String> {
  let path = Path::new(&path);
  if !path.exists() {
      return Err("Directory does not exist".to_string());
  }

  let mut files = Vec::new();
  scan_directory_recursive(path, &mut files);
  Ok(files)
}

fn scan_directory_recursive(dir: &Path, files: &mut Vec<String>) {
  if let Ok(entries) = fs::read_dir(dir) {
      for entry in entries.flatten() {
          let path = entry.path();
          if path.is_dir() {
              scan_directory_recursive(&path, files);
          } else if let Some(extension) = path.extension() {
              if matches!(
                  extension.to_str(),
                  Some("mp3") | Some("m4a") | Some("flac") | Some("wav") | Some("ogg")
              ) {
                  if let Some(path_str) = path.to_str() {
                      files.push(path_str.to_string());
                  }
              }
          }
      }
  }
}

#[tauri::command]
fn import_music_files(state: tauri::State<AppState>, files: Vec<String>) -> Result<ImportResult, String> {
  let mut success = Vec::new();
  let mut failed = Vec::new();
  
  let db = state.db.lock().unwrap();
  
  for file_path in files {
      match import_single_file(&db, &file_path) {
          Ok(song) => success.push(song),
          Err(e) => failed.push(format!("{}: {}", file_path, e)),
      }
  }
  
  Ok(ImportResult { success, failed })
}

fn import_single_file(conn: &Connection, file_path: &str) -> Result<Song, String> {
  // Read ID3 tags
  let tag = Tag::read_from_path(file_path).map_err(|e| e.to_string())?;
  
  let title = tag.title().unwrap_or("Unknown Title").to_string();
  let artist = tag.artist().map(|s| s.to_string());
  let album = tag.album().map(|s| s.to_string());
  let track_number = tag.track().map(|t| t as i32);
  let duration = tag.duration().map(|d| d as i32);
  
  // Insert or get artist
  let artist_id = if let Some(ref artist_name) = artist {
      conn.execute(
          "INSERT OR IGNORE INTO artists (name) VALUES (?1)",
          &[artist_name],
      ).map_err(|e| e.to_string())?;
      
      conn.query_row(
          "SELECT id FROM artists WHERE name = ?1",
          &[artist_name],
          |row| row.get(0),
      ).ok()
  } else {
      None
  };
  
  // Insert song
  conn.execute(
      "INSERT OR REPLACE INTO songs (title, artist, artist_id, album, file_path, duration, track_number) 
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
      &[
          &title as &dyn rusqlite::ToSql,
          &artist,
          &artist_id,
          &album,
          &file_path.to_string(),
          &duration,
          &track_number,
      ],
  ).map_err(|e| e.to_string())?;
  
  let song_id = conn.last_insert_rowid();
  
  Ok(Song {
      id: song_id,
      title,
      artist,
      artist_id,
      album,
      album_id: None,
      file_path: file_path.to_string(),
      duration,
      track_number,
  })
}

#[tauri::command]
fn get_artists(state: tauri::State<AppState>) -> Result<Vec<Artist>, String> {
  let conn = state.db.lock().unwrap();
  let mut stmt = conn.prepare("SELECT id, name, image_path, created_at FROM artists ORDER BY name")
      .map_err(|e| e.to_string())?;
  
  let artists = stmt.query_map([], |row| {
      Ok(Artist {
          id: row.get(0)?,
          name: row.get(1)?,
          image_path: row.get(2)?,
          created_at: row.get(3)?,
      })
  }).map_err(|e| e.to_string())?;
  
  artists.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_songs(state: tauri::State<AppState>) -> Result<Vec<Song>, String> {
  let conn = state.db.lock().unwrap();
  let mut stmt = conn.prepare(
      "SELECT id, title, artist, artist_id, album, album_id, file_path, duration, track_number 
       FROM songs ORDER BY title"
  ).map_err(|e| e.to_string())?;
  
  let songs = stmt.query_map([], |row| {
      Ok(Song {
          id: row.get(0)?,
          title: row.get(1)?,
          artist: row.get(2)?,
          artist_id: row.get(3)?,
          album: row.get(4)?,
          album_id: row.get(5)?,
          file_path: row.get(6)?,
          duration: row.get(7)?,
          track_number: row.get(8)?,
      })
  }).map_err(|e| e.to_string())?;
  
  songs.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_playlists(state: tauri::State<AppState>) -> Result<Vec<Playlist>, String> {
  let conn = state.db.lock().unwrap();
  let mut stmt = conn.prepare(
      "SELECT id, name, description, type, artist_id, created_at FROM playlists ORDER BY name"
  ).map_err(|e| e.to_string())?;
  
  let playlists = stmt.query_map([], |row| {
      let playlist_id: i64 = row.get(0)?;
      
      // Get songs for this playlist
      let mut song_stmt = conn.prepare(
          "SELECT song_id FROM playlist_songs WHERE playlist_id = ?1 ORDER BY position"
      ).unwrap();
      
      let songs: Vec<i64> = song_stmt.query_map(&[&playlist_id], |row| row.get(0))
          .unwrap()
          .filter_map(Result::ok)
          .collect();
      
      Ok(Playlist {
          id: playlist_id,
          name: row.get(1)?,
          description: row.get(2)?,
          playlist_type: row.get(3)?,
          artist_id: row.get(4)?,
          songs,
          created_at: row.get(5)?,
      })
  }).map_err(|e| e.to_string())?;
  
  playlists.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn create_artist(state: tauri::State<AppState>, data: serde_json::Value) -> Result<Artist, String> {
  let conn = state.db.lock().unwrap();
  
  let name = data["name"].as_str().ok_or("Name is required")?;
  let image_path = data["imagePath"].as_str();
  
  conn.execute(
      "INSERT INTO artists (name, image_path) VALUES (?1, ?2)",
      &[name, image_path.unwrap_or("")],
  ).map_err(|e| e.to_string())?;
  
  let artist_id = conn.last_insert_rowid();
  
  Ok(Artist {
      id: artist_id,
      name: name.to_string(),
      image_path: image_path.map(|s| s.to_string()),
      created_at: chrono::Utc::now().to_rfc3339(),
  })
}

#[tauri::command]
fn create_playlist(state: tauri::State<AppState>, data: serde_json::Value) -> Result<Playlist, String> {
  let conn = state.db.lock().unwrap();
  
  let name = data["name"].as_str().ok_or("Name is required")?;
  let description = data["description"].as_str();
  let playlist_type = data["type"].as_str().unwrap_or("general");
  let artist_id = data["artistId"].as_i64();
  
  conn.execute(
      "INSERT INTO playlists (name, description, type, artist_id) VALUES (?1, ?2, ?3, ?4)",
      &[
          &name as &dyn rusqlite::ToSql,
          &description,
          &playlist_type,
          &artist_id,
      ],
  ).map_err(|e| e.to_string())?;
  
  let playlist_id = conn.last_insert_rowid();
  
  Ok(Playlist {
      id: playlist_id,
      name: name.to_string(),
      description: description.map(|s| s.to_string()),
      playlist_type: playlist_type.to_string(),
      artist_id,
      songs: vec![],
      created_at: chrono::Utc::now().to_rfc3339(),
  })
}

#[tauri::command]
fn add_songs_to_playlist(
  state: tauri::State<AppState>, 
  playlist_id: i64, 
  song_ids: Vec<i64>
) -> Result<(), String> {
  let conn = state.db.lock().unwrap();
  
  // Get current max position
  let max_position: Option<i32> = conn.query_row(
      "SELECT MAX(position) FROM playlist_songs WHERE playlist_id = ?1",
      &[&playlist_id],
      |row| row.get(0),
  ).unwrap_or(None);
  
  let mut position = max_position.unwrap_or(0) + 1;
  
  for song_id in song_ids {
      conn.execute(
          "INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id, position) VALUES (?1, ?2, ?3)",
          &[&playlist_id, &song_id, &(position as i64)],
        ).map_err(|e| e.to_string())?;
      position += 1;
  }
  
  Ok(())
}

#[tauri::command]
async fn get_audio_url(path: String) -> Result<String, String> {
  // Convert file path to file:// URL for web audio API
  let path = Path::new(&path);
  if !path.exists() {
      return Err("File not found".to_string());
  }
  
  let url = format!("file://{}", path.to_str().unwrap());
  Ok(url)
}

fn main() {
  let db = init_database().expect("Failed to initialize database");
  let app_state = AppState {
      db: Mutex::new(db),
  };
  
  tauri::Builder::default()
      .manage(app_state)
      .invoke_handler(tauri::generate_handler![
          scan_music_directory,
          import_music_files,
          get_artists,
          get_songs,
          get_playlists,
          create_artist,
          create_playlist,
          add_songs_to_playlist,
          get_audio_url,
      ])
      .run(tauri::generate_context!())
      .expect("error while running tauri application");
}