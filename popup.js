document.addEventListener('DOMContentLoaded', function() {
  const downloadBtn = document.getElementById('downloadBtn');
  const detectBtn = document.getElementById('detectBtn');
  const status = document.getElementById('status');

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

  detectBtn.addEventListener('click', async () => {
    showStatus('Detecting tables...', 'info');
    
    const result = await executeScript(() => {
      // Look for tables on the page, prioritizing collapseElement_group tables
      const tables = document.querySelectorAll('table');
      const tableInfo = [];
      let tenderTablesFound = 0;

      // Check for tables within collapseElement_group
      const collapseElements = document.querySelectorAll('[class*="collapseElement_group"]');
      collapseElements.forEach((element, index) => {
        const table = element.querySelector('table');
        if (table) {
          const rows = table.querySelectorAll('tr');
          const headers = table.querySelectorAll('th');
          const headerText = table.textContent.toLowerCase();
          const isTenderTable = headerText.includes('code') &&
                               headerText.includes('description') &&
                               (headerText.includes('quantity') || headerText.includes('unit of measurement'));

          if (isTenderTable) tenderTablesFound++;

          tableInfo.push({
            index: `collapse-${index}`,
            rows: rows.length,
            headers: headers.length,
            hasHeaders: headers.length > 0,
            visible: table.offsetParent !== null,
            isTenderTable: isTenderTable,
            location: 'collapseElement_group'
          });
        }
      });

      // Also check other tables
      tables.forEach((table, index) => {
        const rows = table.querySelectorAll('tr');
        const headers = table.querySelectorAll('th');
        const headerText = table.textContent.toLowerCase();
        const isTenderTable = headerText.includes('code') &&
                             headerText.includes('description') &&
                             (headerText.includes('quantity') || headerText.includes('unit of measurement'));

        // Only count if not already counted in collapseElement_group
        const isInCollapseGroup = table.closest('[class*="collapseElement_group"]');
        if (!isInCollapseGroup && isTenderTable) {
          tenderTablesFound++;
        }

        if (!isInCollapseGroup) {
          tableInfo.push({
            index: index,
            rows: rows.length,
            headers: headers.length,
            hasHeaders: headers.length > 0,
            visible: table.offsetParent !== null,
            isTenderTable: isTenderTable,
            location: 'general'
          });
        }
      });

      return {
        tablesFound: tables.length,
        tenderTablesFound: tenderTablesFound,
        tableInfo: tableInfo,
        url: window.location.href
      };
    });

    if (result) {
      if (result.tablesFound > 0) {
        showStatus(`Found ${result.tablesFound} table(s) on page`, 'success');
      } else {
        showStatus('No tables found on this page', 'error');
      }
    }
  });

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
});
