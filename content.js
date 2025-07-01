// Content script for Tawreed OQ Table Downloader
// This script runs on Tawreed OQ portal pages

(function() {
  'use strict';
  
  // Add a floating download button to the page
  function createFloatingButton() {
    // Check if button already exists
    if (document.getElementById('tawreed-download-btn')) {
      return;
    }

    // Only add button if we detect a tender table
    let hasTenderTable = false;

    // Look for section headers with "Price - Price Section" pattern
    const sectionHeaders = document.querySelectorAll('h4');
    for (let header of sectionHeaders) {
      const headerText = header.textContent.toLowerCase();
      if (headerText.includes('price') && headerText.includes('price section')) {
        // Found a price section header, now look for the associated table
        const groupDiv = header.querySelector('[id*="group"]');
        if (groupDiv) {
          const groupId = groupDiv.id;
          const groupNumber = groupId.replace('group', '');

          // Look for tbody with matching group number
          const tbody = document.querySelector(`tbody[class*="collapseElement_group${groupNumber}"]`);
          if (tbody) {
            const headerRow = tbody.querySelector('tr.table_cnt_head');
            if (headerRow) {
              const tableHeaderText = headerRow.textContent.toLowerCase();
              if (tableHeaderText.includes('code') &&
                  tableHeaderText.includes('description') &&
                  (tableHeaderText.includes('quantity') || tableHeaderText.includes('unit of measurement'))) {
                hasTenderTable = true;
                break;
              }
            }
          }
        }
      }
    }

    // Fallback: check all tables for the standard structure
    if (!hasTenderTable) {
      const tables = document.querySelectorAll('table');
      for (let table of tables) {
        const headerText = table.textContent.toLowerCase();
        if (headerText.includes('code') &&
            headerText.includes('description') &&
            (headerText.includes('quantity') || headerText.includes('unit of measurement'))) {
          hasTenderTable = true;
          break;
        }
      }
    }

    if (!hasTenderTable) {
      return;
    }
    
    const button = document.createElement('div');
    button.id = 'tawreed-download-btn';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Download Table
    `;
    
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: #2c5aa0;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      border: none;
      user-select: none;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.background = '#1e3d6f';
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = '#2c5aa0';
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
    
    button.addEventListener('click', downloadTable);
    
    document.body.appendChild(button);
  }
  
  function downloadTable() {
    try {
      // Find the tender table by looking for section headers first
      let targetTbody = null;

      // Look for section headers with "Price - Price Section" pattern
      const sectionHeaders = document.querySelectorAll('h4');
      for (let header of sectionHeaders) {
        const headerText = header.textContent.toLowerCase();
        if (headerText.includes('price') && headerText.includes('price section')) {
          // Found a price section header, now look for the associated table
          const groupDiv = header.querySelector('[id*="group"]');
          if (groupDiv) {
            const groupId = groupDiv.id;
            const groupNumber = groupId.replace('group', '');

            // Look for tbody with matching group number
            const tbody = document.querySelector(`tbody[class*="collapseElement_group${groupNumber}"]`);
            if (tbody) {
              const headerRow = tbody.querySelector('tr.table_cnt_head');
              if (headerRow) {
                const tableHeaderText = headerRow.textContent.toLowerCase();
                if (tableHeaderText.includes('code') &&
                    tableHeaderText.includes('description') &&
                    (tableHeaderText.includes('quantity') || tableHeaderText.includes('unit of measurement'))) {
                  targetTbody = tbody;
                  break;
                }
              }
            }
          }
        }
      }

      // Fallback: look for any tbody with collapseElement_group class
      if (!targetTbody) {
        const collapseElements = document.querySelectorAll('tbody[class*="collapseElement_group"]');
        for (let tbody of collapseElements) {
          const headerRow = tbody.querySelector('tr.table_cnt_head');
          if (headerRow) {
            const headerText = headerRow.textContent.toLowerCase();
            if (headerText.includes('code') &&
                headerText.includes('description') &&
                (headerText.includes('quantity') || headerText.includes('unit of measurement'))) {
              targetTbody = tbody;
              break;
            }
          }
        }
      }

      if (!targetTbody) {
        showNotification('Tender table not found on this page', 'error');
        return;
      }

      const data = [];
      const rows = targetTbody.querySelectorAll('tr');

      // Extract all rows (including headers)
      rows.forEach(row => {
        // Skip the total row
        if (row.classList.contains('tableTotalTr')) {
          return;
        }

        const cells = row.querySelectorAll('td, th');
        const rowData = [];

        cells.forEach(cell => {
          // Skip cells that are part of nested tables (like quantity/unit price)
          if (cell.querySelector('.nestedTable')) {
            // Extract quantity and unit price separately
            const quantityCell = cell.querySelector('.quantityCell');
            const unitPriceCell = cell.querySelector('.unitPriceCell');

            if (quantityCell) {
              let quantityText = quantityCell.textContent.trim().replace(/\s+/g, ' ');
              rowData.push(quantityText);
            }

            if (unitPriceCell) {
              let unitPriceText = unitPriceCell.textContent.trim().replace(/\s+/g, ' ');
              rowData.push(unitPriceText);
            }
          } else {
            // Regular cell
            let text = cell.textContent.trim();
            // Remove extra whitespace and line breaks
            text = text.replace(/\s+/g, ' ');
            rowData.push(text);
          }
        });

        if (rowData.length > 0) {
          data.push(rowData);
        }
      });

      if (data.length === 0) {
        showNotification('No data found in table', 'error');
        return;
      }

      // Extract tender information for filename
      function getTenderInfo() {
        // Look for the tender title in various possible locations
        const selectors = [
          'span.mainTitle',
          '.mainTitle',
          'span[class*="title"]',
          'h1',
          'h2',
          '.tender-title',
          '.page-title'
        ];

        for (let selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent.includes('Tender:')) {
            const fullText = element.textContent.trim();
            const tenderMatch = fullText.match(/Tender:\s*(.+)/i);
            if (tenderMatch) {
              return tenderMatch[1].trim();
            }
          }
        }

        // Fallback: look for any element containing "Tender:"
        const allElements = document.querySelectorAll('*');
        for (let element of allElements) {
          if (element.textContent && element.textContent.includes('Tender:')) {
            const fullText = element.textContent.trim();
            const tenderMatch = fullText.match(/Tender:\s*(.+)/i);
            if (tenderMatch) {
              return tenderMatch[1].trim();
            }
          }
        }

        return null;
      }

      // Convert to CSV
      const csvContent = data.map(row =>
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      // Generate filename with tender info
      const tenderInfo = getTenderInfo();

      let filename;
      if (tenderInfo) {
        // Clean the tender info for filename (remove invalid characters)
        const cleanTenderInfo = tenderInfo
          .replace(/[<>:"/\\|?*]/g, '_')  // Replace invalid filename characters
          .replace(/\s+/g, '_')           // Replace spaces with underscores
          .substring(0, 150);             // Limit length

        filename = `${cleanTenderInfo}.csv`;
      } else {
        filename = `tawreed_tender_table.csv`;
      }

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification(`Downloaded ${data.length - 1} rows successfully!`, 'success');

    } catch (error) {
      console.error('Download error:', error);
      showNotification('Error downloading table: ' + error.message, 'error');
    }
  }
  
  function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.getElementById('tawreed-notification');
    if (existing) {
      existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.id = 'tawreed-notification';
    notification.textContent = message;
    
    const bgColor = type === 'success' ? '#d4edda' : 
                   type === 'error' ? '#f8d7da' : '#d1ecf1';
    const textColor = type === 'success' ? '#155724' : 
                     type === 'error' ? '#721c24' : '#0c5460';
    
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 10001;
      background: ${bgColor};
      color: ${textColor};
      padding: 12px 16px;
      border-radius: 6px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: 300px;
      word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 4000);
  }
  
  // Initialize when page loads
  function init() {
    // Wait for page to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createFloatingButton);
    } else {
      createFloatingButton();
    }
    
    // Also check when page content changes (for SPAs)
    const observer = new MutationObserver(() => {
      setTimeout(createFloatingButton, 1000);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  init();
})();
