// Debug script to check and refresh data
// Run this in your browser console on the app page

(async function debugData() {
  console.log('🔍 Debugging data loading...')
  
  try {
    // Get the Vue app instance
    const app = document.querySelector('#app').__vue_app__
    const globalProperties = app.config.globalProperties
    
    // Get stores
    const { useArtistStore } = await import('./src/store/artistStore.js')
    const { useInvoiceStore } = await import('./src/store/invoiceStore.js')
    
    const artistStore = useArtistStore()
    const invoiceStore = useInvoiceStore()
    
    console.log('📊 Current state:')
    console.log('- Artists in store:', artistStore.artists.length)
    console.log('- Invoices in store:', invoiceStore.invoices.length)
    
    // Clear cache and refresh
    console.log('🧹 Clearing cache and refreshing data...')
    await artistStore.refreshAllData()
    await invoiceStore.loadInvoices()
    
    console.log('✅ After refresh:')
    console.log('- Artists loaded:', artistStore.artists)
    console.log('- Invoices loaded:', invoiceStore.invoices)
    
    // Check for errors
    if (artistStore.error) {
      console.error('❌ Artist store error:', artistStore.error)
    }
    if (invoiceStore.error) {
      console.error('❌ Invoice store error:', invoiceStore.error)
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error)
    
    // Alternative approach using global stores
    console.log('🔄 Trying alternative approach...')
    try {
      // Access stores from window if available
      if (window.$stores) {
        const artistStore = window.$stores.artist
        const invoiceStore = window.$stores.invoice
        
        console.log('Artists:', artistStore?.artists || 'Not found')
        console.log('Invoices:', invoiceStore?.invoices || 'Not found')
      }
    } catch (altError) {
      console.error('❌ Alternative approach failed:', altError)
    }
  }
})()

// Manual refresh commands you can run:
console.log(`
🛠️  Manual commands you can run:

// Check current state
console.log('Artists:', window.$stores?.artist?.artists)
console.log('Invoices:', window.$stores?.invoice?.invoices)

// Force refresh (if stores are available)
await window.$stores?.artist?.refreshAllData()
await window.$stores?.invoice?.loadInvoices()

// Clear browser cache completely
localStorage.clear()
sessionStorage.clear()
location.reload()
`)