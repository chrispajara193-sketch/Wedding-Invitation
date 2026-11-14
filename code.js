// ==========================================
// GOOGLE APPS SCRIPT (code.gs)
// Attach this to a Google Sheet via:
// Extensions -> Apps Script
// ==========================================

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'Wedding RSVP endpoint is active!' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Wait up to 10s to prevent simultaneous write conflicts

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Auto-create headers if the sheet is completely empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Full Name',
        'Email',
        'Attending',
        'Seats',
        'Dietary / Song Request'
      ]);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    }

    // Parse incoming data (sent as text/plain JSON to avoid CORS preflight issues)
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    sheet.appendRow([
      new Date(),
      data.name || '',
      data.email || '',
      data.attendance === 'yes' ? 'Joyfully Accepts' : 'Regretfully Declines',
      data.seats || '0',
      data.notes || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}