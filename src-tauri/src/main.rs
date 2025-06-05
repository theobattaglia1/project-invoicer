// src-tauri/src/main.rs
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};
use tauri::Manager;

mod database;
use database::*;

#[derive(Debug, Serialize, Deserialize)]
struct Artist {
    id: String,
    name: String,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    notes: Option<String>,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Project {
    id: String,
    artist_id: String,
    name: String,
    description: Option<String>,
    status: String,
    start_date: Option<String>,
    end_date: Option<String>,
    budget: f64,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Invoice {
    id: String,
    artist_id: String,
    project_id: Option<String>,
    invoice_number: String,
    amount: f64,
    status: String,
    issue_date: String,
    due_date: String,
    paid_date: Option<String>,
    items: String, // JSON string
    notes: Option<String>,
    created_at: String,
    updated_at: String,
}

// Artist Commands
#[tauri::command]
async fn get_all_artists() -> Result<Vec<Artist>, String> {
    database::get_all_artists()
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_artist(
    name: String,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    notes: Option<String>,
) -> Result<Artist, String> {
    database::create_artist(name, email, phone, address, notes)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_artist(
    artist_id: String,
    name: String,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    notes: Option<String>,
) -> Result<Artist, String> {
    database::update_artist(artist_id, name, email, phone, address, notes)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_artist(artist_id: String) -> Result<(), String> {
    database::delete_artist(artist_id)
        .map_err(|e| e.to_string())
}

// Project Commands
#[tauri::command]
async fn get_all_projects() -> Result<Vec<Project>, String> {
    database::get_all_projects()
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_projects_by_artist(artist_id: String) -> Result<Vec<Project>, String> {
    database::get_projects_by_artist(artist_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_project(
    artist_id: String,
    name: String,
    description: Option<String>,
    status: String,
    start_date: Option<String>,
    end_date: Option<String>,
    budget: f64,
) -> Result<Project, String> {
    database::create_project(artist_id, name, description, status, start_date, end_date, budget)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_project(
    project_id: String,
    name: String,
    description: Option<String>,
    status: String,
    start_date: Option<String>,
    end_date: Option<String>,
    budget: f64,
) -> Result<Project, String> {
    database::update_project(project_id, name, description, status, start_date, end_date, budget)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_project(project_id: String) -> Result<(), String> {
    database::delete_project(project_id)
        .map_err(|e| e.to_string())
}

// Invoice Commands
#[tauri::command]
async fn get_all_invoices() -> Result<Vec<Invoice>, String> {
    database::get_all_invoices()
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_invoices_by_artist(artist_id: String) -> Result<Vec<Invoice>, String> {
    database::get_invoices_by_artist(artist_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_invoice(
    artist_id: String,
    project_id: Option<String>,
    invoice_number: String,
    amount: f64,
    status: String,
    issue_date: String,
    due_date: String,
    items: String,
    notes: Option<String>,
) -> Result<Invoice, String> {
    database::create_invoice(
        artist_id,
        project_id,
        invoice_number,
        amount,
        status,
        issue_date,
        due_date,
        items,
        notes,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_invoice(
    invoice_id: String,
    invoice_number: String,
    amount: f64,
    status: String,
    issue_date: String,
    due_date: String,
    items: String,
    notes: Option<String>,
) -> Result<Invoice, String> {
    database::update_invoice(
        invoice_id,
        invoice_number,
        amount,
        status,
        issue_date,
        due_date,
        items,
        notes,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_invoice(invoice_id: String) -> Result<(), String> {
    database::delete_invoice(invoice_id)
        .map_err(|e| e.to_string())
}

fn main() {
    // Initialize database on startup
    if let Err(e) = database::init() {
        eprintln!("Failed to initialize database: {}", e);
    }

    tauri::Builder::default()
        .setup(|app| {
            // Create app directories if they don't exist
            let app_dir = app.path_resolver()
                .app_data_dir()
                .expect("Failed to get app data directory");
            
            std::fs::create_dir_all(&app_dir)
                .expect("Failed to create app directory");
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Artist commands
            get_all_artists,
            create_artist,
            update_artist,
            delete_artist,
            // Project commands
            get_all_projects,
            get_projects_by_artist,
            create_project,
            update_project,
            delete_project,
            // Invoice commands
            get_all_invoices,
            get_invoices_by_artist,
            create_invoice,
            update_invoice,
            delete_invoice,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}