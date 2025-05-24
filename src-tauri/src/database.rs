use rusqlite::{Connection, Result};
use crate::music::{Song, Artist, Album, Playlist};
use std::path::Path;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(db_path: &Path) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        
        // Create tables
        conn.execute(
            "CREATE TABLE IF NOT EXISTS artists (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                genre TEXT,
                image_path TEXT
            )",
            [],
        )?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS albums (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                artist_id TEXT NOT NULL,
                artist_name TEXT NOT NULL,
                year INTEGER,
                cover_path TEXT,
                FOREIGN KEY (artist_id) REFERENCES artists (id)
            )",
            [],
        )?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS songs (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                artist TEXT NOT NULL,
                artist_id TEXT,
                album TEXT NOT NULL,
                album_id TEXT,
                duration INTEGER NOT NULL,
                path TEXT NOT NULL UNIQUE,
                file_size INTEGER NOT NULL,
                format TEXT NOT NULL,
                date_added TEXT NOT NULL,
                FOREIGN KEY (artist_id) REFERENCES artists (id),
                FOREIGN KEY (album_id) REFERENCES albums (id)
            )",
            [],
        )?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS playlists (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                color TEXT,
                date_created TEXT NOT NULL
            )",
            [],
        )?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS playlist_songs (
                playlist_id TEXT NOT NULL,
                song_id TEXT NOT NULL,
                position INTEGER NOT NULL,
                PRIMARY KEY (playlist_id, song_id),
                FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE,
                FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE
            )",
            [],
        )?;
        
        // Create indexes
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs (artist)",
            [],
        )?;
        
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_songs_album ON songs (album)",
            [],
        )?;
        
        Ok(Database { conn })
    }
    
    // Song operations
    pub fn insert_song(&self, song: &Song) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO songs (id, title, artist, artist_id, album, album_id, duration, path, file_size, format, date_added)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            rusqlite::params![
                &song.id,
                &song.title,
                &song.artist,
                &song.artist_id.as_ref(),
                &song.album,
                &song.album_id.as_ref(),
                &song.duration,
                &song.path,
                &song.file_size,
                &song.format,
                &song.date_added,
            ],
        )?;
        Ok(())
    }
    
    pub fn get_all_songs(&self) -> Result<Vec<Song>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, artist, artist_id, album, album_id, duration, path, file_size, format, date_added 
             FROM songs ORDER BY title"
        )?;
        
        let songs = stmt.query_map([], |row| {
            Ok(Song {
                id: row.get(0)?,
                title: row.get(1)?,
                artist: row.get(2)?,
                artist_id: row.get(3)?,
                album: row.get(4)?,
                album_id: row.get(5)?,
                duration: row.get(6)?,
                path: row.get(7)?,
                file_size: row.get(8)?,
                format: row.get(9)?,
                date_added: row.get(10)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;
        
        Ok(songs)
    }
    
    pub fn delete_song(&self, song_id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM songs WHERE id = ?1", [song_id])?;
        Ok(())
    }
    
    // Artist operations
    pub fn insert_artist(&self, artist: &Artist) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO artists (id, name, genre, image_path)
             VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![
                &artist.id, 
                &artist.name, 
                &artist.genre.as_ref(), 
                &artist.image_path.as_ref()
            ],
        )?;
        Ok(())
    }
    
    pub fn get_all_artists(&self) -> Result<Vec<Artist>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, genre, image_path FROM artists ORDER BY name"
        )?;
        
        let artists = stmt.query_map([], |row| {
            Ok(Artist {
                id: row.get(0)?,
                name: row.get(1)?,
                genre: row.get(2)?,
                image_path: row.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;
        
        Ok(artists)
    }
    
    pub fn find_artist_by_name(&self, name: &str) -> Result<Option<Artist>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, genre, image_path FROM artists WHERE LOWER(name) = LOWER(?1)"
        )?;
        
        let mut artists = stmt.query_map([name], |row| {
            Ok(Artist {
                id: row.get(0)?,
                name: row.get(1)?,
                genre: row.get(2)?,
                image_path: row.get(3)?,
            })
        })?;
        
        match artists.next() {
            Some(artist) => Ok(Some(artist?)),
            None => Ok(None),
        }
    }
    
    // Album operations
    pub fn insert_album(&self, album: &Album) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO albums (id, name, artist_id, artist_name, year, cover_path)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                &album.id,
                &album.name,
                &album.artist_id,
                &album.artist_name,
                &album.year,
                &album.cover_path.as_ref(),
            ],
        )?;
        Ok(())
    }
    
    pub fn find_album_by_name_and_artist(&self, name: &str, artist_id: &str) -> Result<Option<Album>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, artist_id, artist_name, year, cover_path 
             FROM albums WHERE LOWER(name) = LOWER(?1) AND artist_id = ?2"
        )?;
        
        let mut albums = stmt.query_map([name, artist_id], |row| {
            Ok(Album {
                id: row.get(0)?,
                name: row.get(1)?,
                artist_id: row.get(2)?,
                artist_name: row.get(3)?,
                year: row.get(4)?,
                cover_path: row.get(5)?,
            })
        })?;
        
        match albums.next() {
            Some(album) => Ok(Some(album?)),
            None => Ok(None),
        }
    }
    
    // Playlist operations
    pub fn insert_playlist(&self, playlist: &Playlist) -> Result<()> {
        let tx = self.conn.unchecked_transaction()?;
        
        tx.execute(
            "INSERT OR REPLACE INTO playlists (id, name, description, color, date_created)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![
                &playlist.id,
                &playlist.name,
                &playlist.description.as_ref(),
                &playlist.color.as_ref(),
                &playlist.date_created,
            ],
        )?;
        
        // Clear existing songs for this playlist
        tx.execute("DELETE FROM playlist_songs WHERE playlist_id = ?1", [&playlist.id])?;
        
        // Insert songs
        for (position, song_id) in playlist.song_ids.iter().enumerate() {
            tx.execute(
                "INSERT INTO playlist_songs (playlist_id, song_id, position)
                 VALUES (?1, ?2, ?3)",
                rusqlite::params![&playlist.id, song_id, &position],
            )?;
        }
        
        tx.commit()?;
        Ok(())
    }
    
    pub fn get_all_playlists(&self) -> Result<Vec<Playlist>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, description, color, date_created FROM playlists ORDER BY name"
        )?;
        
        let mut playlists = Vec::new();
        
        for playlist_result in stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,  // id
                row.get::<_, String>(1)?,  // name
                row.get::<_, Option<String>>(2)?,  // description
                row.get::<_, Option<String>>(3)?,  // color
                row.get::<_, String>(4)?,  // date_created
            ))
        })? {
            let (id, name, description, color, date_created) = playlist_result?;
            
            // Get songs for this playlist
            let mut song_stmt = self.conn.prepare(
                "SELECT song_id FROM playlist_songs 
                 WHERE playlist_id = ?1 
                 ORDER BY position"
            )?;
            
            let song_ids: Vec<String> = song_stmt.query_map([&id], |row| {
                row.get(0)
            })?
            .collect::<Result<Vec<_>>>()?;
            
            playlists.push(Playlist {
                id,
                name,
                description,
                color,
                song_ids,
                date_created,
            });
        }
        
        Ok(playlists)
    }
    
    pub fn add_song_to_playlist(&self, playlist_id: &str, song_id: &str) -> Result<()> {
        // Get the next position
        let position: i32 = self.conn.query_row(
            "SELECT COALESCE(MAX(position), -1) + 1 FROM playlist_songs WHERE playlist_id = ?1",
            [playlist_id],
            |row| row.get(0),
        )?;
        
        self.conn.execute(
            "INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id, position)
             VALUES (?1, ?2, ?3)",
            rusqlite::params![playlist_id, song_id, &position],
        )?;
        
        Ok(())
    }
    
    pub fn remove_song_from_playlist(&self, playlist_id: &str, song_id: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM playlist_songs WHERE playlist_id = ?1 AND song_id = ?2",
            [playlist_id, song_id],
        )?;
        Ok(())
    }
}