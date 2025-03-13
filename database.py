import sqlite3
import os

def init_db():
    # Create uploads directory if it doesn't exist
    if not os.path.exists('static/uploads'):
        os.makedirs('static/uploads')

    conn = sqlite3.connect('holi_stories.db')
    c = conn.cursor()
    
    # Create table
    c.execute('''
        CREATE TABLE IF NOT EXISTS stories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            city TEXT NOT NULL,
            message TEXT NOT NULL,
            likes INTEGER DEFAULT 0,
            has_image BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db():
    conn = sqlite3.connect('holi_stories.db')
    conn.row_factory = sqlite3.Row
    return conn 