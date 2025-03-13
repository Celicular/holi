from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
import os
from werkzeug.utils import secure_filename
from database import init_db, get_db, get_recent_stories, get_story, toggle_like
import uuid

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Change this to a secure secret key

# Initialize database
init_db()

# Configure upload settings
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

# Create uploads directory if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def home():
    # Get session ID or create new one
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    
    stories = get_recent_stories(4, session.get('session_id'))
    return render_template('index.html', stories=stories)

@app.route('/submit_story', methods=['POST'])
def submit_story():
    db = None
    try:
        name = request.form.get('name')
        city = request.form.get('city')
        message = request.form.get('message')
        
        if not all([name, city, message]):
            return jsonify({'success': False, 'message': 'Please fill in all required fields'})
        
        # Check if image was uploaded
        if 'image' not in request.files:
            return jsonify({'success': False, 'message': 'Image is required'})
            
        file = request.files['image']
        if not file or not file.filename:
            return jsonify({'success': False, 'message': 'Image is required'})
            
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'message': 'Invalid image format'})
        
        # Check file size before saving
        file_content = file.read()
        file.seek(0)  # Reset file pointer after reading
        if len(file_content) > MAX_FILE_SIZE:
            return jsonify({'success': False, 'message': 'File size exceeds 2MB limit'})
        
        # Connect to database
        db = get_db()
        cursor = db.cursor()
        
        # Insert story data
        cursor.execute('''
            INSERT INTO stories (name, city, message)
            VALUES (?, ?, ?)
        ''', (name, city, message))
        
        story_id = cursor.lastrowid
        
        # Create directory for this story's image
        story_dir = os.path.join(app.config['UPLOAD_FOLDER'], str(story_id))
        os.makedirs(story_dir, exist_ok=True)
        
        # Save the file using story ID as filename with original extension
        extension = file.filename.rsplit('.', 1)[1].lower()
        file_path = os.path.join(story_dir, f"{story_id}.{extension}")
        file.save(file_path)
        
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Your story has been shared successfully!',
            'story_id': story_id
        })
        
    except Exception as e:
        if db:
            db.rollback()  # Rollback transaction on error
        app.logger.error(f"Error in submit_story: {str(e)}")
        return jsonify({'success': False, 'message': 'An error occurred while saving your story'})
    finally:
        if db:
            db.close()

@app.route('/get_story/<int:story_id>')
def get_story_details(story_id):
    session_id = session.get('session_id')
    story = get_story(story_id, session_id)
    if story:
        return jsonify(story)
    return jsonify({'error': 'Story not found'}), 404

@app.route('/like_story/<int:story_id>', methods=['POST'])
def like_story(story_id):
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({'success': False, 'message': 'Invalid session'}), 400
            
        result = toggle_like(story_id, session_id)
        return jsonify({'success': True, **result})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/all_stories')
def all_stories():
    # This will be implemented later
    return "Coming Soon!"

if __name__ == '__main__':
    app.run(debug=True) 