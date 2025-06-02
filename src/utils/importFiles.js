// src/utils/importFiles.js

import { invoke } from '@tauri-apps/api/tauri'
import { useLibraryStore } from '@/store/library'
import { useToastStore } from '@/store/toast'

/**
 * importFiles(filePaths, options)
 *
 * Called when external files (e.g. via drag-drop) need to be imported.
 * - filePaths: array of absolute file paths (strings)
 * - options: { artistId?, playlistId? }
 *
 * After invoking the Tauri import command, if an artistId or playlistId
 * is passed, we automatically add the imported songs to that entity.
 */
export async function importFiles(filePaths, options = {}) {
  const { showToast } = useToastStore()
  const { refreshLibrary } = useLibraryStore()

  if (!filePaths || filePaths.length === 0) {
    return
  }

  try {
    // 1) Call the Tauri backend to import all the given file paths
    const result = await invoke('import_music_files', {
      file_paths: filePaths  // must match Rust side: "file_paths"
    })

    // 2) If import was successful or imported_count > 0, handle any post-import logic
    if (result.success || result.imported_count > 0) {
      // If we have an artistId in options, attach imported songs to that artist
      if (options.artistId && result.songs) {
        const songIds = result.songs.map((s) => s.id)
        await invoke('add_songs_to_artist', {
          artist_id: options.artistId,  // Rust expects "artist_id"
          song_ids: songIds             // Rust expects "song_ids"
        })
      }
      // If we have a playlistId in options, attach imported songs to that playlist
      else if (options.playlistId && result.songs) {
        const songIds = result.songs.map((s) => s.id)
        await invoke('add_songs_to_playlist', {
          playlist_id: options.playlistId, // Rust expects "playlist_id"
          song_ids: songIds                // Rust expects "song_ids"
        })
      }

      showToast({
        message: `Imported ${result.imported_count} song${result.imported_count > 1 ? 's' : ''}!`,
        type: 'success'
      })

      // Refresh library data (songs, artists, playlists, etc.)
      await refreshLibrary()
      return result
    } else {
      // If import failed gateway-side, show error
      showToast({
        message: `Import failed: ${result.errors?.join(', ') || 'Unknown error'}`,
        type: 'error'
      })
    }
  } catch (error) {
    // Catch any invocation error
    showToast({
      message: `Import failed: ${error}`,
      type: 'error'
    })
  }
}
