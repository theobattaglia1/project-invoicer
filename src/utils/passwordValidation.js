// src/utils/passwordValidation.js

export const passwordRequirements = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
}

export function validatePassword(password) {
  const errors = []
  
  if (!password || password.length < passwordRequirements.minLength) {
    errors.push(`Password must be at least ${passwordRequirements.minLength} characters long`)
  }
  
  if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (passwordRequirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (passwordRequirements.requireSpecialChars && 
      !new RegExp(`[${passwordRequirements.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  // Check for common patterns
  if (password && hasCommonPatterns(password)) {
    errors.push('Password contains common patterns. Please choose a more complex password')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  }
}

function hasCommonPatterns(password) {
  const commonPatterns = [
    /^(.)\1+$/,  // All same character
    /^(123|234|345|456|567|678|789|890)+/,  // Sequential numbers
    /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+/i,  // Sequential letters
    /^(password|admin|user|test|demo|example)/i,  // Common words
  ]
  
  return commonPatterns.some(pattern => pattern.test(password))
}

export function calculatePasswordStrength(password) {
  if (!password) return 0
  
  let strength = 0
  const length = password.length
  
  // Length contribution
  if (length >= 8) strength += 1
  if (length >= 12) strength += 1
  if (length >= 16) strength += 1
  
  // Character variety
  if (/[a-z]/.test(password)) strength += 1
  if (/[A-Z]/.test(password)) strength += 1
  if (/\d/.test(password)) strength += 1
  if (new RegExp(`[${passwordRequirements.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)) strength += 1
  
  // Penalty for common patterns
  if (hasCommonPatterns(password)) strength = Math.max(0, strength - 2)
  
  // Normalize to 0-100
  return Math.min(100, (strength / 7) * 100)
}

export function getPasswordStrengthLabel(strength) {
  if (strength < 20) return { label: 'Very Weak', color: 'text-red-600' }
  if (strength < 40) return { label: 'Weak', color: 'text-orange-600' }
  if (strength < 60) return { label: 'Fair', color: 'text-yellow-600' }
  if (strength < 80) return { label: 'Good', color: 'text-blue-600' }
  return { label: 'Strong', color: 'text-green-600' }
}

// Check if password has been compromised (using haveibeenpwned API)
export async function checkPasswordCompromised(password) {
  try {
    const crypto = window.crypto || window.msCrypto
    const msgBuffer = new TextEncoder().encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
    
    const prefix = hashHex.substring(0, 5)
    const suffix = hashHex.substring(5)
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)
    if (!response.ok) return false
    
    const text = await response.text()
    const hashes = text.split('\n')
    
    for (const hash of hashes) {
      const [hashSuffix, count] = hash.split(':')
      if (hashSuffix === suffix) {
        return parseInt(count) > 0
      }
    }
    
    return false
  } catch (error) {
    console.error('Error checking password compromise:', error)
    return false
  }
}