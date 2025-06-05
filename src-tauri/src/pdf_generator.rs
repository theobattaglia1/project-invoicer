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
    
    // Try to load and add logo
    let logo_path = std::env::current_exe()?
        .parent()
        .unwrap()
        .join("assets")
        .join("amf-logo.png");
    
    // Alternative paths to try
    let alternative_paths = vec![
        PathBuf::from("./src-tauri/assets/amf-logo.png"),
        PathBuf::from("./assets/amf-logo.png"),
        PathBuf::from("../assets/amf-logo.png"),
    ];
    
    let mut logo_added = false;
    
    // Try to find and add the logo
    for path in std::iter::once(&logo_path).chain(alternative_paths.iter()) {
        if path.exists() {
            match image::open(path) {
                Ok(img) => {
                    // Convert to RGB8 if needed
                    let rgb_image = img.to_rgb8();
                    let (width, height) = rgb_image.dimensions();
                    
                    // Create image object for PDF
                    let pdf_image = Image::from_dynamic_image(&img.into());
                    
                    // Add image to PDF (top left corner)
                    // Scale the logo to fit nicely (adjust these values as needed)
                    let logo_width = 30.0; // mm
                    let logo_height = 45.0; // mm
                    
                    pdf_image.add_to_layer(
                        current_layer.clone(),
                        ImageTransform {
                            translate_x: Some(Mm(MARGIN / 2.834)),
                            translate_y: Some(Mm((PAGE_HEIGHT - MARGIN - 50.0) / 2.834)),
                            scale_x: Some(logo_width / (width as f32 / 2.834)),
                            scale_y: Some(logo_height / (height as f32 / 2.834)),
                            ..Default::default()
                        }
                    );
                    logo_added = true;
                    break;
                }
                Err(_) => continue,
            }
        }
    }
    
    let mut y_position = PAGE_HEIGHT - MARGIN;
    
    // If logo wasn't added, fall back to text
    if !logo_added {
        current_layer.use_text(
            "AMF",
            36.0,
            Mm((MARGIN / 2.834) as f32),
            Mm((y_position / 2.834) as f32),
            &font_bold
        );
        y_position -= 20.0;
        
        current_layer.use_text(
            "ALL MY",
            10.0,
            Mm((MARGIN / 2.834) as f32),
            Mm((y_position / 2.834) as f32),
            &font_regular
        );
        y_position -= 12.0;
        
        current_layer.use_text(
            "FRIENDS",
            10.0,
            Mm((MARGIN / 2.834) as f32),
            Mm((y_position / 2.834) as f32),
            &font_regular
        );
    }
    
    // INVOICE header (right side)
    current_layer.use_text(
        "INVOICE",
        20.0,
        Mm(((PAGE_WIDTH - 150.0) / 2.834) as f32),
        Mm(((PAGE_HEIGHT - MARGIN) / 2.834) as f32),
        &font_bold
    );
    
    // Reset y_position for address
    y_position = PAGE_HEIGHT - 100.0;
    
    // Company Address (left side)
    current_layer.use_text(
        "702 ECHO PARK AVENUE",
        10.0,
        Mm((MARGIN / 2.834) as f32),
        Mm((y_position / 2.834) as f32),
        &font_regular
    );
    y_position -= 15.0;
    
    current_layer.use_text(
        "LOS ANGELES, CA 90026",
        10.0,
        Mm((MARGIN / 2.834) as f32),
        Mm((y_position / 2.834) as f32),
        &font_regular
    );
    
    // Invoice Number and Date (right side)
    let invoice_y = PAGE_HEIGHT - 100.0;
    current_layer.use_text(
        &format!("INV #{}", data.invoice.invoice_number),
        12.0,
        Mm(((PAGE_WIDTH - 200.0) / 2.834) as f32),
        Mm((invoice_y / 2.834) as f32),
        &font_bold
    );
    
    current_layer.use_text(
        &format_date(&data.invoice.issue_date),
        12.0,
        Mm(((PAGE_WIDTH - 200.0) / 2.834) as f32),
        Mm(((invoice_y - 20.0) / 2.834) as f32),
        &font_regular
    );
    
    // Move down for the table
    y_position = PAGE_HEIGHT - 200.0;
    
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
                    line,
                    11.0,
                    Mm((MARGIN / 2.834) as f32),
                    Mm((item_y / 2.834) as f32),
                    &font_regular
                );
            } else {
                // Additional lines in italic (simulated with regular font, smaller size)
                current_layer.use_text(
                    line,
                    10.0,
                    Mm((MARGIN / 2.834) as f32),
                    Mm((item_y / 2.834) as f32),
                    &font_regular
                );
            }
            item_y -= 15.0;
        }
        
        // Amount
        current_layer.use_text(
            &format!("${:,.2}", item.amount),
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
    
    current_layer.use_text(
        &format!("${:,.2}", data.invoice.amount),
        12.0,
        Mm(((PAGE_WIDTH - 150.0) / 2.834) as f32),
        Mm(((y_position - 15.0) / 2.834) as f32),
        &font_bold
    );
    
    // Wire Details Footer
    y_position = 100.0;
    
    // Draw line above wire details
    draw_line(&current_layer, MARGIN, y_position + 20.0, PAGE_WIDTH - MARGIN, y_position + 20.0);
    
    current_layer.use_text(
        "WIRE DETAILS",
        10.0,
        Mm(((PAGE_WIDTH / 2.0 - 40.0) / 2.834) as f32),
        Mm((y_position / 2.834) as f32),
        &font_bold
    );
    y_position -= 15.0;
    
    // Wire details in smaller text, centered
    let wire_details = "Account Name: All My Friends Inc. • Account Number: XXXX • Routing Number: XXXX •";
    current_layer.use_text(
        wire_details,
        8.0,
        Mm((80.0 / 2.834) as f32),
        Mm((y_position / 2.834) as f32),
        &font_regular
    );
    y_position -= 12.0;
    
    let bank_details = "Bank Name: BANK • Bank Address: XXX";
    current_layer.use_text(
        bank_details,
        8.0,
        Mm((150.0 / 2.834) as f32),
        Mm((y_position / 2.834) as f32),
        &font_regular
    );
    
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

fn draw_table_row(layer: &PdfLayerReference, y_position: f32, is_header: bool) {
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