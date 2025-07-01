document.addEventListener('DOMContentLoaded', function() {
  const downloadBtn = document.getElementById('downloadBtn');
  const status = document.getElementById('status');
  const floatingButtonToggle = document.getElementById('floatingButtonToggle');

  function showStatus(message, type = 'info') {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    // Hide status after 3 seconds
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }

  function getCurrentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]);
      });
    });
  }

  async function executeScript(func, args = []) {
    const tab = await getCurrentTab();

    if (!tab.url.startsWith('https://tawreed.oq.com/')) {
      showStatus('Please navigate to Tawreed OQ portal (https://tawreed.oq.com) first', 'error');
      return null;
    }

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: func,
        args: args
      });
      return results[0].result;
    } catch (error) {
      console.error('Script execution error:', error);
      showStatus('Error executing script: ' + error.message, 'error');
      return null;
    }
  }



  downloadBtn.addEventListener('click', async () => {
    showStatus('Extracting table data...', 'info');
    
    const result = await executeScript(() => {
      // Function to extract table data
      function extractTableData() {
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
          return { error: 'Tender table not found. Please make sure you are on the tenders page.' };
        }

        const data = [];
        const rows = targetTbody.querySelectorAll('tr');

        // Columns to exclude from export
        const excludedColumns = [
          'unit price',
          'price',
          'vat type',
          'price inclusive of vat',
          'vat amount',
          'delivery period (days)',
          'row number'
        ];

        // Find header row to identify column names to exclude
        let headerColumns = [];
        const headerRow = targetTbody.querySelector('tr.table_cnt_head');
        if (headerRow) {
          const headerCells = headerRow.querySelectorAll('td, th');
          headerCells.forEach(cell => {
            // Handle nested tables in headers
            if (cell.querySelector('.nestedTable')) {
              const quantityCell = cell.querySelector('.quantityCell');
              const unitPriceCell = cell.querySelector('.unitPriceCell');

              if (quantityCell) {
                headerColumns.push(quantityCell.textContent.trim().toLowerCase());
              }
              if (unitPriceCell) {
                headerColumns.push(unitPriceCell.textContent.trim().toLowerCase());
              }
            } else {
              headerColumns.push(cell.textContent.trim().toLowerCase());
            }
          });
        }

        // Extract all rows (including headers) with original column order
        const rawData = [];
        rows.forEach(row => {
          // Skip the total row
          if (row.classList.contains('tableTotalTr')) {
            return;
          }

          const cells = row.querySelectorAll('td, th');
          const rowData = [];
          let columnIndex = 0;

          cells.forEach(cell => {
            // Skip cells that are part of nested tables (like quantity/unit price)
            if (cell.querySelector('.nestedTable')) {
              // For nested tables, we need to handle quantity and unit price as separate logical columns
              const quantityCell = cell.querySelector('.quantityCell');
              const unitPriceCell = cell.querySelector('.unitPriceCell');

              // Check if this cell contains quantity data and if quantity column should be included
              if (quantityCell) {
                const columnName = headerColumns[columnIndex] || '';
                if (!excludedColumns.some(excludedCol => columnName.includes(excludedCol))) {
                  let quantityText = quantityCell.textContent.trim().replace(/\s+/g, ' ');
                  rowData.push({ value: quantityText, originalIndex: columnIndex, columnName: columnName });
                }
                columnIndex++;
              }

              // Check if this cell contains unit price data and if unit price column should be included
              if (unitPriceCell) {
                const columnName = headerColumns[columnIndex] || '';
                if (!excludedColumns.some(excludedCol => columnName.includes(excludedCol))) {
                  let unitPriceText = unitPriceCell.textContent.trim().replace(/\s+/g, ' ');
                  rowData.push({ value: unitPriceText, originalIndex: columnIndex, columnName: columnName });
                }
                columnIndex++;
              }
            } else {
              // Regular cell - only include if not in excluded columns
              const columnName = headerColumns[columnIndex] || '';
              if (!excludedColumns.some(excludedCol => columnName.includes(excludedCol))) {
                let text = cell.textContent.trim();
                // Remove extra whitespace and line breaks
                text = text.replace(/\s+/g, ' ');
                rowData.push({ value: text, originalIndex: columnIndex, columnName: columnName });
              }
              columnIndex++;
            }
          });

          if (rowData.length > 0) {
            rawData.push(rowData);
          }
        });

        // Define column order preferences
        const columnOrderRules = [
          { pattern: /code/i, priority: 1 },
          { pattern: /material/i, priority: 2 },
          { pattern: /description/i, priority: 3 },
          { pattern: /remarks/i, priority: 4 },
          { pattern: /quantity/i, priority: 5 },
          { pattern: /unit of measurement|uom/i, priority: 6 },
          { pattern: /delivery location/i, priority: 7 },
          { pattern: /plant/i, priority: 8 },
          { pattern: /delivery date/i, priority: 9 }
        ];

        // Function to get column priority
        function getColumnPriority(columnName) {
          for (let rule of columnOrderRules) {
            if (rule.pattern.test(columnName)) {
              return rule.priority;
            }
          }
          return 999; // Default priority for unmatched columns
        }

        // Reorder columns based on priority rules
        if (rawData.length > 0) {
          // Sort columns by priority, keeping original order for same priority
          const sortedColumns = rawData[0]
            .map((col, index) => ({ ...col, sortIndex: index }))
            .sort((a, b) => {
              const priorityA = getColumnPriority(a.columnName);
              const priorityB = getColumnPriority(b.columnName);
              if (priorityA !== priorityB) {
                return priorityA - priorityB;
              }
              return a.sortIndex - b.sortIndex; // Keep original order for same priority
            });

          // Create column mapping
          const columnMapping = sortedColumns.map(col => col.sortIndex);

          // Reorder all rows according to the new column order
          rawData.forEach(row => {
            const reorderedRow = columnMapping.map(originalIndex => row[originalIndex].value);
            data.push(reorderedRow);
          });
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

        return {
          success: true,
          data: data,
          rowCount: data.length - 1, // excluding header
          columnCount: data.length > 0 ? data[0].length : 0,
          tenderInfo: getTenderInfo()
        };
      }

      return extractTableData();
    });

    if (result && result.success) {
      showStatus(`Extracted ${result.rowCount} rows, ${result.columnCount} columns`, 'success');

      // Convert to CSV and download
      const csvContent = result.data.map(row =>
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      // Generate filename with tender info
      let filename;
      if (result.tenderInfo) {
        // Clean the tender info for filename (remove invalid characters)
        const cleanTenderInfo = result.tenderInfo
          .replace(/[<>:"/\\|?*]/g, '_')  // Replace invalid filename characters
          .replace(/\s+/g, '_')           // Replace spaces with underscores
          .substring(0, 150);             // Limit length

        filename = `${cleanTenderInfo}.csv`;
      } else {
        filename = `tawreed_tender_table.csv`;
      }

      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      }, (downloadId) => {
        if (downloadId) {
          showStatus('Download started successfully!', 'success');
        } else {
          showStatus('Download failed', 'error');
        }
        URL.revokeObjectURL(url);
      });

    } else if (result && result.error) {
      showStatus(result.error, 'error');
    }
  });

  // Load floating button setting
  chrome.storage.sync.get(['floatingButtonEnabled'], function(result) {
    const enabled = result.floatingButtonEnabled !== false; // Default to true
    updateToggleState(enabled);
  });

  // Toggle functionality
  floatingButtonToggle.addEventListener('click', function() {
    const isCurrentlyActive = floatingButtonToggle.classList.contains('active');
    const newState = !isCurrentlyActive;

    // Update UI
    updateToggleState(newState);

    // Save setting
    chrome.storage.sync.set({ floatingButtonEnabled: newState });

    // Update content script
    updateFloatingButtonState(newState);
  });

  function updateToggleState(enabled) {
    if (enabled) {
      floatingButtonToggle.classList.add('active');
    } else {
      floatingButtonToggle.classList.remove('active');
    }
  }

  async function updateFloatingButtonState(enabled) {
    const tab = await getCurrentTab();

    if (!tab.url.startsWith('https://tawreed.oq.com/')) {
      return;
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function(enabled) {
          // Send message to content script to show/hide floating button
          window.postMessage({
            type: 'TAWREED_TOGGLE_FLOATING_BUTTON',
            enabled: enabled
          }, '*');
        },
        args: [enabled]
      });
    } catch (error) {
      console.error('Error updating floating button state:', error);
    }
  }
});
