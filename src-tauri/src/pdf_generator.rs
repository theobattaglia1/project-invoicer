// src/services/pdfGenerator.js
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { supabase } from '@/lib/supabase'

export async function generateInvoicePDF(invoiceData) {
  const { invoice, artist, project, line_items } = invoiceData
  
  // Create new PDF document (A4 size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  })
  
  // Constants matching Rust version
  const MARGIN = 50
  const PAGE_WIDTH = 595  // A4 width in points
  const PAGE_HEIGHT = 842 // A4 height in points
  
  let yPosition = PAGE_HEIGHT - MARGIN
  
  // Artist Name and Company (top left)
  let artistName = artist.name
  if (artist.company_name && artist.company_name.trim()) {
    artistName = `${artist.name} / ${artist.company_name}`
  }
  
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text(artistName, MARGIN, yPosition)
  yPosition -= 20
  
  // Artist Address
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  if (artist.address && artist.address.trim()) {
    const addressLines = artist.address.split('\n')
    for (let i = 0; i < Math.min(addressLines.length, 3); i++) {
      doc.text(addressLines[i], MARGIN, yPosition)
      yPosition -= 15
    }
  }
  
  // Artist Contact Info
  if (artist.email && artist.email.trim()) {
    doc.text(artist.email, MARGIN, yPosition)
    yPosition -= 15
  }
  
  if (artist.phone && artist.phone.trim()) {
    doc.text(artist.phone, MARGIN, yPosition)
  }
  
  // INVOICE header (right side)
  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text('INVOICE', PAGE_WIDTH - 150, PAGE_HEIGHT - MARGIN)
  
  // Invoice Number and Date (right side)
  const invoiceY = PAGE_HEIGHT - 80
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text(`#${invoice.invoice_number}`, PAGE_WIDTH - 150, invoiceY)
  
  doc.setFont(undefined, 'normal')
  doc.setFontSize(12)
  doc.text(formatDate(invoice.issue_date), PAGE_WIDTH - 150, invoiceY - 20)
  
  // Bill To section
  yPosition = PAGE_HEIGHT - 160
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text('BILL TO:', MARGIN, yPosition)
  yPosition -= 15
  
  doc.setFont(undefined, 'normal')
  if (invoice.bill_to && invoice.bill_to.trim()) {
    const billToLines = invoice.bill_to.split('\n')
    for (let i = 0; i < Math.min(billToLines.length, 4); i++) {
      doc.text(billToLines[i], MARGIN, yPosition)
      yPosition -= 15
    }
  } else {
    doc.text('[Client Name]', MARGIN, yPosition)
  }
  
  // Move down for the table
  yPosition = PAGE_HEIGHT - 240
  
  // Table Header
  drawTableRow(doc, yPosition, true)
  
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('ITEM', MARGIN, yPosition - 15)
  doc.text('COST', PAGE_WIDTH - 150, yPosition - 15)
  yPosition -= 30
  
  // Line Items
  doc.setFont(undefined, 'normal')
  for (const item of line_items) {
    const rowHeight = calculateRowHeight(item)
    drawTableRow(doc, yPosition, false, rowHeight)
    
    // Build description with all details
    let itemY = yPosition - 15
    
    // Main description
    doc.setFontSize(11)
    doc.text(item.description, MARGIN, itemY)
    itemY -= 15
    
    // Additional details in smaller font
    doc.setFontSize(10)
    const details = []
    if (item.artist) details.push(`Artist: ${item.artist}`)
    if (item.songProject) details.push(`Song/Project: ${item.songProject}`)
    if (item.company) details.push(`Company: ${item.company}`)
    
    if (details.length > 0) {
      doc.text(details.join(' | '), MARGIN, itemY)
      itemY -= 15
    }
    
    // Status indicators
    const status = []
    if (item.delivered) status.push('✓ Delivered')
    if (item.termsAgreed) status.push('✓ Terms Agreed')
    if (item.invoiced) status.push('✓ Invoiced')
    if (item.upstreamed) status.push(`✓ Upstreamed ($${item.upstreamAmount || 0})`)
    
    if (status.length > 0) {
      doc.text(status.join(' | '), MARGIN, itemY)
    }
    
    // Amount
    doc.setFontSize(11)
    const amountStr = formatCurrency(item.amount)
    doc.text(amountStr, PAGE_WIDTH - 150, yPosition - 15)
    
    yPosition -= rowHeight
  }
  
  // Due and Total rows
  yPosition -= 20
  
  // Due row
  drawTableRow(doc, yPosition, false)
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('Due', MARGIN, yPosition - 15)
  
  // Calculate due date text
  let dueText = 'Upon Receipt'
  if (invoice.due_date !== invoice.issue_date) {
    const daysDiff = calculateDaysDifference(invoice.issue_date, invoice.due_date)
    if (daysDiff === 30) {
      dueText = 'Net 30'
    } else if (daysDiff > 0) {
      dueText = `Net ${daysDiff}`
    }
  }
  
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text(dueText, PAGE_WIDTH - 150, yPosition - 15)
  yPosition -= 30
  
  // Total row
  drawTableRow(doc, yPosition, false)
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('Total', MARGIN, yPosition - 15)
  
  const totalStr = formatCurrency(invoice.amount)
  doc.text(totalStr, PAGE_WIDTH - 150, yPosition - 15)
  
  // Wire Details Footer
  yPosition = 100
  
  // Draw line above wire details
  drawLine(doc, MARGIN, yPosition + 20, PAGE_WIDTH - MARGIN, yPosition + 20)
  
  if (artist.wire_details && artist.wire_details.trim()) {
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('PAYMENT DETAILS', PAGE_WIDTH / 2 - 40, yPosition, { align: 'center' })
    yPosition -= 15
    
    doc.setFont(undefined, 'normal')
    doc.setFontSize(8)
    const wireLines = artist.wire_details.split('\n')
    for (let i = 0; i < Math.min(wireLines.length, 4); i++) {
      if (wireLines[i].trim()) {
        doc.text(wireLines[i], MARGIN, yPosition)
        yPosition -= 12
      }
    }
  }
  
  // Generate blob
  const pdfBlob = doc.output('blob')
  
  // Create filename
  const fileName = `${invoice.invoice_number.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('invoices')
    .upload(fileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true
    })
  
  if (error) throw error
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('invoices')
    .getPublicUrl(fileName)
  
  // Update invoice with PDF URL
  await supabase
    .from('invoices')
    .update({ pdf_url: publicUrl })
    .eq('id', invoice.id)
  
  return publicUrl
}

function drawLine(doc, x1, y1, x2, y2) {
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(1)
  doc.line(x1, y1, x2, y2)
}

function drawTableRow(doc, yPosition, isHeader, height = 30) {
  const MARGIN = 50
  const PAGE_WIDTH = 595
  
  // Draw top line
  drawLine(doc, MARGIN, yPosition, PAGE_WIDTH - MARGIN, yPosition)
  
  // Draw bottom line
  drawLine(doc, MARGIN, yPosition - height, PAGE_WIDTH - MARGIN, yPosition - height)
  
  // Draw vertical lines
  drawLine(doc, MARGIN, yPosition, MARGIN, yPosition - height)
  drawLine(doc, PAGE_WIDTH - 200, yPosition, PAGE_WIDTH - 200, yPosition - height)
  drawLine(doc, PAGE_WIDTH - MARGIN, yPosition, PAGE_WIDTH - MARGIN, yPosition - height)
}

function calculateRowHeight(item) {
  let lines = 1 // Base description
  
  // Add line for additional details if present
  if (item.artist || item.songProject || item.company) {
    lines++
  }
  
  // Add line for status indicators if present
  if (item.delivered || item.termsAgreed || item.invoiced || item.upstreamed) {
    lines++
  }
  
  return 30 + (15 * (lines - 1))
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

function calculateDaysDifference(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function formatCurrency(amount) {
  // Format with thousands separator
  const whole = Math.trunc(amount)
  const cents = Math.round((amount - whole) * 100)
  
  // Format the whole part with commas
  const wholeStr = whole.toString()
    .split('')
    .reverse()
    .reduce((acc, digit, i) => {
      if (i > 0 && i % 3 === 0) acc.push(',')
      acc.push(digit)
      return acc
    }, [])
    .reverse()
    .join('')
  
  return `$${wholeStr}.${cents.toString().padStart(2, '0')}`
}