// Ensure the script initializes only once per page/frame to avoid
// multiple observers and duplicated event listeners which can cause
// high memory usage and browser instability.
if (window.__defaultVideoSpeedSetterInitialized) {
    // Already initialized in this frame - do nothing.
    console.debug('Default Video Speed Setter: already initialized');
} else {
    window.__defaultVideoSpeedSetterInitialized = true;

    // ============================================================================
    // PERFORMANCE & MEMORY OPTIMIZATION
    // ============================================================================

    // Cache for storage values to avoid repeated I/O
    let cachedSpeed = 1.25;
    let cachedDomainSettings = {};
    let cacheExpiry = 0;

    // Map to track video elements and their cleanup handlers
    const videoTracking = new WeakMap();

    // Debounce timer for mutation observer
    let mutationDebounceTimer = null;
    const MUTATION_DEBOUNCE_MS = 100;

    /**
     * Load speed settings from storage (cached)
     */
    const loadSpeedSettings = () => {
        return new Promise((resolve) => {
            const now = Date.now();
            // Cache for 5 seconds to reduce I/O
            if (now < cacheExpiry) {
                resolve({ speed: cachedSpeed, domainSettings: cachedDomainSettings });
                return;
            }

            chrome.storage.sync.get(["defaultSpeed", "domainSettings"], (result) => {
                cachedSpeed = result.defaultSpeed || 1.25;
                cachedDomainSettings = result.domainSettings || {};
                cacheExpiry = now + 5000;
                resolve({ speed: cachedSpeed, domainSettings: cachedDomainSettings });
            });
        });
    };

    /**
     * Get the target speed for current domain
     */
    const getTargetSpeed = async () => {
        const { speed, domainSettings } = await loadSpeedSettings();
        const domain = extractDomain(window.location.hostname);
        return domainSettings[domain] || speed;
    };

    /**
     * Extract root domain from hostname
     */
    const extractDomain = (hostname) => {
        // Remove www. prefix if present
        return hostname.replace(/^www\./, '');
    };

    /**
     * Apply speed to video with proper error handling
     */
    const applySpeed = async (video) => {
        if (!video || video.__speedApplying) return;

        try {
            const targetSpeed = await getTargetSpeed();

            // Validate speed
            if (targetSpeed < 0.25 || targetSpeed > 5) {
                console.warn(`Invalid speed value: ${targetSpeed}`);
                return;
            }

            video.playbackRate = targetSpeed;

            // Some players (like YouTube/Udemy) need a tiny nudge
            // to "stick" the speed right as the video starts.
            // Use AbortController to ensure cleanup
            const abortController = videoTracking.get(video)?.abortController;
            if (abortController) {
                const timeout = setTimeout(() => {
                    try {
                        if (video.parentElement) video.playbackRate = targetSpeed;
                    } catch (e) {}
                }, 500);

                abortController.signal.addEventListener('abort', () => clearTimeout(timeout));
            }
        } catch (err) {
            console.error('Error applying speed:', err);
        }
    };

    /**
     * Setup video element with proper cleanup handlers
     */
    const setupVideo = (video) => {
        if (!video) return;

        // Prevent attaching duplicate listeners to the same element
        if (videoTracking.has(video)) return;

        // Create abort controller for this video's listeners
        const abortController = new AbortController();
        videoTracking.set(video, { abortController });

        // 1. Try to set it immediately
        applySpeed(video);

        // 2. Set it when the video actually starts playing
        video.addEventListener('play', () => applySpeed(video), { signal: abortController.signal });

        // 3. Set it when the video finishes loading its data (Crucial for YouTube)
        video.addEventListener('loadedmetadata', () => applySpeed(video), { signal: abortController.signal });

        // 4. If the site tries to change it back, snap it back (debounced)
        let ratechangeTimeout = null;
        video.addEventListener('ratechange', (e) => {
            if (ratechangeTimeout) clearTimeout(ratechangeTimeout);
            ratechangeTimeout = setTimeout(async () => {
                if (video.parentElement) { // Check if still in DOM
                    const targetSpeed = await getTargetSpeed();
                    if (Math.abs(video.playbackRate - targetSpeed) > 0.01) { // Floating point tolerance
                        try { video.playbackRate = targetSpeed; } catch (e) {}
                    }
                }
            }, 50); // Debounce ratechange

            abortController.signal.addEventListener('abort', () => clearTimeout(ratechangeTimeout));
        }, { signal: abortController.signal });

        // Cleanup when video is removed from DOM
        const observer = new MutationObserver(() => {
            if (!document.contains(video)) {
                abortController.abort();
                observer.disconnect();
                videoTracking.delete(video);
            }
        });

        observer.observe(video.parentElement || document.body, {
            childList: true,
            subtree: false
        });
    };

    /**
     * Debounced mutation observer to process DOM changes efficiently
     */
    if (!window.__defaultVideoSpeedSetterObserver) {
        const processMutations = (mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (!node) return;
                    if (node.nodeName === 'VIDEO') {
                        setupVideo(node);
                    } else if (node.querySelectorAll) {
                        try {
                            node.querySelectorAll('video').forEach(setupVideo);
                        } catch (e) {
                            // Some elements throw on querySelectorAll (e.g., SVG)
                        }
                    }
                });
            }
        };

        const debouncedMutationProcessor = (mutations) => {
            if (mutationDebounceTimer) clearTimeout(mutationDebounceTimer);
            mutationDebounceTimer = setTimeout(() => {
                processMutations(mutations);
                mutationDebounceTimer = null;
            }, MUTATION_DEBOUNCE_MS);
        };

        window.__defaultVideoSpeedSetterObserver = new MutationObserver(debouncedMutationProcessor);

        window.__defaultVideoSpeedSetterObserver.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    // Initial scan for existing videos
    document.querySelectorAll('video').forEach(setupVideo);

    // Listen for storage changes from other tabs/windows
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && (changes.defaultSpeed || changes.domainSettings)) {
            // Invalidate cache
            cacheExpiry = 0;
            // Reapply speed to all videos
            document.querySelectorAll('video').forEach(applySpeed);
        }
    });
}
