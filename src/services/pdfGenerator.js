// src/services/pdfGenerator.js
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { supabase } from '@/lib/supabase'

export async function generateInvoicePDF(invoiceData) {
  const { invoice, artist, project, line_items } = invoiceData
  
  // Create new PDF document
  const doc = new jsPDF()
  
  // Set colors
  const primaryColor = [29, 185, 84] // #1db954
  const textColor = [0, 0, 0]
  const lightGray = [240, 240, 240]
  
  // Header - Artist Info
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text(artist.name, 20, 20)
  
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  let yPos = 25
  
  if (artist.company_name) {
    doc.text(artist.company_name, 20, yPos)
    yPos += 5
  }
  
  if (artist.address) {
    const addressLines = artist.address.split('\n')
    addressLines.forEach(line => {
      doc.text(line, 20, yPos)
      yPos += 5
    })
  }
  
  if (artist.email) {
    doc.text(artist.email, 20, yPos)
    yPos += 5
  }
  
  if (artist.phone) {
    doc.text(artist.phone, 20, yPos)
    yPos += 5
  }
  
  // Invoice Title
  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text('INVOICE', 140, 20)
  
  // Invoice Details
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text(`#${invoice.invoice_number}`, 140, 30)
  
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  doc.text(formatDate(invoice.issue_date), 140, 36)
  
  // Bill To Section
  yPos = 60
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text('BILL TO:', 20, yPos)
  yPos += 5
  
  doc.setFont(undefined, 'normal')
  if (invoice.bill_to) {
    const billToLines = invoice.bill_to.split('\n')
    billToLines.forEach(line => {
      doc.text(line, 20, yPos)
      yPos += 5
    })
  }
  
  // Line Items Table
  yPos += 10
  
  // Prepare table data
  const tableData = line_items.map(item => [
    item.description,
    `$${parseFloat(item.amount || 0).toFixed(2)}`
  ])
  
  // Add table
  doc.autoTable({
    startY: yPos,
    head: [['ITEM', 'COST']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 40, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  })
  
  // Due and Total
  const finalY = doc.lastAutoTable.finalY + 10
  
  // Due row
  doc.setFillColor(...lightGray)
  doc.rect(20, finalY, 160, 8, 'F')
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text('Due', 22, finalY + 5.5)
  doc.setFont(undefined, 'normal')
  doc.text(getDueText(invoice), 160, finalY + 5.5, { align: 'right' })
  
  // Total row
  doc.setFillColor(...lightGray)
  doc.rect(20, finalY + 10, 160, 8, 'F')
  doc.setFont(undefined, 'bold')
  doc.text('Total', 22, finalY + 15.5)
  doc.text(`$${parseFloat(invoice.amount || 0).toFixed(2)}`, 160, finalY + 15.5, { align: 'right' })
  
  // Wire Details Footer
  if (artist.wire_details) {
    const footerY = finalY + 30
    doc.setDrawColor(...primaryColor)
    doc.line(20, footerY, 190, footerY)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('PAYMENT DETAILS', 105, footerY + 10, { align: 'center' })
    
    doc.setFont(undefined, 'normal')
    doc.setFontSize(8)
    const wireLines = artist.wire_details.split('\n')
    let wireY = footerY + 20
    wireLines.forEach(line => {
      if (line.trim()) {
        doc.text(line, 20, wireY)
        wireY += 4
      }
    })
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

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getDueText(invoice) {
  if (invoice.due_date === invoice.issue_date) {
    return 'Upon Receipt'
  }
  
  const issue = new Date(invoice.issue_date)
  const due = new Date(invoice.due_date)
  const diffTime = Math.abs(due - issue)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 30) {
    return 'Net 30'
  }
  
  return `Net ${diffDays}`
}