document.addEventListener('DOMContentLoaded', () => {
    // Map waypoints
    const wpInstructions = document.getElementById('wp-instructions');
    const wpLoot = document.getElementById('wp-loot');
    const wpRules = document.getElementById('wp-rules');

    // Modals
    const modalInstructions = document.getElementById('modal-instructions');
    const modalLoot = document.getElementById('modal-loot');
    const modalRules = document.getElementById('modal-rules');

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

    // Video reveal logic
    const questVideo = document.getElementById('quest-video');
    const questInstructionsText = document.getElementById('quest-instructions-text');

    if (questVideo && questInstructionsText) {
        questVideo.addEventListener('ended', () => {
            questInstructionsText.style.display = 'block';
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
                const video = modal.querySelector('video');
                if (video) {
                    video.pause();
                }
            }
        });
        document.body.style.overflow = ''; // Restore scrolling
    }
});
