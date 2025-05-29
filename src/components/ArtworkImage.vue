<!-- ArtworkImage.vue - Reusable component for artwork display -->
<template>
    <div class="artwork-container">
      <img 
        v-if="resolvedSrc && !imageError"
        :src="resolvedSrc" 
        :alt="alt"
        @load="handleLoad"
        @error="handleError"
        class="artwork-image"
      />
      <div 
        v-else 
        class="artwork-placeholder"
        :style="{ background: placeholderGradient }"
      >
        <slot name="placeholder">
          <span v-if="placeholder">{{ placeholder }}</span>
          <svg v-else viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </slot>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, watch } from 'vue'
  import { convertFileSrc } from '@tauri-apps/api/tauri'
  
  const props = defineProps({
    src: String,
    alt: String,
    placeholder: String,
    type: {
      type: String,
      default: 'album' // 'album', 'artist', 'playlist'
    }
  })
  
  const imageError = ref(false)
  const imageLoaded = ref(false)
  
  // Generate different gradients based on type or content
  const placeholderGradient = computed(() => {
    const gradients = {
      album: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      artist: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
      playlist: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)'
    }
    
    // If placeholder text exists, use it to generate a consistent color
    if (props.placeholder) {
      const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
      ]
      const index = props.placeholder.charCodeAt(0) % colors.length
      return colors[index]
    }
    
    return gradients[props.type] || gradients.album
  })
  
  // Resolve the image source
  const resolvedSrc = computed(() => {
    if (!props.src) return null
    
    // If it's already a URL, return as-is
    if (props.src.startsWith('http://') || 
        props.src.startsWith('https://') || 
        props.src.startsWith('asset://')) {
      return props.src
    }
    
    // Convert local file path to Tauri asset URL
    try {
      return convertFileSrc(props.src)
    } catch (error) {
      console.error('Error converting src path:', error)
      return null
    }
  })
  
  const handleLoad = () => {
    imageLoaded.value = true
    imageError.value = false
  }
  
  const handleError = (e) => {
    console.error('Failed to load image:', e.target.src)
    imageError.value = true
    imageLoaded.value = false
  }
  
  // Reset error state when src changes
  watch(() => props.src, () => {
    imageError.value = false
    imageLoaded.value = false
  })
  </script>
  
  <style scoped>
  .artwork-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }
  
  .artwork-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .artwork-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 48px;
    font-weight: 700;
  }
  
  .artwork-placeholder svg {
    width: 40%;
    height: 40%;
    opacity: 0.8;
  }
  </style>