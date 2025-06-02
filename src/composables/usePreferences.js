// src/composables/usePreferences.js
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'appPreferences'

// ─── 1) DEFAULT GLOBAL PREFERENCES ─────────────────────────────────────────────
const defaultGlobal = {
  // Default fonts (you can change these to whatever you like)
  headerFont: {
    family: 'Arial, sans-serif',
    size:   '24px',
    weight: '600',
    lineHeight: '1.2'
  },
  bodyFont: {
    family: 'Arial, sans-serif',
    size:   '16px',
    weight: '400',
    lineHeight: '1.5'
  },

  // Extra toggles
  hideImages:   false,
  bgColor:      '#000000',       // background color for content area
  accentColor:  '#1DB954',       // accent (e.g. highlight, link, button) color
  compactMode:  false,           // if true, use tighter padding/margins

  // Custom uploaded fonts (each entry: { name, dataUrl, format })
  customFonts: []
}

// ─── 2) LOAD FROM localStorage OR FALL BACK TO DEFAULT ───────────────────────────
function loadStored() {
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    if (json) return JSON.parse(json)
  } catch (e) {
    console.error('Failed to parse stored preferences:', e)
  }
  // If nothing stored, start with just global
  return { global: defaultGlobal }
}

// ─── 3) CREATE THE REACTIVE PREFERENCES OBJECT ──────────────────────────────────
export function usePreferences() {
  // Reactive “preferences” entire object
  // Shape:
  // {
  //   global: { headerFont, bodyFont, hideImages, bgColor, accentColor, compactMode, customFonts },
  //   'all-songs': {...},    // optional override for the All Songs view
  //   'artists': {...},      // optional override for the Artists view
  //   'artist-profile': {...},
  //   'playlists': {...},
  //   'playlist': {...},
  //   'home': {...},
  //   ...etc...
  // }
  const preferences = ref(loadStored())

  // Persist on any change
  watch(
    preferences,
    (newVal) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal))
      } catch (e) {
        console.error('Failed to save preferences to localStorage:', e)
      }
    },
    { deep: true }
  )

  // ─── 4) HELPERS ───────────────────────────────────────────────────────────────

  /**
   * Returns a computed object containing “merged” settings for a given viewName.
   * If preferences.value[viewName] exists, any field not present there falls back to global.
   * We also expose the array of registered customFonts (always from global).
   */
  function getForView(viewName) {
    return computed(() => {
      const raw = preferences.value[viewName] || {}
      const global = preferences.value.global || defaultGlobal

      return {
        headerFont: {
          family: raw.headerFont?.family   || global.headerFont.family,
          size:   raw.headerFont?.size     || global.headerFont.size,
          weight: raw.headerFont?.weight   || global.headerFont.weight,
          lineHeight: raw.headerFont?.lineHeight || global.headerFont.lineHeight
        },
        bodyFont: {
          family: raw.bodyFont?.family     || global.bodyFont.family,
          size:   raw.bodyFont?.size       || global.bodyFont.size,
          weight: raw.bodyFont?.weight     || global.bodyFont.weight,
          lineHeight: raw.bodyFont?.lineHeight   || global.bodyFont.lineHeight
        },
        hideImages: raw.hideImages != null ? raw.hideImages : global.hideImages,
        bgColor:    raw.bgColor    || global.bgColor,
        accentColor: raw.accentColor || global.accentColor,
        compactMode: raw.compactMode != null ? raw.compactMode : global.compactMode,
        customFonts: global.customFonts || []
      }
    })
  }

  /**
   * Merge-in new partial prefs for a particular viewName. 
   * If viewName key doesn’t exist, we create it.
   */
  function setPagePreferences(viewName, newPrefs) {
    if (!preferences.value[viewName]) {
      preferences.value[viewName] = {}
    }
    // Shallow-merge at top level
    Object.assign(preferences.value[viewName], newPrefs)
  }

  /**
   * Replace or merge the global block.
   */
  function setGlobalPreferences(newGlobal) {
    preferences.value.global = {
      ...preferences.value.global,
      ...newGlobal
    }
  }

  /**
   * Register a new custom font. We push it onto global.customFonts.
   * `fontObj` must be: { name: string, dataUrl: string, format: string }
   *   e.g. { name: 'MyFont', dataUrl: 'data:font/ttf;base64,…', format: 'truetype' }
   */
  function addCustomFont(fontObj) {
    if (!preferences.value.global.customFonts) {
      preferences.value.global.customFonts = []
    }
    preferences.value.global.customFonts.push(fontObj)
  }

  return {
    preferences,
    getForView,
    setPagePreferences,
    setGlobalPreferences,
    addCustomFont
  }
}
