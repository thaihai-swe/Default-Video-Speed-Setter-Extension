// Ensure the script initializes only once per page/frame to avoid
// multiple observers and duplicated event listeners which can cause
// high memory usage and browser instability.
if (window.__defaultVideoSpeedSetterInitialized) {
    // Already initialized in this frame — do nothing.
    console.debug('Default Video Speed Setter: already initialized');
} else {
    window.__defaultVideoSpeedSetterInitialized = true;

    const applySpeed = (video) => {
        chrome.storage.sync.get("defaultSpeed", ({ defaultSpeed }) => {
            const targetSpeed = defaultSpeed || 1.25;

            // Force the speed
            try {
                video.playbackRate = targetSpeed;
            } catch (err) {
                // Some exotic players might throw — ignore safely
            }

            // Some players (like YouTube/Udemy) need a tiny nudge
            // to "stick" the speed right as the video starts.
            setTimeout(() => {
                try { video.playbackRate = targetSpeed; } catch (e) {}
            }, 500);
        });
    };

    const setupVideo = (video) => {
        if (!video) return;

        // Prevent attaching duplicate listeners to the same element
        if (video.__defaultSpeedSetupDone) return;
        video.__defaultSpeedSetupDone = true;

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
                    try { video.playbackRate = targetSpeed; } catch (e) {}
                }
            });
        });
    };

    // If an observer already exists on the window, reuse it instead of
    // creating a new one. This avoids multiple MutationObservers.
    if (!window.__defaultVideoSpeedSetterObserver) {
        window.__defaultVideoSpeedSetterObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (!node) return;
                    if (node.nodeName === 'VIDEO') {
                        setupVideo(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('video').forEach(setupVideo);
                    }
                });
            }
        });

        window.__defaultVideoSpeedSetterObserver.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    // Initial scan for existing videos
    document.querySelectorAll('video').forEach(setupVideo);
}
