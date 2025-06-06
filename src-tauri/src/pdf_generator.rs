// src-tauri/src/pdf_generator.rs
use printpdf::*;
use std::fs::File;
use std::io::BufWriter;
use std::path::PathBuf;
use chrono::NaiveDate;
use crate::database::{Artist, Invoice, Project};

const MARGIN: f32 = 50.0;
const PAGE_WIDTH: f32 = 595.0;  // A4 width in points
const PAGE_HEIGHT: f32 = 842.0; // A4 height in points

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub struct InvoiceData {
    pub invoice: Invoice,
    pub artist: Artist,
    pub project: Option<Project>,
    pub line_items: Vec<LineItem>,
}

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub struct LineItem {
    pub description: String,
    pub amount: f64,
}

pub fn generate_invoice_pdf(data: InvoiceData, output_path: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    // Create PDF document
    let (doc, page1, layer1) = PdfDocument::new(
        &format!("Invoice {}", data.invoice.invoice_number),
        Mm(210.0), // A4 width
        Mm(297.0), // A4 height
        "Layer 1"
    );
    
    let current_layer = doc.get_page(page1).get_layer(layer1);
    
    // Load fonts
    let font_regular = doc.add_builtin_font(BuiltinFont::Helvetica)?;
    let font_bold = doc.add_builtin_font(BuiltinFont::HelveticaBold)?;
    
    let mut y_position = PAGE_HEIGHT - MARGIN;
    
    // Artist Name and Company (top left)
    let artist_name = if let Some(company) = &data.artist.company_name {
        if !company.trim().is_empty() {
            format!("{} / {}", data.artist.name, company)
        } else {
            data.artist.name.clone()
        }
    } else {
        data.artist.name.clone()
    };
    
    current_layer.use_text(
        &artist_name,
        16.0,
        Mm((MARGIN / 2.834) as f32),
        Mm((y_position / 2.834) as f32),
        &font_bold
    );
    y_position -= 20.0;
    
    // Artist Address
    if let Some(address) = &data.artist.address {
        if !address.trim().is_empty() {
            let address_lines: Vec<&str> = address.lines().collect();
            for line in address_lines.iter().take(3) { // Limit to 3 lines
                current_layer.use_text(
                    *line,
                    10.0,
                    Mm((MARGIN / 2.834) as f32),
                    Mm((y_position / 2.834) as f32),
                    &font_regular
                );
                y_position -= 15.0;
            }
        }
    }
    
    // Artist Contact Info
    if let Some(email) = &data.artist.email {
        if !email.trim().is_empty() {
            current_layer.use_text(
                email,
                10.0,
                Mm((MARGIN / 2.834) as f32),
                Mm((y_position / 2.834) as f32),
                &font_regular
            );
            y_position -= 15.0;
        }
    }
    
    if let Some(phone) = &data.artist.phone {
        if !phone.trim().is_empty() {
            current_layer.use_text(
                phone,
                10.0,
                Mm((MARGIN / 2.834) as f32),
                Mm((y_position / 2.834) as f32),
                &font_regular
            );
        }
    }
    
    // INVOICE header (right side)
    current_layer.use_text(
        "INVOICE",
        20.0,
        Mm(((PAGE_WIDTH - 150.0) / 2.834) as f32),
        Mm(((PAGE_HEIGHT - MARGIN) / 2.834) as f32),
        &font_bold
    );
    
    // Invoice Number and Date (right side)
    let invoice_y = PAGE_HEIGHT - 80.0;
    current_layer.use_text(
        &format!("#{}", data.invoice.invoice_number),
        12.0,
        Mm(((PAGE_WIDTH - 150.0) / 2.834) as f32),
        Mm((invoice_y / 2.834) as f32),
        &font_bold
    );
    
    current_layer.use_text(
        &format_date(&data.invoice.issue_date),
        12.0,
        Mm(((PAGE_WIDTH - 150.0) / 2.834) as f32),
        Mm(((invoice_y - 20.0) / 2.834) as f32),
        &font_regular
    );
    
    // Bill To section
    y_position = PAGE_HEIGHT - 160.0;
    current_layer.use_text(
        "BILL TO:",
        10.0,
        Mm((MARGIN / 2.834) as f32),
        Mm((y_position / 2.834) as f32),
        &font_bold
    );
    y_position -= 15.0;
    
    // Check if we have bill_to information in the invoice
    if let Some(bill_to) = &data.invoice.bill_to {
        if !bill_to.trim().is_empty() {
            let bill_to_lines: Vec<&str> = bill_to.lines().collect();
            for line in bill_to_lines.iter().take(4) { // Limit to 4 lines
                current_layer.use_text(
                    *line,
                    10.0,
                    Mm((MARGIN / 2.834) as f32),
                    Mm((y_position / 2.834) as f32),
                    &font_regular
                );
                y_position -= 15.0;
            }
        }
    } else {
        // Fallback to placeholder
        current_layer.use_text(
            "[Client Name]",
            10.0,
            Mm((MARGIN / 2.834) as f32),
            Mm((y_position / 2.834) as f32),
            &font_regular
        );
    }
    
    // Move down for the table
    y_position = PAGE_HEIGHT - 240.0;
    
    // Table Header
    draw_table_row(&current_layer, y_position, true);
    
    current_layer.use_text(
        "ITEM",
        12.0,
        Mm((MARGIN / 2.834) as f32),
        Mm(((y_position - 15.0) / 2.834) as f32),
        &font_bold
    );
    
    current_layer.use_text(
        "COST",
        12.0,
        Mm(((PAGE_WIDTH - 150.0) / 2.834) as f32),
        Mm(((y_position - 15.0) / 2.834) as f32),
        &font_bold
    );
    y_position -= 30.0;
    
    // Line Items
    for item in &data.line_items {
        let row_height = calculate_row_height(&item.description);
        draw_table_row(&current_layer, y_position, false);
        
        // Description (can be multi-line)
        let desc_lines: Vec<&str> = item.description.split('\n').collect();
        let mut item_y = y_position - 15.0;
        
        for (i, line) in desc_lines.iter().enumerate() {
            if i == 0 {
                // First line in regular font
                current_layer.use_text(
                    *line,
                    11.0,
                    Mm((MARGIN / 2.834) as f32),
                    Mm((item_y / 2.834) as f32),
                    &font_regular
                );
            } else {
                // Additional lines in italic (simulated with regular font, smaller size)
                current_layer.use_text(
                    *line,
                    10.0,
                    Mm((MARGIN / 2.834) as f32),
                    Mm((item_y / 2.834) as f32),
                    &font_regular
                );
            }
            item_y -= 15.0;
        }
        
        // Amount - format with thousands separator
        let amount_str = format_currency(item.amount);
        current_layer.use_text(
            &amount_str,
            11.0,
            Mm(((PAGE_WIDTH - 150.0) / 2.834) as f32),
            Mm(((y_position - 15.0) / 2.834) as f32),
            &font_regular
        );
        
        y_position -= row_height;
    }
    
    // Due and Total rows
    y_position -= 20.0;
    
    // Due row
    draw_table_row(&current_layer, y_position, false);
    current_layer.use_text(
        "Due",
        12.0,
        Mm((MARGIN / 2.834) as f32),
        Mm(((y_position - 15.0) / 2.834) as f32),
        &font_bold
    );
    
    // Calculate due date text
    let due_text = if data.invoice.due_date == data.invoice.issue_date {
        "Upon Receipt".to_string()
    } else {
        let days_diff = calculate_days_difference(&data.invoice.issue_date, &data.invoice.due_date);
        if days_diff == 0 {
            "Upon Receipt".to_string()
        } else if days_diff == 30 {
            "Net 30".to_string()
        } else {
            format!("Net {}", days_diff)
        }
    };
    
    current_layer.use_text(
        &due_text,
        11.0,
        Mm(((PAGE_WIDTH - 150.0) / 2.834) as f32),
        Mm(((y_position - 15.0) / 2.834) as f32),
        &font_regular
    );
    y_position -= 30.0;
    
    // Total row
    draw_table_row(&current_layer, y_position, false);
    current_layer.use_text(
        "Total",
        12.0,
        Mm((MARGIN / 2.834) as f32),
        Mm(((y_position - 15.0) / 2.834) as f32),
        &font_bold
    );
    
    let total_str = format_currency(data.invoice.amount);
    current_layer.use_text(
        &total_str,
        12.0,
        Mm(((PAGE_WIDTH - 150.0) / 2.834) as f32),
        Mm(((y_position - 15.0) / 2.834) as f32),
        &font_bold
    );
    
    // Wire Details Footer - Use artist's wire details if available
    y_position = 100.0;
    
    // Draw line above wire details
    draw_line(&current_layer, MARGIN, y_position + 20.0, PAGE_WIDTH - MARGIN, y_position + 20.0);
    
    if let Some(wire_details) = &data.artist.wire_details {
        if !wire_details.trim().is_empty() {
            // Use custom wire details from artist
            current_layer.use_text(
                "PAYMENT DETAILS",
                10.0,
                Mm(((PAGE_WIDTH / 2.0 - 40.0) / 2.834) as f32),
                Mm((y_position / 2.834) as f32),
                &font_bold
            );
            y_position -= 15.0;
            
            // Split wire details into lines and display
            let lines: Vec<&str> = wire_details.lines().collect();
            for line in lines.iter().take(4) { // Limit to 4 lines
                if !line.trim().is_empty() {
                    current_layer.use_text(
                        *line,
                        8.0,
                        Mm((MARGIN / 2.834) as f32),
                        Mm((y_position / 2.834) as f32),
                        &font_regular
                    );
                    y_position -= 12.0;
                }
            }
        }
    }
    
    // Save the PDF
    doc.save(&mut BufWriter::new(File::create(output_path)?))?;
    Ok(())
}

fn draw_line(layer: &PdfLayerReference, x1: f32, y1: f32, x2: f32, y2: f32) {
    let points = vec![
        (Point::new(Mm((x1 / 2.834) as f32), Mm((y1 / 2.834) as f32)), false),
        (Point::new(Mm((x2 / 2.834) as f32), Mm((y2 / 2.834) as f32)), false),
    ];
    
    let line = Line {
        points,
        is_closed: false,
    };
    
    layer.set_outline_color(Color::Rgb(Rgb::new(0.0, 0.0, 0.0, None)));
    layer.set_outline_thickness(1.0);
    layer.add_line(line);
}

fn draw_table_row(layer: &PdfLayerReference, y_position: f32, _is_header: bool) {
    // Draw top line
    draw_line(layer, MARGIN, y_position, PAGE_WIDTH - MARGIN, y_position);
    
    // Draw bottom line
    draw_line(layer, MARGIN, y_position - 30.0, PAGE_WIDTH - MARGIN, y_position - 30.0);
    
    // Draw vertical lines
    draw_line(layer, MARGIN, y_position, MARGIN, y_position - 30.0);
    draw_line(layer, PAGE_WIDTH - 200.0, y_position, PAGE_WIDTH - 200.0, y_position - 30.0);
    draw_line(layer, PAGE_WIDTH - MARGIN, y_position, PAGE_WIDTH - MARGIN, y_position - 30.0);
}

fn calculate_row_height(description: &str) -> f32 {
    let lines = description.split('\n').count();
    30.0 + (15.0 * (lines - 1) as f32)
}

fn format_date(date_str: &str) -> String {
    if let Ok(date) = NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
        date.format("%d %B %Y").to_string()
    } else {
        date_str.to_string()
    }
}

fn calculate_days_difference(start_date: &str, end_date: &str) -> i64 {
    if let (Ok(start), Ok(end)) = (
        NaiveDate::parse_from_str(start_date, "%Y-%m-%d"),
        NaiveDate::parse_from_str(end_date, "%Y-%m-%d")
    ) {
        (end - start).num_days()
    } else {
        0
    }
}

fn format_currency(amount: f64) -> String {
    // Format with thousands separator
    let whole = amount.trunc() as i64;
    let cents = ((amount - whole as f64) * 100.0).round() as i64;
    
    // Format the whole part with commas
    let whole_str = whole.to_string()
        .chars()
        .rev()
        .collect::<Vec<_>>()
        .chunks(3)
        .map(|chunk| chunk.iter().collect::<String>())
        .collect::<Vec<_>>()
        .join(",")
        .chars()
        .rev()
        .collect::<String>();
    
    format!("${}.{:02}", whole_str, cents)
}