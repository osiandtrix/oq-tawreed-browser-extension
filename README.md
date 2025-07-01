# Tawreed OQ Table Downloader Chrome Extension

A Chrome extension that allows users to easily download tables from the Tawreed OQ portal tenders page as CSV files.

## Features

- **Automatic Table Detection**: Automatically detects tender tables on Tawreed OQ portal pages
- **One-Click Download**: Download tables as CSV files with a single click
- **Floating Download Button**: Convenient floating button appears on pages with downloadable tables
- **CSV Export**: Exports data in CSV format that can be easily opened in Excel
- **Timestamp Naming**: Downloaded files include timestamp for easy organization

## Installation

1. **Download the Extension**
   - Clone or download this repository to your local machine

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" and select the extension folder
   - The extension should now appear in your extensions list

3. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Tawreed OQ Table Downloader" and click the pin icon

## Usage

### Method 1: Floating Button (Recommended)
1. Navigate to any Tawreed OQ portal page with tender tables
2. A blue "Download Table" button will automatically appear in the top-right corner
3. Click the button to instantly download the table as a CSV file

### Method 2: Extension Popup
1. Navigate to a Tawreed OQ portal page
2. Click the extension icon in your Chrome toolbar
3. Click "Download Table as Excel" in the popup
4. The table will be downloaded as a CSV file

### Method 3: Table Detection
1. Use the "Detect Tables" button in the popup to see how many tables are found on the current page
2. This helps verify you're on the right page before downloading

## File Format

- **Format**: CSV (Comma Separated Values)
- **Encoding**: UTF-8
- **Filename**: `tawreed_tender_table_YYYYMMDDTHHMMSS.csv`
- **Compatibility**: Can be opened directly in Excel, Google Sheets, or any spreadsheet application

## Supported Pages

The extension works on:
- `*.tawreed.oq.com/*`
- `tawreed.oq.com/*`

It specifically looks for tables containing tender information with columns like:
- Code
- Description
- Quantity
- Unit Price
- Remarks
- And other tender-related fields

## Troubleshooting

### Extension Not Working
- Make sure you're on a Tawreed OQ portal page
- Check that the page contains a tender table
- Try refreshing the page
- Ensure the extension is enabled in Chrome

### No Download Button Appears
- The floating button only appears on pages with detectable tender tables
- Try using the extension popup instead
- Check if you're on the correct page (tenders page)

### Download Fails
- Check your browser's download settings
- Ensure you have permission to download files
- Try using a different download location

### Table Not Detected
- Make sure you're on a page with a tender table
- The table should contain headers like "Code", "Description", "Quantity"
- Try scrolling to make sure the table is visible

## Technical Details

- **Manifest Version**: 3
- **Permissions**: activeTab, downloads
- **Content Scripts**: Runs on Tawreed OQ domains
- **File Format**: CSV with proper escaping for Excel compatibility

## Privacy

This extension:
- Only runs on Tawreed OQ portal pages
- Does not collect or transmit any personal data
- Only accesses table data for download purposes
- Does not store any data outside your local machine

## Support

For issues or feature requests, please contact your IT department or the extension developer.

## Version History

- **v1.0**: Initial release with table detection and CSV download functionality
