use crate::music::{Album, Artist, Playlist, Song};
use rusqlite::{params, Connection, Result, OptionalExtension};
use std::path::Path;

pub struct Database {
    pub conn: Connection,
}

impl Database {
    pub fn new(db_path: &Path) -> Result<Self> {
        let conn = Connection::open(db_path)?;

        // Run migrations first
        Self::run_migrations(&conn)?;

        // Create tables
        conn.execute(
            "CREATE TABLE IF NOT EXISTS songs (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                artist TEXT NOT NULL,
                album TEXT NOT NULL,
                duration REAL NOT NULL,
                path TEXT NOT NULL UNIQUE,
                genre TEXT,
                year INTEGER,
                track_number INTEGER,
                artist_id TEXT,
                album_id TEXT,
                date_added TEXT NOT NULL,
                play_count INTEGER DEFAULT 0,
                last_played TEXT
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS artists (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                genre TEXT,
                bio TEXT,
                image_path TEXT,
                artwork_path TEXT
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
                UNIQUE(name, artist_id)
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS playlists (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                color TEXT,
                artwork_path TEXT,
                artist_id TEXT,
                date_created TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS playlist_songs (
                playlist_id TEXT NOT NULL,
                song_id TEXT NOT NULL,
                position INTEGER,
                PRIMARY KEY (playlist_id, song_id),
                FOREIGN KEY (playlist_id) REFERENCES playlists(id),
                FOREIGN KEY (song_id) REFERENCES songs(id)
            )",
            [],
        )?;

        // Create indexes
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_songs_artist_id ON songs(artist_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_songs_album_id ON songs(album_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_albums_artist_id ON albums(artist_id)",
            [],
        )?;

        Ok(Database { conn })
    }

    // Run database migrations to update schema
    fn run_migrations(conn: &Connection) -> Result<()> {
        // Check if bio column exists in artists table
        let mut stmt = conn.prepare("PRAGMA table_info(artists)")?;
        let columns: Vec<String> = stmt
            .query_map([], |row| row.get::<_, String>(1))?
            .collect::<Result<Vec<_>>>()?;
        
        if !columns.contains(&"bio".to_string()) {
            println!("Migrating database: Adding bio column to artists table");
            conn.execute("ALTER TABLE artists ADD COLUMN bio TEXT", [])?;
        }
        
        if !columns.contains(&"artwork_path".to_string()) {
            println!("Migrating database: Adding artwork_path column to artists table");
            conn.execute("ALTER TABLE artists ADD COLUMN artwork_path TEXT", [])?;
        }

        // Check if artwork_path column exists in playlists table
        let mut stmt = conn.prepare("PRAGMA table_info(playlists)")?;
        let columns: Vec<String> = stmt
            .query_map([], |row| row.get::<_, String>(1))?
            .collect::<Result<Vec<_>>>()?;
        
        if !columns.contains(&"artwork_path".to_string()) {
            println!("Migrating database: Adding artwork_path column to playlists table");
            conn.execute("ALTER TABLE playlists ADD COLUMN artwork_path TEXT", [])?;
        }
        
        if !columns.contains(&"artist_id".to_string()) {
            println!("Migrating database: Adding artist_id column to playlists table");
            conn.execute("ALTER TABLE playlists ADD COLUMN artist_id TEXT", [])?;
        }

        Ok(())
    }

    // Song operations
    pub fn insert_song(&self, song: &Song) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO songs (
                id, name, artist, album, duration, path, genre, year, 
                track_number, artist_id, album_id, date_added, play_count, last_played
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
            params![
                song.id,
                song.name,
                song.artist,
                song.album,
                song.duration,
                song.path,
                song.genre,
                song.year,
                song.track_number,
                song.artist_id,
                song.album_id,
                song.date_added,
                song.play_count,
                song.last_played
            ],
        )?;
        Ok(())
    }

    pub fn get_all_songs(&self) -> Result<Vec<Song>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, artist, album, duration, path, genre, year, 
             track_number, artist_id, album_id, date_added, play_count, last_played 
             FROM songs ORDER BY artist, album, track_number",
        )?;

        let songs = stmt
            .query_map([], |row| {
                Ok(Song {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    artist: row.get(2)?,
                    album: row.get(3)?,
                    duration: row.get(4)?,
                    path: row.get(5)?,
                    genre: row.get(6)?,
                    year: row.get(7)?,
                    track_number: row.get(8)?,
                    artist_id: row.get(9)?,
                    album_id: row.get(10)?,
                    date_added: row.get(11)?,
                    play_count: row.get(12)?,
                    last_played: row.get(13)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(songs)
    }

    pub fn get_song_by_id(&self, id: &str) -> Result<Option<Song>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, artist, album, duration, path, genre, year, 
             track_number, artist_id, album_id, date_added, play_count, last_played 
             FROM songs WHERE id = ?1",
        )?;

        let song = stmt
            .query_row([id], |row| {
                Ok(Song {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    artist: row.get(2)?,
                    album: row.get(3)?,
                    duration: row.get(4)?,
                    path: row.get(5)?,
                    genre: row.get(6)?,
                    year: row.get(7)?,
                    track_number: row.get(8)?,
                    artist_id: row.get(9)?,
                    album_id: row.get(10)?,
                    date_added: row.get(11)?,
                    play_count: row.get(12)?,
                    last_played: row.get(13)?,
                })
            })
            .optional()?;

        Ok(song)
    }

    pub fn update_song(&self, song: &Song) -> Result<()> {
        self.conn.execute(
            "UPDATE songs SET name = ?1, artist = ?2, album = ?3, genre = ?4, 
             year = ?5, artist_id = ?6, album_id = ?7 WHERE id = ?8",
            params![
                song.name,
                song.artist,
                song.album,
                song.genre,
                song.year,
                song.artist_id,
                song.album_id,
                song.id
            ],
        )?;
        Ok(())
    }

    pub fn delete_song(&self, id: &str) -> Result<()> {
        // First remove from all playlists
        self.conn.execute(
            "DELETE FROM playlist_songs WHERE song_id = ?1",
            [id],
        )?;
        
        // Then delete the song
        self.conn.execute("DELETE FROM songs WHERE id = ?1", [id])?;
        Ok(())
    }

    // Artist operations
    pub fn insert_artist(&self, artist: &Artist) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO artists (id, name, genre, bio, image_path, artwork_path) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                artist.id,
                artist.name,
                artist.genre,
                artist.bio,
                artist.image_path,
                artist.artwork_path
            ],
        )?;
        Ok(())
    }

    pub fn get_all_artists(&self) -> Result<Vec<Artist>> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, name, genre, bio, image_path, artwork_path FROM artists ORDER BY name")?;

        let artists = stmt
            .query_map([], |row| {
                Ok(Artist {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    genre: row.get(2)?,
                    bio: row.get(3)?,
                    image_path: row.get(4)?,
                    artwork_path: row.get(5)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(artists)
    }

    pub fn find_artist_by_name(&self, name: &str) -> Result<Option<Artist>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, genre, bio, image_path, artwork_path FROM artists WHERE name = ?1",
        )?;

        let artist = stmt
            .query_row([name], |row| {
                Ok(Artist {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    genre: row.get(2)?,
                    bio: row.get(3)?,
                    image_path: row.get(4)?,
                    artwork_path: row.get(5)?,
                })
            })
            .optional()?;

        Ok(artist)
    }

    pub fn get_artist_by_id(&self, id: &str) -> Result<Option<Artist>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, genre, bio, image_path, artwork_path FROM artists WHERE id = ?1"
        )?;
        
        let artist = stmt.query_row([id], |row| {
            Ok(Artist {
                id: row.get(0)?,
                name: row.get(1)?,
                genre: row.get(2)?,
                bio: row.get(3)?,
                image_path: row.get(4)?,
                artwork_path: row.get(5)?,
            })
        }).optional()?;
        
        Ok(artist)
    }

    pub fn update_artist(&self, artist: &Artist) -> Result<()> {
        self.conn.execute(
            "UPDATE artists SET name = ?1, genre = ?2, bio = ?3, image_path = ?4, artwork_path = ?5 WHERE id = ?6",
            params![
                artist.name,
                artist.genre,
                artist.bio,
                artist.image_path,
                artist.artwork_path,
                artist.id
            ],
        )?;
        Ok(())
    }

    pub fn delete_artist(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM artists WHERE id = ?1", [id])?;
        Ok(())
    }

    // Album operations
    pub fn insert_album(&self, album: &Album) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO albums (id, name, artist_id, artist_name, year, cover_path) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                album.id,
                album.name,
                album.artist_id,
                album.artist_name,
                album.year,
                album.cover_path
            ],
        )?;
        Ok(())
    }

    pub fn get_all_albums(&self) -> Result<Vec<Album>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, artist_id, artist_name, year, cover_path 
             FROM albums ORDER BY artist_name, year, name",
        )?;

        let albums = stmt
            .query_map([], |row| {
                Ok(Album {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    artist_id: row.get(2)?,
                    artist_name: row.get(3)?,
                    year: row.get(4)?,
                    cover_path: row.get(5)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        Ok(albums)
    }

    pub fn find_album_by_name_and_artist(
        &self,
        name: &str,
        artist_id: &str,
    ) -> Result<Option<Album>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, artist_id, artist_name, year, cover_path 
             FROM albums WHERE name = ?1 AND artist_id = ?2",
        )?;

        let album = stmt
            .query_row([name, artist_id], |row| {
                Ok(Album {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    artist_id: row.get(2)?,
                    artist_name: row.get(3)?,
                    year: row.get(4)?,
                    cover_path: row.get(5)?,
                })
            })
            .optional()?;

        Ok(album)
    }

    pub fn get_album_by_id(&self, id: &str) -> Result<Option<Album>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, artist_id, artist_name, year, cover_path 
             FROM albums WHERE id = ?1",
        )?;

        let album = stmt
            .query_row([id], |row| {
                Ok(Album {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    artist_id: row.get(2)?,
                    artist_name: row.get(3)?,
                    year: row.get(4)?,
                    cover_path: row.get(5)?,
                })
            })
            .optional()?;

        Ok(album)
    }

    pub fn update_album(&self, album: &Album) -> Result<()> {
        self.conn.execute(
            "UPDATE albums SET name = ?1, artist_id = ?2, artist_name = ?3, 
             year = ?4, cover_path = ?5 WHERE id = ?6",
            params![
                album.name,
                album.artist_id,
                album.artist_name,
                album.year,
                album.cover_path,
                album.id
            ],
        )?;
        Ok(())
    }

    // Playlist operations - FIXED to include artist_id
    pub fn insert_playlist(&self, playlist: &Playlist) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO playlists (id, name, description, color, artwork_path, artist_id, date_created) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                playlist.id,
                playlist.name,
                playlist.description,
                playlist.color,
                playlist.artwork_path,
                playlist.artist_id,
                playlist.date_created
            ],
        )?;
        Ok(())
    }

    pub fn get_all_playlists(&self) -> Result<Vec<Playlist>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, description, color, artwork_path, artist_id, date_created 
             FROM playlists ORDER BY name",
        )?;

        let mut playlists = Vec::new();
        let playlist_rows = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,    // id
                    row.get::<_, String>(1)?,    // name
                    row.get::<_, Option<String>>(2)?, // description
                    row.get::<_, Option<String>>(3)?, // color
                    row.get::<_, Option<String>>(4)?, // artwork_path
                    row.get::<_, Option<String>>(5)?, // artist_id - FIXED!
                    row.get::<_, String>(6)?,    // date_created
                ))
            })?
            .collect::<Result<Vec<_>>>()?;

        for (id, name, description, color, artwork_path, artist_id, date_created) in playlist_rows {
            // Get song IDs for this playlist
            let mut song_stmt = self.conn.prepare(
                "SELECT song_id FROM playlist_songs WHERE playlist_id = ?1 ORDER BY position",
            )?;
            let song_ids: Vec<String> = song_stmt
                .query_map([&id], |row| row.get(0))?
                .collect::<Result<Vec<_>>>()?;

            playlists.push(Playlist {
                id,
                name,
                description,
                color,
                artwork_path,
                song_ids,
                artist_id,  // Include artist_id!
                date_created,
            });
        }

        Ok(playlists)
    }

    pub fn get_playlist_by_id(&self, id: &str) -> Result<Option<Playlist>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, description, color, artwork_path, artist_id, date_created 
             FROM playlists WHERE id = ?1"
        )?;
        
        let playlist_data = stmt.query_row([id], |row| {
            Ok((
                row.get::<_, String>(0)?,    // id
                row.get::<_, String>(1)?,    // name
                row.get::<_, Option<String>>(2)?, // description
                row.get::<_, Option<String>>(3)?, // color
                row.get::<_, Option<String>>(4)?, // artwork_path
                row.get::<_, Option<String>>(5)?, // artist_id - FIXED!
                row.get::<_, String>(6)?,    // date_created
            ))
        }).optional()?;
        
        if let Some((id, name, description, color, artwork_path, artist_id, date_created)) = playlist_data {
            // Get song IDs for this playlist
            let mut song_stmt = self.conn.prepare(
                "SELECT song_id FROM playlist_songs WHERE playlist_id = ?1 ORDER BY position"
            )?;
            let song_ids: Vec<String> = song_stmt
                .query_map([&id], |row| row.get(0))?
                .collect::<Result<Vec<_>>>()?;
            
            Ok(Some(Playlist {
                id,
                name,
                description,
                color,
                artwork_path,
                song_ids,
                artist_id,  // Include artist_id!
                date_created,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn update_playlist(&self, playlist: &Playlist) -> Result<()> {
        self.conn.execute(
            "UPDATE playlists SET name = ?1, description = ?2, color = ?3, artwork_path = ?4, artist_id = ?5 
             WHERE id = ?6",
            params![
                playlist.name,
                playlist.description,
                playlist.color,
                playlist.artwork_path,
                playlist.artist_id,  // Include artist_id!
                playlist.id
            ],
        )?;
        Ok(())
    }

    pub fn delete_playlist(&self, id: &str) -> Result<()> {
        // First delete all song associations
        self.conn.execute(
            "DELETE FROM playlist_songs WHERE playlist_id = ?1",
            [id],
        )?;
        
        // Then delete the playlist
        self.conn.execute(
            "DELETE FROM playlists WHERE id = ?1",
            [id],
        )?;
        
        Ok(())
    }

    pub fn add_song_to_playlist(&self, playlist_id: &str, song_id: &str) -> Result<()> {
        // Get the next position
        let position: Option<i32> = self.conn.query_row(
            "SELECT MAX(position) FROM playlist_songs WHERE playlist_id = ?1",
            [playlist_id],
            |row| row.get(0),
        )?;

        let next_position = position.unwrap_or(-1) + 1;

        self.conn.execute(
            "INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id, position) VALUES (?1, ?2, ?3)",
            params![playlist_id, song_id, next_position],
        )?;
        Ok(())
    }

    pub fn remove_song_from_playlist(&self, playlist_id: &str, song_id: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM playlist_songs WHERE playlist_id = ?1 AND song_id = ?2",
            params![playlist_id, song_id],
        )?;
        Ok(())
    }
}