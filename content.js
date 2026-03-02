const applySpeed = (video) => {
    chrome.storage.sync.get("defaultSpeed", ({ defaultSpeed }) => {
        const targetSpeed = defaultSpeed || 1.25;

        // Force the speed
        video.playbackRate = targetSpeed;

        // Some players (like YouTube/Udemy) need a tiny nudge
        // to "stick" the speed right as the video starts.
        setTimeout(() => {
            video.playbackRate = targetSpeed;
        }, 500);
    });
};

const setupVideo = (video) => {
    // 1. Try to set it immediately
    applySpeed(video);

    // 2. Set it when the video actually starts playing
    video.addEventListener('play', () => applySpeed(video));

    // 3. Set it when the video finishes loading its data (Crucial for YouTube)
    video.addEventListener('loadedmetadata', () => applySpeed(video));

    // 4. If the site tries to change it back to 1.0, snap it back
    video.addEventListener('ratechange', (e) => {
        chrome.storage.sync.get("defaultSpeed", ({ defaultSpeed }) => {
            const targetSpeed = defaultSpeed || 1.25;
            if (video.playbackRate !== targetSpeed) {
                video.playbackRate = targetSpeed;
            }
        });
    });
};

// Watch for new videos being added to the page
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
            if (node.nodeName === 'VIDEO') {
                setupVideo(node);
            } else if (node.querySelectorAll) {
                node.querySelectorAll('video').forEach(setupVideo);
            }
        });
    }
});

observer.observe(document.documentElement, {
    childList: true,
    subtree: true
});

// Initial scan for existing videos
document.querySelectorAll('video').forEach(setupVideo);
