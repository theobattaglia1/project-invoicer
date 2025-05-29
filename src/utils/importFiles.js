// src/utils/importFiles.js
import { invoke } from '@tauri-apps/api/tauri'
import { useLibraryStore } from '@/store/library'
import { useToastStore } from '@/store/toast'

export async function importFiles(filePaths, options = {}) {
  const { showToast } = useToastStore()
  const { refreshLibrary } = useLibraryStore()
  
  if (!filePaths || filePaths.length === 0) return
  
  try {
    // Import the files
    const result = await invoke('import_music_files', { 
      file_paths: filePaths  // Fixed: snake_case
    })
    
    if (result.success || result.imported_count > 0) {
      // If we have a specific target (artist or playlist), add the songs
      if (options.artistId && result.songs) {
        const songIds = result.songs.map(s => s.id)
        await invoke('add_songs_to_artist', { 
          artist_id: options.artistId,  // Fixed: snake_case
          song_ids: songIds             // Fixed: snake_case
        })
      } else if (options.playlistId && result.songs) {
        const songIds = result.songs.map(s => s.id)
        await invoke('add_songs_to_playlist', { 
          playlist_id: options.playlistId,  // Fixed: snake_case
          song_ids: songIds                 // Fixed: snake_case
        })
      }
      
      showToast({ 
        message: `Imported ${result.imported_count} songs!`, 
        type: 'success' 
      })
      
      await refreshLibrary()
      return result
    } else {
      showToast({ 
        message: `Import failed: ${result.errors.join(', ')}`, 
        type: 'error' 
      })
    }
  } catch (error) {
    showToast({ 
      message: `Import failed: ${error}`, 
      type: 'error' 
    })
  }
}