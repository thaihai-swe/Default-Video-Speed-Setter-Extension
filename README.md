# Default Video Speed Setter

A Chrome extension that automatically sets a default playback speed for all videos across the web.

## Overview

Default Video Speed Setter is a lightweight browser extension that automatically applies your preferred playback speed to video players on any website. Whether you're watching YouTube, Udemy, Netflix, or any other video platform, this extension ensures all videos play at your desired speed by default.

## Features

- 🎬 **Universal Support** - Works with videos on any website
- ⚙️ **Customizable Speed** - Set a default playback speed (0.25x to 5x)
- 💾 **Persistent Settings** - Your speed preference is saved and synced across devices
- 🔄 **Automatic Reapplication** - Prevents websites from resetting your speed preference
- 🎯 **Smart Detection** - Catches dynamically loaded videos on single-page applications
- ⚡ **Lightweight** - Minimal performance impact

## Installation



### Manual Installation (Developer Mode)
1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `default_video_playspeed` folder

## Usage

### Setting Your Default Speed

1. Click the extension icon in your Chrome toolbar
2. A settings panel will open
3. Enter your preferred playback speed (e.g., 1.5, 2.0)
4. Click "Save Settings"

### Supported Speed Range

- Minimum: 0.25x
- Maximum: 5x
- Default: 1.25x
- Increment: 0.25x steps

## How It Works

The extension uses a Content Script that:

1. **Initial Scan** - Detects all existing `<video>` elements on page load
2. **Event Listeners** - Monitors for dynamically added videos using MutationObserver
3. **Multi-Point Detection** - Applies speed at multiple stages (immediate, on play, on metadata load)
4. **Prevention** - Watches for websites trying to reset playback speed and reapplies your preference

This ensures your speed preference sticks even on websites with aggressive player controls like YouTube and Udemy.

## Project Structure

```
default_video_playspeed/
├── manifest.json      # Extension configuration and metadata
├── content.js         # Main script that applies playback speed
├── options.html       # Settings UI
├── options.js         # Settings handler and storage logic
└── README.md          # This file
```

## Technical Details

### Manifest Version
- **Manifest V3** - Uses modern Chrome extension standards

### Permissions
- `storage` - Saves and syncs your playback speed preference

### Content Script Scope
- Runs on `<all_urls>` - All websites
- Runs at `document_end` - After page content is loaded

## Troubleshooting

### Speed not applying to a specific website?
- Some video players might have additional protection. Try refreshing the page.
- Ensure the extension is enabled in your extensions menu.

### Settings not saving?
- Check that you're signed into your Google account (required for Chrome sync).
- Try opening the extension settings again and resaving.

### Performance issues?
- This extension is lightweight and shouldn't affect performance.
- If you experience issues, try disabling the extension and re-enabling it.

## Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Edge (Chromium-based)
- ✅ Brave
- ✅ Opera
- ❌ Firefox (would require different manifest format)
- ❌ Safari (requires App Store submission)

## Contributing

Feel free to fork this project and submit pull requests for improvements, bug fixes, or new features.

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have feature requests, please open an issue in this repository.

---

**Enjoy faster video playback across the web!** 🚀
