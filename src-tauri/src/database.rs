// src-tauri/src/database.rs
use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize)]
pub struct Artist {
    pub id: String,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub artist_id: String,
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub budget: f64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Invoice {
    pub id: String,
    pub artist_id: String,
    pub project_id: Option<String>,
    pub invoice_number: String,
    pub amount: f64,
    pub status: String,
    pub issue_date: String,
    pub due_date: String,
    pub paid_date: Option<String>,
    pub items: String,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

fn get_db_path() -> PathBuf {
    let mut path = dirs::data_dir().expect("Failed to get data directory");
    path.push("project-invoicer");
    std::fs::create_dir_all(&path).expect("Failed to create data directory");
    path.push("database.db");
    path
}

fn get_connection() -> Result<Connection> {
    Connection::open(get_db_path())
}

pub fn init() -> Result<()> {
    let conn = get_connection()?;
    
    // Create artists table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS artists (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address TEXT,
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;
    
    // Create projects table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            artist_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            start_date TEXT,
            end_date TEXT,
            budget REAL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (artist_id) REFERENCES artists (id) ON DELETE CASCADE
        )",
        [],
    )?;
    
    // Create invoices table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            artist_id TEXT NOT NULL,
            project_id TEXT,
            invoice_number TEXT NOT NULL UNIQUE,
            amount REAL NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'pending',
            issue_date TEXT NOT NULL,
            due_date TEXT NOT NULL,
            paid_date TEXT,
            items TEXT NOT NULL DEFAULT '[]',
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (artist_id) REFERENCES artists (id) ON DELETE CASCADE,
            FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL
        )",
        [],
    )?;
    
    Ok(())
}

// Artist functions
pub fn get_all_artists() -> Result<Vec<Artist>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, name, email, phone, address, notes, created_at, updated_at 
         FROM artists ORDER BY name"
    )?;
    
    let artists = stmt.query_map([], |row| {
        Ok(Artist {
            id: row.get(0)?,
            name: row.get(1)?,
            email: row.get(2)?,
            phone: row.get(3)?,
            address: row.get(4)?,
            notes: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    })?
    .collect::<Result<Vec<_>>>()?;
    
    Ok(artists)
}

pub fn create_artist(
    name: String,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    notes: Option<String>,
) -> Result<Artist> {
    let conn = get_connection()?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    
    conn.execute(
        "INSERT INTO artists (id, name, email, phone, address, notes, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![&id, &name, &email, &phone, &address, &notes, &now, &now],
    )?;
    
    Ok(Artist {
        id,
        name,
        email,
        phone,
        address,
        notes,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn update_artist(
    artist_id: String,
    name: String,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    notes: Option<String>,
) -> Result<Artist> {
    let conn = get_connection()?;
    let now = Utc::now().to_rfc3339();
    
    conn.execute(
        "UPDATE artists SET name = ?2, email = ?3, phone = ?4, address = ?5, 
         notes = ?6, updated_at = ?7 WHERE id = ?1",
        params![&artist_id, &name, &email, &phone, &address, &notes, &now],
    )?;
    
    let created_at: String = conn.query_row(
        "SELECT created_at FROM artists WHERE id = ?1",
        params![&artist_id],
        |row| row.get(0),
    )?;
    
    Ok(Artist {
        id: artist_id,
        name,
        email,
        phone,
        address,
        notes,
        created_at,
        updated_at: now,
    })
}

pub fn delete_artist(artist_id: String) -> Result<()> {
    let conn = get_connection()?;
    conn.execute("DELETE FROM artists WHERE id = ?1", params![&artist_id])?;
    Ok(())
}

// Project functions
pub fn get_all_projects() -> Result<Vec<Project>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, artist_id, name, description, status, start_date, end_date, 
         budget, created_at, updated_at FROM projects ORDER BY created_at DESC"
    )?;
    
    let projects = stmt.query_map([], |row| {
        Ok(Project {
            id: row.get(0)?,
            artist_id: row.get(1)?,
            name: row.get(2)?,
            description: row.get(3)?,
            status: row.get(4)?,
            start_date: row.get(5)?,
            end_date: row.get(6)?,
            budget: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    })?
    .collect::<Result<Vec<_>>>()?;
    
    Ok(projects)
}

pub fn get_projects_by_artist(artist_id: String) -> Result<Vec<Project>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, artist_id, name, description, status, start_date, end_date, 
         budget, created_at, updated_at FROM projects 
         WHERE artist_id = ?1 ORDER BY created_at DESC"
    )?;
    
    let projects = stmt.query_map(params![&artist_id], |row| {
        Ok(Project {
            id: row.get(0)?,
            artist_id: row.get(1)?,
            name: row.get(2)?,
            description: row.get(3)?,
            status: row.get(4)?,
            start_date: row.get(5)?,
            end_date: row.get(6)?,
            budget: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    })?
    .collect::<Result<Vec<_>>>()?;
    
    Ok(projects)
}

pub fn create_project(
    artist_id: String,
    name: String,
    description: Option<String>,
    status: String,
    start_date: Option<String>,
    end_date: Option<String>,
    budget: f64,
) -> Result<Project> {
    let conn = get_connection()?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    
    conn.execute(
        "INSERT INTO projects (id, artist_id, name, description, status, 
         start_date, end_date, budget, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            &id, &artist_id, &name, &description, &status,
            &start_date, &end_date, &budget, &now, &now
        ],
    )?;
    
    Ok(Project {
        id,
        artist_id,
        name,
        description,
        status,
        start_date,
        end_date,
        budget,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn update_project(
    project_id: String,
    name: String,
    description: Option<String>,
    status: String,
    start_date: Option<String>,
    end_date: Option<String>,
    budget: f64,
) -> Result<Project> {
    let conn = get_connection()?;
    let now = Utc::now().to_rfc3339();
    
    conn.execute(
        "UPDATE projects SET name = ?2, description = ?3, status = ?4, 
         start_date = ?5, end_date = ?6, budget = ?7, updated_at = ?8 
         WHERE id = ?1",
        params![
            &project_id, &name, &description, &status,
            &start_date, &end_date, &budget, &now
        ],
    )?;
    
    let (artist_id, created_at): (String, String) = conn.query_row(
        "SELECT artist_id, created_at FROM projects WHERE id = ?1",
        params![&project_id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    )?;
    
    Ok(Project {
        id: project_id,
        artist_id,
        name,
        description,
        status,
        start_date,
        end_date,
        budget,
        created_at,
        updated_at: now,
    })
}

pub fn delete_project(project_id: String) -> Result<()> {
    let conn = get_connection()?;
    conn.execute("DELETE FROM projects WHERE id = ?1", params![&project_id])?;
    Ok(())
}

// Invoice functions
pub fn get_all_invoices() -> Result<Vec<Invoice>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, artist_id, project_id, invoice_number, amount, status, 
         issue_date, due_date, paid_date, items, notes, created_at, updated_at 
         FROM invoices ORDER BY created_at DESC"
    )?;
    
    let invoices = stmt.query_map([], |row| {
        Ok(Invoice {
            id: row.get(0)?,
            artist_id: row.get(1)?,
            project_id: row.get(2)?,
            invoice_number: row.get(3)?,
            amount: row.get(4)?,
            status: row.get(5)?,
            issue_date: row.get(6)?,
            due_date: row.get(7)?,
            paid_date: row.get(8)?,
            items: row.get(9)?,
            notes: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    })?
    .collect::<Result<Vec<_>>>()?;
    
    Ok(invoices)
}

pub fn get_invoices_by_artist(artist_id: String) -> Result<Vec<Invoice>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, artist_id, project_id, invoice_number, amount, status, 
         issue_date, due_date, paid_date, items, notes, created_at, updated_at 
         FROM invoices WHERE artist_id = ?1 ORDER BY created_at DESC"
    )?;
    
    let invoices = stmt.query_map(params![&artist_id], |row| {
        Ok(Invoice {
            id: row.get(0)?,
            artist_id: row.get(1)?,
            project_id: row.get(2)?,
            invoice_number: row.get(3)?,
            amount: row.get(4)?,
            status: row.get(5)?,
            issue_date: row.get(6)?,
            due_date: row.get(7)?,
            paid_date: row.get(8)?,
            items: row.get(9)?,
            notes: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    })?
    .collect::<Result<Vec<_>>>()?;
    
    Ok(invoices)
}

pub fn create_invoice(
    artist_id: String,
    project_id: Option<String>,
    invoice_number: String,
    amount: f64,
    status: String,
    issue_date: String,
    due_date: String,
    items: String,
    notes: Option<String>,
) -> Result<Invoice> {
    let conn = get_connection()?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    
    conn.execute(
        "INSERT INTO invoices (id, artist_id, project_id, invoice_number, amount, 
         status, issue_date, due_date, paid_date, items, notes, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            &id, &artist_id, &project_id, &invoice_number, &amount,
            &status, &issue_date, &due_date, &None::<String>, &items, &notes, &now, &now
        ],
    )?;
    
    Ok(Invoice {
        id,
        artist_id,
        project_id,
        invoice_number,
        amount,
        status,
        issue_date,
        due_date,
        paid_date: None,
        items,
        notes,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn update_invoice(
    invoice_id: String,
    invoice_number: String,
    amount: f64,
    status: String,
    issue_date: String,
    due_date: String,
    items: String,
    notes: Option<String>,
) -> Result<Invoice> {
    let conn = get_connection()?;
    let now = Utc::now().to_rfc3339();
    
    // If status changed to paid, set paid_date
    let paid_date = if status == "paid" {
        Some(now.clone())
    } else {
        None
    };
    
    conn.execute(
        "UPDATE invoices SET invoice_number = ?2, amount = ?3, status = ?4, 
         issue_date = ?5, due_date = ?6, paid_date = ?7, items = ?8, 
         notes = ?9, updated_at = ?10 WHERE id = ?1",
        params![
            &invoice_id, &invoice_number, &amount, &status,
            &issue_date, &due_date, &paid_date, &items, &notes, &now
        ],
    )?;
    
    let (artist_id, project_id, created_at): (String, Option<String>, String) = conn.query_row(
        "SELECT artist_id, project_id, created_at FROM invoices WHERE id = ?1",
        params![&invoice_id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
    )?;
    
    Ok(Invoice {
        id: invoice_id,
        artist_id,
        project_id,
        invoice_number,
        amount,
        status,
        issue_date,
        due_date,
        paid_date,
        items,
        notes,
        created_at,
        updated_at: now,
    })
}

pub fn delete_invoice(invoice_id: String) -> Result<()> {
    let conn = get_connection()?;
    conn.execute("DELETE FROM invoices WHERE id = ?1", params![&invoice_id])?;
    Ok(())
}