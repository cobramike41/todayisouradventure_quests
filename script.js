document.addEventListener('DOMContentLoaded', () => {
    // Map waypoints
    const wpInstructions = document.getElementById('wp-instructions');
    const wpLoot = document.getElementById('wp-loot');
    const wpRules = document.getElementById('wp-rules');
    const wpSubmit = document.getElementById('wp-submit');

    // Modals
    const modalInstructions = document.getElementById('modal-instructions');
    const modalLoot = document.getElementById('modal-loot');
    const modalRules = document.getElementById('modal-rules');
    const modalSubmit = document.getElementById('modal-submit');

    // Close buttons
    const closeBtns = document.querySelectorAll('.close-btn');

    // Open Modals
    wpInstructions.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(modalInstructions);
    });

    wpLoot.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(modalLoot);
    });

    wpRules.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(modalRules);
    });

    if (wpSubmit) {
        wpSubmit.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(modalSubmit);
        });
    }

    // Close Modals when clicking the close button
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });

    // Close Modals when clicking outside the content
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // Handle Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // YouTube Video reveal logic
    const questInstructionsText = document.getElementById('quest-instructions-text');
    let ytPlayer;

    // The YouTube API will call this function when it's ready.
    // It must be globally accessible, so we attach it to the window object.
    window.onYouTubeIframeAPIReady = function() {
        ytPlayer = new YT.Player('yt-player', {
            videoId: 'HaIgL0lQka4',
            playerVars: {
                'playsinline': 1,
                'controls': 1,
                'rel': 0
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    };

    function onPlayerReady(event) {
        // Player is ready
    }

    function onPlayerStateChange(event) {
        // YT.PlayerState.ENDED is 0
        if (event.data === YT.PlayerState.ENDED) {
            if (questInstructionsText) {
                questInstructionsText.style.display = 'block';
            }
        }
    }

    // Hook into the open modal for Instructions to try autoplay
    wpInstructions.addEventListener('click', (e) => {
        // e.preventDefault(); already called earlier in this file, but we'll leave it as is there.
        // Try to play the video when the modal opens
        if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
            // Some browsers require the video to be muted to autoplay, but the user requested sound.
            // By placing playVideo inside a click event handler, many browsers will allow it with sound.
            ytPlayer.playVideo();
        }
    });

    // Copy Info functionality
    const copyInfoBtn = document.getElementById('copy-info-btn');
    if (copyInfoBtn) {
        copyInfoBtn.addEventListener('click', () => {
            const name = document.getElementById('adventurer-name').value;
            const campsite = document.getElementById('campsite-number').value;

            if (!name || !campsite) {
                alert('Please enter both your Name and Campsite Number before copying.');
                return;
            }

            const textToCopy = `Quest Submission!\nName: ${name}\nCampsite: ${campsite}\n[Selfie Attached]`;

            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = copyInfoBtn.innerText;
                copyInfoBtn.innerText = '✅ Copied!';
                copyInfoBtn.style.backgroundColor = '#94b967'; // green
                copyInfoBtn.style.color = '#fff';

                setTimeout(() => {
                    copyInfoBtn.innerText = originalText;
                    copyInfoBtn.style.backgroundColor = '';
                    copyInfoBtn.style.color = '';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Failed to copy text. Please try selecting it manually.');
            });
        });
    }

    // Lightbox Logic
    const lootTiers = {
        legendary: ['Treasure_Chest.jpg'],
        superior: ['Superior_1.jpg', 'Superior_2.jpg', 'Superior_3.jpg', 'Superior_4.jpg', 'Superior_5.jpg', 'Superior_6.jpg'],
        epic: ['Epic_1.jpg'],
        rare: ['Rare_1.jpg', 'Rare_2.jpg'],
        uncommon: ['Uncommon_1.jpg'],
        common: ['Common_1.jpg']
    };

    const modalLightbox = document.getElementById('modal-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    let currentTierImages = [];
    let currentImageIndex = 0;

    const lootImages = document.querySelectorAll('.loot-img');
    lootImages.forEach(img => {
        img.addEventListener('click', () => {
            const tier = img.getAttribute('data-tier');
            if (tier && lootTiers[tier]) {
                currentTierImages = lootTiers[tier];

                // Find the index of the clicked image if it matches one in the array
                // For simplicity, we just open at index 0 for now since the main list shows _1.jpg
                // But let's try to match it based on src if possible
                const srcFilename = img.src.split('/').pop();
                const foundIndex = currentTierImages.findIndex(i => i === srcFilename);
                currentImageIndex = foundIndex !== -1 ? foundIndex : 0;

                updateLightboxImage();
                openModal(modalLightbox);
            }
        });
    });

    function updateLightboxImage() {
        if (currentTierImages.length === 0) return;

        lightboxImg.src = `Loot/${currentTierImages[currentImageIndex]}`;

        if (currentTierImages.length <= 1) {
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        } else {
            prevBtn.disabled = false;
            nextBtn.disabled = false;
        }
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent closing modal if clicking button
            if (currentTierImages.length <= 1) return;
            currentImageIndex = (currentImageIndex - 1 + currentTierImages.length) % currentTierImages.length;
            updateLightboxImage();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentTierImages.length <= 1) return;
            currentImageIndex = (currentImageIndex + 1) % currentTierImages.length;
            updateLightboxImage();
        });
    }

    function openModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeAllModals() {
        const activeModals = document.querySelectorAll('.modal.active');
        activeModals.forEach(modal => {
            modal.classList.remove('active');

            // Pause video if it's playing in the instructions modal
            if (modal.id === 'modal-instructions') {
                if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
                    ytPlayer.pauseVideo();
                }

                // Hide instructions again when modal is closed
                if (questInstructionsText) {
                    questInstructionsText.style.display = 'none';
                }
            }
        });
        document.body.style.overflow = ''; // Restore scrolling
    }
});
