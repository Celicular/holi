import sqlite3
import os

def init_db():
    # Create uploads directory if it doesn't exist
    if not os.path.exists('static/uploads'):
        os.makedirs('static/uploads')

    conn = sqlite3.connect('holi_stories.db')
    c = conn.cursor()
    
    # Create stories table
    c.execute('''
        CREATE TABLE IF NOT EXISTS stories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            city TEXT NOT NULL,
            message TEXT NOT NULL,
            likes INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create likes table for tracking user likes
    c.execute('''
        CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            story_id INTEGER NOT NULL,
            session_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (story_id) REFERENCES stories (id),
            UNIQUE(story_id, session_id)
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db():
    conn = sqlite3.connect('holi_stories.db')
    conn.row_factory = sqlite3.Row
    return conn

def get_recent_stories(limit=4, session_id=None):
    db = get_db()
    cursor = db.cursor()
    cursor.execute('''
        SELECT stories.id, stories.name, stories.city, stories.message, 
               stories.likes, stories.created_at,
               CASE WHEN likes.id IS NOT NULL THEN 1 ELSE 0 END as user_has_liked
        FROM stories 
        LEFT JOIN likes ON stories.id = likes.story_id AND likes.session_id = ?
        ORDER BY stories.created_at DESC 
        LIMIT ?
    ''', (session_id, limit))
    stories = cursor.fetchall()
    stories_list = [dict(story) for story in stories]
    db.close()
    return stories_list

def get_story(story_id, session_id=None):
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('''
        SELECT stories.id, stories.name, stories.city, stories.message, 
               stories.likes, stories.created_at,
               CASE WHEN likes.id IS NOT NULL THEN 1 ELSE 0 END as user_has_liked
        FROM stories 
        LEFT JOIN likes ON stories.id = likes.story_id AND likes.session_id = ?
        WHERE stories.id = ?
    ''', (session_id, story_id))
    
    story = cursor.fetchone()
    db.close()
    return dict(story) if story else None

def toggle_like(story_id, session_id):
    db = get_db()
    cursor = db.cursor()
    
    try:
        # Try to insert a new like
        cursor.execute('''
            INSERT INTO likes (story_id, session_id)
            VALUES (?, ?)
        ''', (story_id, session_id))
        liked = True
    except sqlite3.IntegrityError:
        # If like exists, remove it
        cursor.execute('''
            DELETE FROM likes 
            WHERE story_id = ? AND session_id = ?
        ''', (story_id, session_id))
        liked = False
    
    # Update like count
    cursor.execute('''
        UPDATE stories 
        SET likes = (
            SELECT COUNT(*) 
            FROM likes 
            WHERE story_id = ?
        )
        WHERE id = ?
    ''', (story_id, story_id))
    
    # Get updated like count
    cursor.execute('SELECT likes FROM stories WHERE id = ?', (story_id,))
    likes_count = cursor.fetchone()[0]
    
    db.commit()
    db.close()
    
    return {
        'likes': likes_count,
        'user_has_liked': liked
    } 