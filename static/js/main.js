// This file is ready for your custom JavaScript code
console.log('Website loaded successfully!');

document.addEventListener('DOMContentLoaded', function() {
    const messageTextarea = document.getElementById('message');
    const wordCount = document.querySelector('.word-count');
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('image-preview');
    const form = document.querySelector('.holi-form');
    const submitBtn = form.querySelector('button[type="submit"]');

    function updateWordCount() {
        const words = messageTextarea.value.trim().split(/\s+/).filter(word => word.length > 0);
        const count = words.length;
        wordCount.textContent = `${count} / 1000 words`;
    }

    function showAlert(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.left = '50%';
        alertDiv.style.transform = 'translateX(-50%)';
        alertDiv.style.padding = '15px 30px';
        alertDiv.style.borderRadius = '5px';
        alertDiv.style.backgroundColor = type === 'success' ? '#4CAF50' : '#f44336';
        alertDiv.style.color = 'white';
        alertDiv.style.zIndex = '1000';
        alertDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.style.opacity = '0';
            alertDiv.style.transition = 'opacity 0.5s ease';
            setTimeout(() => alertDiv.remove(), 500);
        }, 3000);
    }

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) {
            imagePreview.innerHTML = '';
            return;
        }

        // Check file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
            showAlert('Please select an image under 2MB', 'error');
            e.target.value = '';
            imagePreview.innerHTML = '';
            return;
        }

        // Check file type
        const fileType = file.type.toLowerCase();
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(fileType)) {
            showAlert('Please select a valid image file (JPG, PNG, or GIF)', 'error');
            e.target.value = '';
            imagePreview.innerHTML = '';
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.display = 'block';
            imagePreview.innerHTML = '';
            imagePreview.appendChild(img);
            showAlert('Image ready for upload', 'success');
        }
        reader.onerror = function() {
            showAlert('Error reading image file', 'error');
            e.target.value = '';
            imagePreview.innerHTML = '';
        }
        reader.readAsDataURL(file);
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Disable submit button and show loading state
        submitBtn.disabled = true;
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Uploading...';
        
        const formData = new FormData(form);
        
        fetch('/submit_story', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('Your story has been shared successfully!');
                form.reset();
                imagePreview.innerHTML = '';
                updateWordCount();
            } else {
                showAlert(data.message || 'An error occurred', 'error');
            }
        })
        .catch(error => {
            showAlert('An error occurred while submitting your story', 'error');
        })
        .finally(() => {
            // Re-enable submit button and restore text
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        });
    });

    messageTextarea.addEventListener('input', updateWordCount);
    imageInput.addEventListener('change', handleImageUpload);
}); 