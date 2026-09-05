/**
 * Google Apps Script – sample backend for a future contact form.
 * Not wired: the contact form is disabled (see INTEGRACIJA.md).
 *
 * If you enable the form later:
 * 1. Google Sheets → Extensions → Apps Script
 * 2. Paste this code, save, deploy as Web App
 * 3. Put the Web App URL into the form `action` or fetch from the landing page
 * 4. Update privacy policy + INTEGRACIJA.md
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    sheet.appendRow([
      new Date(),
      data.email || '',
      data.name || 'Not provided',
      data.question || 'None',
      data.source || 'Prompt Anatomy',
      data.tipas || 'feedback'
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Saved'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * OPTIONAL: email notification on each submission.
 * Uncomment the call in doPost if needed.
 */
function sendEmailNotification(data) {
  const recipientEmail = 'your-email@example.com';
  const subject = 'New inquiry from Prompt Anatomy';
  const body =
    'New inquiry from Prompt Anatomy:\n\n' +
    'Email: ' + (data.email || '') + '\n' +
    'Name: ' + (data.name || 'Not provided') + '\n' +
    'Question: ' + (data.question || 'None') + '\n' +
    'Date: ' + new Date().toISOString() + '\n';

  try {
    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      body: body
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}
