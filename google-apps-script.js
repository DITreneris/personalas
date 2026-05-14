/**
 * Google Apps Script – pavyzdinis kodas būsimai kontaktų formai.
 * Statinei GitHub Pages svetainei neprivaloma: forma čia nėra įjungta.
 *
 * Jei įjungsite formą:
 * 1. Google Sheets → Extensions → Apps Script
 * 2. Įklijuokite šį kodą, išsaugokite, publikuokite kaip Web App
 * 3. Web App URL įdėkite į formos `action` ar fetch iš index.html
 * Žr. taip pat [INTEGRACIJA.md](INTEGRACIJA.md).
 */

function doPost(e) {
  try {
    // Gauti duomenis iš POST užklausos
    const data = JSON.parse(e.postData.contents);
    
    // Gauti aktyvų lapą
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Pridėti naują eilutę su duomenimis (F stulpelis: Tipas – Feedback Store)
    sheet.appendRow([
      new Date(),                    // A: Data/Laikas
      data.email || '',              // B: El. paštas
      data.name || 'Nenurodytas',    // C: Vardas
      data.question || 'Nėra',       // D: Klausimas
      data.source || 'Promptų anatomija', // E: Šaltinis
      data.tipas || 'feedback'       // F: Tipas (bug | feature | feedback)
    ]);
    
    // OPTIONAL: Siųsti automatinį email pranešimą
    // sendEmailNotification(data);
    
    // Grąžinti sėkmės atsakymą
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Duomenys sėkmingai įrašyti'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Log klaidą (matoma Apps Script Execution log)
    console.error('Klaida:', error);
    
    // Grąžinti klaidos atsakymą
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * OPTIONAL: Automatinis email pranešimas
 * Atkomentuokite, jei norite gauti email kiekvieną kartą, kai kas nors užpildo formą
 */
function sendEmailNotification(data) {
  const recipientEmail = 'your-email@example.com'; // Pakeiskite į savo email
  const subject = 'Nauja užklausa iš DI Bibliotekos';
  const body = `
Nauja užklausa iš DI Promptų Bibliotekos:

El. paštas: ${data.email}
Vardas: ${data.name || 'Nenurodytas'}
Klausimas: ${data.question || 'Nėra'}
Data: ${new Date().toLocaleString('lt-LT')}
  `;
  
  try {
    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      body: body
    });
  } catch (error) {
    console.error('Nepavyko išsiųsti email:', error);
  }
}

/**
 * Testavimo funkcija
 * Paleiskite Apps Script redaktoriuje, kad patikrintumėte, ar viskas veikia
 */
function test() {
  const testData = {
    email: 'test@example.com',
    name: 'Testas Testauskas',
    question: 'Ar veikia integracija?',
    source: 'Test'
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log('Rezultatas:');
  Logger.log(result.getContent());
}
