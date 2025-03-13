from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import os
from werkzeug.utils import secure_filename
from database import init_db, get_db

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
    return render_template('index.html')

@app.route('/submit_story', methods=['POST'])
def submit_story():
    try:
        name = request.form.get('name')
        city = request.form.get('city')
        message = request.form.get('message')
        
        if not all([name, city, message]):
            return jsonify({'success': False, 'message': 'Please fill in all required fields'})
        
        # Connect to database
        db = get_db()
        cursor = db.cursor()
        
        # Insert basic story data
        cursor.execute('''
            INSERT INTO stories (name, city, message, has_image)
            VALUES (?, ?, ?, ?)
        ''', (name, city, message, 0))
        
        story_id = cursor.lastrowid
        has_valid_image = False
        
        # Handle image upload if present
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename and allowed_file(file.filename):
                try:
                    # Check file size
                    file.seek(0, os.SEEK_END)
                    file_size = file.tell()
                    file.seek(0)
                    
                    if file_size > MAX_FILE_SIZE:
                        db.rollback()
                        return jsonify({'success': False, 'message': 'Image size exceeds 2MB limit'})
                    
                    # Create directory for this story's images
                    story_dir = os.path.join(app.config['UPLOAD_FOLDER'], str(story_id))
                    os.makedirs(story_dir, exist_ok=True)
                    
                    # Save the file
                    filename = secure_filename(file.filename)
                    file_path = os.path.join(story_dir, filename)
                    file.save(file_path)
                    has_valid_image = True
                    
                except Exception as e:
                    db.rollback()
                    return jsonify({'success': False, 'message': f'Error uploading image: {str(e)}'})
        
        # Update database to indicate image presence if upload was successful
        if has_valid_image:
            cursor.execute('''
                UPDATE stories
                SET has_image = 1
                WHERE id = ?
            ''', (story_id,))
        
        db.commit()
        db.close()
        
        return jsonify({'success': True, 'message': 'Your story has been shared successfully!'})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

if __name__ == '__main__':
    app.run(debug=True) 