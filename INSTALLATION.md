# Installation Guide - Tawreed OQ Table Downloader

## Quick Installation Steps

### 1. Download the Extension
- Download or clone this repository to your computer
- Extract the files if downloaded as a ZIP

### 2. Open Chrome Extensions Page
- Open Google Chrome
- Type `chrome://extensions/` in the address bar and press Enter
- OR click the three dots menu → More tools → Extensions

### 3. Enable Developer Mode
- In the top-right corner of the Extensions page, toggle "Developer mode" ON
- This will show additional buttons

### 4. Load the Extension
- Click the "Load unpacked" button
- Navigate to and select the folder containing the extension files
- The extension should now appear in your list

### 5. Pin the Extension (Recommended)
- Click the puzzle piece icon (🧩) in Chrome's toolbar
- Find "Tawreed OQ Table Downloader" in the list
- Click the pin icon (📌) next to it
- The extension icon will now appear in your toolbar

## Verification

### Test the Installation
1. Navigate to the Tawreed OQ portal
2. Go to a page with tender tables
3. You should see:
   - A blue "Download Table" button in the top-right corner
   - The extension icon in your toolbar (if pinned)

### If Something Goes Wrong
- Make sure all files are in the same folder
- Check that Developer mode is enabled
- Try refreshing the Extensions page
- Restart Chrome if needed

## Updating the Extension

When you receive updates:
1. Replace the old files with new ones
2. Go to `chrome://extensions/`
3. Find the extension and click the refresh icon (🔄)
4. The extension will reload with the new version

## Uninstalling

To remove the extension:
1. Go to `chrome://extensions/`
2. Find "Tawreed OQ Table Downloader"
3. Click "Remove"
4. Confirm the removal

## Troubleshooting

### Extension Won't Load
- Check that all required files are present:
  - manifest.json
  - popup.html
  - popup.js
  - content.js
  - styles.css
- Ensure Developer mode is enabled
- Check the Console tab in Extensions page for error messages

### Extension Loads But Doesn't Work
- Make sure you're on a Tawreed OQ portal page
- Check that the page contains tender tables
- Try refreshing the page
- Check browser console for errors (F12 → Console)

### Download Button Doesn't Appear
- The button only shows on pages with detectable tender tables
- Make sure you're on the tenders page
- Try scrolling to ensure the table is loaded
- Use the extension popup as an alternative

## Browser Compatibility

- **Supported**: Chrome 88+, Edge 88+, Opera 74+
- **Not Supported**: Firefox (uses different extension format)
- **Recommended**: Latest version of Chrome

## Permissions Explained

The extension requests these permissions:
- **activeTab**: To read table data from the current tab
- **downloads**: To save CSV files to your computer
- **host_permissions**: To run only on Tawreed OQ portal pages

## Security Notes

- Extension only runs on Tawreed OQ domains
- No data is sent to external servers
- All processing happens locally in your browser
- Downloaded files stay on your computer
