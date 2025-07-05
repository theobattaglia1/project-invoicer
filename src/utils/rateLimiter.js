// src/utils/rateLimiter.js

class RateLimiter {
  constructor() {
    this.attempts = new Map()
    this.blocked = new Map()
  }

  // Check if an action is allowed
  isAllowed(key, maxAttempts = 5, windowMs = 15 * 60 * 1000, blockDurationMs = 30 * 60 * 1000) {
    const now = Date.now()
    
    // Check if blocked
    const blockInfo = this.blocked.get(key)
    if (blockInfo && blockInfo.until > now) {
      return {
        allowed: false,
        retriesLeft: 0,
        blockedUntil: blockInfo.until,
        message: `Too many attempts. Please try again after ${new Date(blockInfo.until).toLocaleTimeString()}`
      }
    }
    
    // Clean up expired block
    if (blockInfo && blockInfo.until <= now) {
      this.blocked.delete(key)
    }
    
    // Get or initialize attempts
    let attemptInfo = this.attempts.get(key)
    if (!attemptInfo) {
      attemptInfo = {
        count: 0,
        firstAttempt: now,
        lastAttempt: now
      }
    }
    
    // Reset if window expired
    if (now - attemptInfo.firstAttempt > windowMs) {
      attemptInfo = {
        count: 0,
        firstAttempt: now,
        lastAttempt: now
      }
    }
    
    // Check if would exceed limit
    if (attemptInfo.count >= maxAttempts) {
      // Block the key
      this.blocked.set(key, {
        until: now + blockDurationMs,
        attempts: attemptInfo.count
      })
      this.attempts.delete(key)
      
      return {
        allowed: false,
        retriesLeft: 0,
        blockedUntil: now + blockDurationMs,
        message: `Too many attempts. Please try again after ${new Date(now + blockDurationMs).toLocaleTimeString()}`
      }
    }
    
    // Allow the attempt
    attemptInfo.count++
    attemptInfo.lastAttempt = now
    this.attempts.set(key, attemptInfo)
    
    return {
      allowed: true,
      retriesLeft: maxAttempts - attemptInfo.count,
      blockedUntil: null,
      message: null
    }
  }
  
  // Record a successful action (reset counter)
  recordSuccess(key) {
    this.attempts.delete(key)
    this.blocked.delete(key)
  }
  
  // Get current status
  getStatus(key) {
    const blockInfo = this.blocked.get(key)
    const attemptInfo = this.attempts.get(key)
    
    return {
      isBlocked: blockInfo && blockInfo.until > Date.now(),
      blockedUntil: blockInfo?.until,
      attemptCount: attemptInfo?.count || 0
    }
  }
  
  // Clear all data for a key
  clear(key) {
    this.attempts.delete(key)
    this.blocked.delete(key)
  }
  
  // Clear all data
  clearAll() {
    this.attempts.clear()
    this.blocked.clear()
  }
}

// Create singleton instances for different purposes
export const authRateLimiter = new RateLimiter()
export const apiRateLimiter = new RateLimiter()

// Vue composable
export function useRateLimiter(limiter = authRateLimiter) {
  return {
    checkLimit: (key, maxAttempts, windowMs, blockDurationMs) => 
      limiter.isAllowed(key, maxAttempts, windowMs, blockDurationMs),
    recordSuccess: (key) => limiter.recordSuccess(key),
    getStatus: (key) => limiter.getStatus(key),
    clear: (key) => limiter.clear(key)
  }
}