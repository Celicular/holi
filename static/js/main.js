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
        e.preventDefault(); // Prevent default form submission
        
        const submitBtn = this.querySelector('.submit-btn');
        if (submitBtn.disabled) {
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span><div class="loading-spinner"></div>Sharing...</span>';
        
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
                // Reload the page after a short delay to show the new story
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                showAlert(data.message || 'An error occurred', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('An error occurred while submitting your story', 'error');
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Share Your Story</span>';
        });
    });

    messageTextarea.addEventListener('input', updateWordCount);
    imageInput.addEventListener('change', handleImageUpload);

    // Intersection Observer for story cards and sections
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (entry.target.tagName === 'H2') {
                    // Trigger story cards animation after section title
                    const cards = document.querySelectorAll('.story-card');
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.classList.add('visible');
                        }, index * 100); // Stagger the animations
                    });
                }
            }
        });
    }, observerOptions);

    // Observe section title
    const sectionTitle = document.querySelector('.stories-section h2');
    if (sectionTitle) observer.observe(sectionTitle);

    // Observe view all button container
    const viewAllContainer = document.querySelector('.view-all-container');
    if (viewAllContainer) observer.observe(viewAllContainer);

    // Enhanced modal animations
    const modal = document.getElementById('storyModal');
    const modalContent = modal.querySelector('.modal-content');

    function showModal() {
        modal.style.display = 'block';
        // Force reflow
        modal.offsetHeight;
        modal.classList.add('visible');
    }

    function hideModal() {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // Match the CSS transition duration
    }

    // Update modal show/hide functions
    window.showStoryModal = function(storyId) {
        fetch(`/get_story/${parseInt(storyId)}`)
            .then(response => response.json())
            .then(story => {
                // Try to load image with different extensions
                const modalImage = document.getElementById('modalImage');
                const extensions = ['jpg', 'jpeg', 'png', 'gif'];
                let loadedImage = false;

                function tryNextExtension(index) {
                    if (index >= extensions.length || loadedImage) return;
                    
                    modalImage.src = `/static/uploads/${story.id}/${story.id}.${extensions[index]}`;
                    modalImage.onerror = () => tryNextExtension(index + 1);
                    modalImage.onload = () => loadedImage = true;
                }

                tryNextExtension(0);
                
                document.getElementById('modalName').textContent = story.name;
                document.getElementById('modalCity').textContent = story.city;
                document.getElementById('modalMessage').textContent = story.message;
                document.getElementById('modalLikeCount').textContent = story.likes;
                document.getElementById('modalLikeBtn').setAttribute('data-story-id', story.id);
                document.getElementById('modalLikeBtn').classList.toggle('liked', story.user_has_liked);
                showModal();
            });
    }

    // Update close button and window click handlers
    document.querySelector('.close').onclick = hideModal;
    window.onclick = function(event) {
        if (event.target == modal) {
            hideModal();
        }
    }

    // Form animations
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach((group, index) => {
        group.style.opacity = '0';
        group.style.transform = 'translateY(20px)';
        setTimeout(() => {
            group.style.transition = 'all 0.5s ease';
            group.style.opacity = '1';
            group.style.transform = 'translateY(0)';
        }, 300 + index * 100);
    });

    // Image upload preview animation
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.style.opacity = '0';
                imagePreview.style.transform = 'scale(0.9)';
                imagePreview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; height: auto;">`;
                
                // Force reflow
                imagePreview.offsetHeight;
                
                imagePreview.style.transition = 'all 0.5s ease';
                imagePreview.style.opacity = '1';
                imagePreview.style.transform = 'scale(1)';
            };
            reader.readAsDataURL(file);
        }
    });
});

// Image preview functionality
document.getElementById('image').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('image-preview');
            preview.style.display = 'block';
            preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; height: auto;">`;
        };
        reader.readAsDataURL(file);
    }
});

// Word count functionality
document.getElementById('message').addEventListener('input', function(e) {
    const words = e.target.value.trim().split(/\s+/).length;
    document.querySelector('.word-count').textContent = `${words} / 1000 words`;
});

// Like functionality
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function likeStory(storyId) {
    const sessionId = getCookie('session_id');
    if (!sessionId) {
        // Create a session ID if it doesn't exist
        const newSessionId = Math.random().toString(36).substring(2);
        document.cookie = `session_id=${newSessionId}; path=/; max-age=86400`; // 24 hours
    }

    fetch(`/like_story/${parseInt(storyId)}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: getCookie('session_id')
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update like count in card and modal
            const likeBtn = document.querySelector(`.story-card[data-story-id="${storyId}"] .like-btn`);
            const likeCount = likeBtn.querySelector('.like-count');
            likeCount.textContent = data.likes;
            likeBtn.classList.toggle('liked', data.user_has_liked);

            // Update modal if open
            if (modal.style.display === 'block') {
                document.getElementById('modalLikeCount').textContent = data.likes;
                document.getElementById('modalLikeBtn').classList.toggle('liked', data.user_has_liked);
            }
        }
    });
} 