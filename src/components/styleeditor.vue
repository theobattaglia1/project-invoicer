<template>
    <div v-if="isVisible" class="style-editor">
      <div class="editor-header">
        <h3>Style Editor</h3>
        <button @click="toggleEditor" class="close-button">×</button>
      </div>
      
      <div class="editor-content">
        <!-- Colors -->
        <section class="editor-section">
          <h4>Colors</h4>
          <div class="control-group">
            <label>
              Primary Color
              <input type="color" v-model="styles.primaryColor" @input="updateStyles">
            </label>
            <label>
              Background
              <input type="color" v-model="styles.bgPrimary" @input="updateStyles">
            </label>
            <label>
              Text Color
              <input type="color" v-model="styles.textPrimary" @input="updateStyles">
            </label>
            <label>
              Accent Color
              <input type="color" v-model="styles.accentColor" @input="updateStyles">
            </label>
          </div>
        </section>
        
        <!-- Typography -->
        <section class="editor-section">
          <h4>Typography</h4>
          <div class="control-group">
            <label>
              Base Font Size
              <input type="range" min="12" max="20" v-model="styles.fontSize" @input="updateStyles">
              <span>{{ styles.fontSize }}px</span>
            </label>
            <label>
              Font Family
              <select v-model="styles.fontFamily" @change="updateStyles">
                <option value="-apple-system, BlinkMacSystemFont, 'SF Pro Text'">System (Apple)</option>
                <option value="'Inter', sans-serif">Inter</option>
                <option value="'Helvetica Neue', sans-serif">Helvetica</option>
                <option value="'Roboto', sans-serif">Roboto</option>
              </select>
            </label>
          </div>
        </section>
        
        <!-- Spacing -->
        <section class="editor-section">
          <h4>Spacing</h4>
          <div class="control-group">
            <label>
              Base Spacing
              <input type="range" min="4" max="12" v-model="styles.spacingBase" @input="updateStyles">
              <span>{{ styles.spacingBase }}px</span>
            </label>
            <label>
              Border Radius
              <input type="range" min="0" max="24" v-model="styles.borderRadius" @input="updateStyles">
              <span>{{ styles.borderRadius }}px</span>
            </label>
          </div>
        </section>
        
        <!-- Glass Effect -->
        <section class="editor-section">
          <h4>Glass Effect</h4>
          <div class="control-group">
            <label>
              Blur Amount
              <input type="range" min="0" max="100" v-model="styles.blurAmount" @input="updateStyles">
              <span>{{ styles.blurAmount }}px</span>
            </label>
            <label>
              Glass Opacity
              <input type="range" min="0" max="20" v-model="styles.glassOpacity" @input="updateStyles">
              <span>{{ styles.glassOpacity }}%</span>
            </label>
          </div>
        </section>
        
        <!-- Actions -->
        <div class="editor-actions">
          <button @click="resetStyles" class="reset-button">Reset to Default</button>
          <button @click="exportStyles" class="export-button">Export CSS</button>
        </div>
      </div>
    </div>
    
    <!-- Toggle Button -->
    <button v-if="!isVisible" @click="toggleEditor" class="style-editor-toggle">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
      </svg>
    </button>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue'
  
  export default {
    name: 'StyleEditor',
    setup() {
      const isVisible = ref(false)
      const defaultStyles = {
        primaryColor: '#1db954',
        bgPrimary: '#000000',
        textPrimary: '#ffffff',
        accentColor: '#667eea',
        fontSize: 14,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text'",
        spacingBase: 8,
        borderRadius: 8,
        blurAmount: 50,
        glassOpacity: 5
      }
      
      const styles = ref({ ...defaultStyles })
      
      const toggleEditor = () => {
        isVisible.value = !isVisible.value
      }
      
      const updateStyles = () => {
        const root = document.documentElement
        
        // Update CSS variables
        root.style.setProperty('--primary-color', styles.value.primaryColor)
        root.style.setProperty('--bg-primary', styles.value.bgPrimary)
        root.style.setProperty('--text-primary', styles.value.textPrimary)
        root.style.setProperty('--accent-color', styles.value.accentColor)
        root.style.setProperty('--font-size-base', `${styles.value.fontSize}px`)
        root.style.setProperty('--font-family', styles.value.fontFamily)
        
        // Update spacing
        const spacing = styles.value.spacingBase
        root.style.setProperty('--spacing-xs', `${spacing * 0.5}px`)
        root.style.setProperty('--spacing-sm', `${spacing}px`)
        root.style.setProperty('--spacing-md', `${spacing * 2}px`)
        root.style.setProperty('--spacing-lg', `${spacing * 3}px`)
        root.style.setProperty('--spacing-xl', `${spacing * 4}px`)
        
        // Update border radius
        root.style.setProperty('--radius-sm', `${styles.value.borderRadius * 0.5}px`)
        root.style.setProperty('--radius-md', `${styles.value.borderRadius}px`)
        root.style.setProperty('--radius-lg', `${styles.value.borderRadius * 2}px`)
        
        // Update glass effect
        root.style.setProperty('--glass-blur', `${styles.value.blurAmount}px`)
        root.style.setProperty('--glass-opacity', styles.value.glassOpacity / 100)
        
        // Save to localStorage
        localStorage.setItem('customStyles', JSON.stringify(styles.value))
      }
      
      const resetStyles = () => {
        styles.value = { ...defaultStyles }
        updateStyles()
        localStorage.removeItem('customStyles')
      }
      
      const exportStyles = () => {
        const cssVariables = `
  :root {
    /* Colors */
    --primary-color: ${styles.value.primaryColor};
    --bg-primary: ${styles.value.bgPrimary};
    --text-primary: ${styles.value.textPrimary};
    --accent-color: ${styles.value.accentColor};
    
    /* Typography */
    --font-size-base: ${styles.value.fontSize}px;
    --font-family: ${styles.value.fontFamily};
    
    /* Spacing */
    --spacing-xs: ${styles.value.spacingBase * 0.5}px;
    --spacing-sm: ${styles.value.spacingBase}px;
    --spacing-md: ${styles.value.spacingBase * 2}px;
    --spacing-lg: ${styles.value.spacingBase * 3}px;
    --spacing-xl: ${styles.value.spacingBase * 4}px;
    
    /* Border Radius */
    --radius-sm: ${styles.value.borderRadius * 0.5}px;
    --radius-md: ${styles.value.borderRadius}px;
    --radius-lg: ${styles.value.borderRadius * 2}px;
    
    /* Glass Effect */
    --glass-blur: ${styles.value.blurAmount}px;
    --glass-opacity: ${styles.value.glassOpacity / 100};
  }
        `.trim()
        
        navigator.clipboard.writeText(cssVariables)
        alert('CSS variables copied to clipboard!')
      }
      
      onMounted(() => {
        // Load saved styles
        const savedStyles = localStorage.getItem('customStyles')
        if (savedStyles) {
          styles.value = JSON.parse(savedStyles)
          updateStyles()
        }
        
        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
          if (e.metaKey && e.shiftKey && e.key === 'E') {
            toggleEditor()
          }
        })
      })
      
      return {
        isVisible,
        styles,
        toggleEditor,
        updateStyles,
        resetStyles,
        exportStyles
      }
    }
  }
  </script>
  
  <style scoped>
  .style-editor {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 320px;
    max-height: calc(100vh - 40px);
    background: rgba(30, 30, 30, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    z-index: 9999;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .editor-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
  
  .close-button {
    width: 24px;
    height: 24px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    color: rgba(255, 255, 255, 0.7);
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .close-button:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
  
  .editor-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }
  
  .editor-section {
    margin-bottom: 24px;
  }
  
  .editor-section h4 {
    margin: 0 0 12px 0;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .control-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
  }
  
  input[type="color"] {
    width: 100%;
    height: 32px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.05);
    cursor: pointer;
  }
  
  input[type="range"] {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    outline: none;
    -webkit-appearance: none;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: #fff;
    border-radius: 50%;
    cursor: pointer;
  }
  
  select {
    width: 100%;
    padding: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #fff;
    font-size: 13px;
    outline: none;
  }
  
  .editor-actions {
    display: flex;
    gap: 8px;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .reset-button,
  .export-button {
    flex: 1;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .reset-button {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
  }
  
  .export-button {
    background: var(--primary-color, #1db954);
    color: #000;
  }
  
  .reset-button:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  
  .export-button:hover {
    transform: translateY(-1px);
  }
  
  /* Toggle Button */
  .style-editor-toggle {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    background: rgba(30, 30, 30, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
    z-index: 9998;
  }
  
  .style-editor-toggle:hover {
    background: rgba(40, 40, 40, 0.9);
    transform: scale(1.1);
    color: #fff;
  }
  
  .style-editor-toggle svg {
    width: 24px;
    height: 24px;
  }
  
  /* Dark scrollbar for editor */
  .editor-content::-webkit-scrollbar {
    width: 6px;
  }
  
  .editor-content::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .editor-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
  </style>