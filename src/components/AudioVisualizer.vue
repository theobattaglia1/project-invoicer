<!-- components/AudioVisualizer.vue - Simple Audio Visualization -->
<template>
    <div class="audio-visualizer">
      <canvas ref="canvas" :width="width" :height="height"></canvas>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  
  const props = defineProps({
    audioEngine: {
      type: Object,
      required: true
    }
  })
  
  const canvas = ref(null)
  const width = 800
  const height = 100
  let ctx = null
  let animationId = null
  
  const draw = () => {
    if (!ctx) return
    
    // Get frequency data
    const frequencyData = props.audioEngine.getFrequencyData()
    const bufferLength = frequencyData.length
    
    // Clear canvas
    ctx.fillStyle = 'rgba(10, 10, 11, 0.2)'
    ctx.fillRect(0, 0, width, height)
    
    // Draw frequency bars
    const barWidth = (width / bufferLength) * 2.5
    let barHeight
    let x = 0
    
    for (let i = 0; i < bufferLength; i++) {
      barHeight = (frequencyData[i] / 255) * height * 0.8
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height)
      gradient.addColorStop(0, '#FF6B6B')
      gradient.addColorStop(0.5, '#4ECDC4')
      gradient.addColorStop(1, '#45B7D1')
      
      ctx.fillStyle = gradient
      ctx.fillRect(x, height - barHeight, barWidth, barHeight)
      
      x += barWidth + 1
    }
    
    animationId = requestAnimationFrame(draw)
  }
  
  onMounted(() => {
    if (canvas.value) {
      ctx = canvas.value.getContext('2d')
      draw()
    }
  })
  
  onUnmounted(() => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
  })
  </script>
  
  <style scoped>
  .audio-visualizer {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    height: 100px;
    background: rgba(10, 10, 11, 0.95);
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }
  
  canvas {
    width: 100%;
    height: 100%;
  }
  </style>