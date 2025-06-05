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
    
    // Company Header (customize this with your info)
    current_layer.use_text(
        "YOUR COMPANY NAME",
        24.0,
        Mm(MARGIN / 2.834),
        Mm(y_position / 2.834),
        &font_bold
    );
    y_position -= 30.0;
    
    current_layer.use_text(
        "123 Your Street, Your City, State ZIP",
        10.0,
        Mm(MARGIN / 2.834),
        Mm(y_position / 2.834),
        &font_regular
    );
    y_position -= 15.0;
    
    current_layer.use_text(
        "Email: your@email.com | Phone: (555) 123-4567",
        10.0,
        Mm(MARGIN / 2.834),
        Mm(y_position / 2.834),
        &font_regular
    );
    y_position -= 40.0;
    
    // Invoice Title
    current_layer.use_text(
        "INVOICE",
        20.0,
        Mm((PAGE_WIDTH - 100.0) / 2.834),
        Mm(y_position / 2.834),
        &font_bold
    );
    y_position -= 40.0;
    
    // Invoice Details Section
    current_layer.use_text(
        &format!("Invoice Number: {}", data.invoice.invoice_number),
        12.0,
        Mm(MARGIN / 2.834),
        Mm(y_position / 2.834),
        &font_bold
    );
    
    current_layer.use_text(
        &format!("Issue Date: {}", format_date(&data.invoice.issue_date)),
        12.0,
        Mm((PAGE_WIDTH - 200.0) / 2.834),
        Mm(y_position / 2.834),
        &font_regular
    );
    y_position -= 20.0;
    
    current_layer.use_text(
        &format!("Due Date: {}", format_date(&data.invoice.due_date)),
        12.0,
        Mm((PAGE_WIDTH - 200.0) / 2.834),
        Mm(y_position / 2.834),
        &font_regular
    );
    y_position -= 40.0;
    
    // Bill To Section
    current_layer.use_text(
        "BILL TO:",
        12.0,
        Mm(MARGIN / 2.834),
        Mm(y_position / 2.834),
        &font_bold
    );
    y_position -= 20.0;
    
    current_layer.use_text(
        &data.artist.name,
        12.0,
        Mm(MARGIN / 2.834),
        Mm(y_position / 2.834),
        &font_regular
    );
    y_position -= 15.0;
    
    if let Some(email) = &data.artist.email {
        current_layer.use_text(
            email,
            10.0,
            Mm(MARGIN / 2.834),
            Mm(y_position / 2.834),
            &font_regular
        );
        y_position -= 15.0;
    }
    
    if let Some(phone) = &data.artist.phone {
        current_layer.use_text(
            phone,
            10.0,
            Mm(MARGIN / 2.834),
            Mm(y_position / 2.834),
            &font_regular
        );
        y_position -= 15.0;
    }
    
    if let Some(address) = &data.artist.address {
        // Split address by newlines if it's multiline
        for line in address.lines() {
            current_layer.use_text(
                line,
                10.0,
                Mm(MARGIN / 2.834),
                Mm(y_position / 2.834),
                &font_regular
            );
            y_position -= 15.0;
        }
    }
    y_position -= 20.0;
    
    // Project info if available
    if let Some(project) = &data.project {
        current_layer.use_text(
            &format!("Project: {}", project.name),
            12.0,
            Mm(MARGIN / 2.834),
            Mm(y_position / 2.834),
            &font_bold
        );
        y_position -= 30.0;
    }
    
    // Line Items Table Header
    draw_line(&current_layer, MARGIN, y_position, PAGE_WIDTH - MARGIN, y_position);
    y_position -= 20.0;
    
    current_layer.use_text(
        "Description",
        12.0,
        Mm(MARGIN / 2.834),
        Mm(y_position / 2.834),
        &font_bold
    );
    
    current_layer.use_text(
        "Amount",
        12.0,
        Mm((PAGE_WIDTH - 100.0) / 2.834),
        Mm(y_position / 2.834),
        &font_bold
    );
    y_position -= 15.0;
    
    draw_line(&current_layer, MARGIN, y_position, PAGE_WIDTH - MARGIN, y_position);
    y_position -= 20.0;
    
    // Line Items
    let mut subtotal = 0.0;
    for item in &data.line_items {
        current_layer.use_text(
            &item.description,
            11.0,
            Mm(MARGIN / 2.834),
            Mm(y_position / 2.834),
            &font_regular
        );
        
        current_layer.use_text(
            &format!("${:.2}", item.amount),
            11.0,
            Mm((PAGE_WIDTH - 100.0) / 2.834),
            Mm(y_position / 2.834),
            &font_regular
        );
        
        subtotal += item.amount;
        y_position -= 20.0;
    }
    
    // Total Section
    y_position -= 10.0;
    draw_line(&current_layer, PAGE_WIDTH - 250.0, y_position, PAGE_WIDTH - MARGIN, y_position);
    y_position -= 20.0;
    
    current_layer.use_text(
        "Subtotal:",
        12.0,
        Mm((PAGE_WIDTH - 200.0) / 2.834),
        Mm(y_position / 2.834),
        &font_regular
    );
    
    current_layer.use_text(
        &format!("${:.2}", subtotal),
        12.0,
        Mm((PAGE_WIDTH - 100.0) / 2.834),
        Mm(y_position / 2.834),
        &font_regular
    );
    y_position -= 20.0;
    
    // Tax calculation (customize as needed)
    let tax_rate = 0.0; // Set your tax rate here
    let tax_amount = subtotal * tax_rate;
    
    if tax_rate > 0.0 {
        current_layer.use_text(
            &format!("Tax ({}%):", tax_rate * 100.0),
            12.0,
            Mm((PAGE_WIDTH - 200.0) / 2.834),
            Mm(y_position / 2.834),
            &font_regular
        );
        
        current_layer.use_text(
            &format!("${:.2}", tax_amount),
            12.0,
            Mm((PAGE_WIDTH - 100.0) / 2.834),
            Mm(y_position / 2.834),
            &font_regular
        );
        y_position -= 20.0;
    }
    
    // Total
    current_layer.use_text(
        "TOTAL:",
        14.0,
        Mm((PAGE_WIDTH - 200.0) / 2.834),
        Mm(y_position / 2.834),
        &font_bold
    );
    
    current_layer.use_text(
        &format!("${:.2}", data.invoice.amount),
        14.0,
        Mm((PAGE_WIDTH - 100.0) / 2.834),
        Mm(y_position / 2.834),
        &font_bold
    );
    y_position -= 40.0;
    
    // Notes Section
    if let Some(notes) = &data.invoice.notes {
        if !notes.is_empty() {
            current_layer.use_text(
                "Notes:",
                12.0,
                Mm(MARGIN / 2.834),
                Mm(y_position / 2.834),
                &font_bold
            );
            y_position -= 20.0;
            
            // Handle multi-line notes
            for line in notes.lines() {
                if y_position < 100.0 {
                    break; // Prevent text from going off the page
                }
                current_layer.use_text(
                    line,
                    10.0,
                    Mm(MARGIN / 2.834),
                    Mm(y_position / 2.834),
                    &font_regular
                );
                y_position -= 15.0;
            }
        }
    }
    
    // Footer
    y_position = 50.0;
    draw_line(&current_layer, MARGIN, y_position, PAGE_WIDTH - MARGIN, y_position);
    y_position -= 20.0;
    
    current_layer.use_text(
        "Thank you for your business!",
        10.0,
        Mm((PAGE_WIDTH / 2.0 - 50.0) / 2.834),
        Mm(y_position / 2.834),
        &font_regular
    );
    
    // Save the PDF
    doc.save(&mut BufWriter::new(File::create(output_path)?))?;
    Ok(())
}

fn draw_line(layer: &PdfLayerReference, x1: f32, y1: f32, x2: f32, y2: f32) {
    let points = vec![
        (Point::new(Mm(x1 / 2.834), Mm(y1 / 2.834)), false),
        (Point::new(Mm(x2 / 2.834), Mm(y2 / 2.834)), false),
    ];
    
    let line = Line {
        points,
        is_closed: false,
        has_fill: false,
        has_stroke: true,
        is_clipping_path: false,
    };
    
    layer.add_shape(line);
}

fn format_date(date_str: &str) -> String {
    if let Ok(date) = NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
        date.format("%B %d, %Y").to_string()
    } else {
        date_str.to_string()
    }
}