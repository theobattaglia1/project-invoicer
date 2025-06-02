// src/utils/dragDropHelper.js

/**
 * createDragPayload(itemObj)
 *
 * Given an `itemObj` that represents a sidebar item (e.g.:
 *   { itemType: 'playlist', playlistId: 'abc123', label: 'My Playlist', … }
 * ), return a JSON string in the standard “sidebar-item” format:
 *
 *   JSON.stringify({
 *     type: 'sidebar-item',
 *     payload: { …itemObj… }
 *   })
 */
export function createDragPayload(itemObj) {
  if (!itemObj) return ''
  const envelope = {
    type: 'sidebar-item',
    payload: { ...itemObj }
  }
  try {
    return JSON.stringify(envelope)
  } catch (err) {
    console.error('Error stringifying drag payload:', err)
    return ''
  }
}

/**
 * parseDragPayload(rawString)
 *
 * Attempts to parse the `rawString` into JSON, and ensures `type === 'sidebar-item'`.
 * If valid, returns `envelope.payload`; otherwise returns null.
 */
export function parseDragPayload(rawString) {
  if (!rawString) return null
  try {
    const parsed = JSON.parse(rawString)
    if (parsed && parsed.type === 'sidebar-item' && parsed.payload) {
      return parsed.payload
    }
    return null
  } catch (err) {
    // If JSON.parse fails, return null
    return null
  }
}

/**
 * isDescendant(customPagesArray, sourceId, targetId)
 *
 * Walks up the parent chain of `targetId` inside `customPagesArray`.
 * Returns true if `sourceId` is an ancestor of `targetId` (to prevent circular nesting).
 * 
 * - customPagesArray: Array of page objects, each having at least { id, parentId }.
 * - sourceId: The ID of the folder/page being dragged.
 * - targetId: The ID of the folder/page being dropped onto.
 */
export function isDescendant(customPagesArray, sourceId, targetId) {
  if (!Array.isArray(customPagesArray) || !sourceId || !targetId) return false

  let current = customPagesArray.find((p) => p.id === targetId)
  while (current && current.parentId) {
    if (current.parentId === sourceId) {
      return true
    }
    current = customPagesArray.find((p) => p.id === current.parentId)
  }
  return false
}
