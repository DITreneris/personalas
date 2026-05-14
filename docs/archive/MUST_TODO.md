# MUST TODO - Kritinės MVP Užduotys

**Data:** 2026-02-03  
**Tikslas:** Tik būtinos užduotys, kad produktas būtų production-ready

> **Minimali aplikacija (dabartinis etapas):** Kontaktų forma ir Google Sheets integracija yra **išjungti** – nerinkime jokių vartotojų duomenų. Užduotys 1 (Google Script) ir 2 (GDPR kontaktų formai) taikomos **vėlesniems etapams**, kai bus įjungtas duomenų rinkimas. Dabar privaloma tik tai, kas susijusi su pačia promptų biblioteka (be formos).

---

## 🎯 MVP Kritinės Užduotys (P0 - Must Have)

### ⚠️ SVARBU: Prieš pradedant
- [ ] Patikrinti, ar visos esamos funkcijos veikia
- [ ] Patikrinti, ar nėra akivaizdžių klaidų
- [ ] Patikrinti browser compatibility (Chrome, Firefox, Safari, Edge)

---

## 1. 🔧 Google Apps Script Integracija (KRITINĖ)

**Prioritetas:** 🔴 AUKŠTAS  
**Sąmata:** 2-3 valandos  
**Terminas:** 2026-02-05

### Užduotys:
- [ ] Sukurti Google Sheets dokumentą su stulpeliais:
  - Data/Laikas
  - El. paštas
  - Vardas
  - Klausimas
  - Šaltinis
- [ ] Sukurti Google Apps Script (naudoti `google-apps-script.js`)
- [ ] Publikuoti Apps Script kaip Web App
- [ ] Gauti Web App URL
- [ ] Pakeisti `GOOGLE_SCRIPT_URL` faile `index.html`
- [ ] Testuoti form submission
- [ ] Patikrinti, ar duomenys įrašomi į Google Sheets

**Kriterijai sėkmei:**
- ✅ Form submission veikia
- ✅ Duomenys įrašomi į Google Sheets
- ✅ Error handling veikia

---

## 2. 🔒 GDPR Compliance (KRITINĖ)

**Prioritetas:** 🔴 AUKŠTAS  
**Sąmata:** 1 diena  
**Terminas:** 2026-02-06

### Užduotys:
- [ ] Sukurti privatumo politikos tekstą (minimalus)
- [ ] Pridėti privatumo politikos nuorodą kontaktų formoje
- [ ] Pridėti informaciją apie duomenų rinkimą formoje
- [ ] Dokumentuoti duomenų saugojimą (Google Sheets)
- [ ] Patikrinti, ar yra informacija apie duomenų naudojimą

**Minimalus privatumo politikos turinys:**
- Kokius duomenis renkame (email, vardas, klausimas)
- Kodėl renkame (susisiekti su vartotoju)
- Kaip saugome (Google Sheets)
- Kaip galima susisiekti dėl duomenų

**Kriterijai sėkmei:**
- ✅ Privatumo politika prieinama
- ✅ Vartotojas informuotas apie duomenų rinkimą
- ✅ Yra kontaktinė informacija

---

## 3. 🚀 Production Deployment (KRITINĖ)

**Prioritetas:** 🔴 AUKŠTAS  
**Sąmata:** 1 diena  
**Terminas:** 2026-02-07

### Užduotys:
- [ ] Pasirinkti deployment platform:
  - GitHub Pages (nemokama, paprasta)
  - Netlify (nemokama, automatinis deployment)
  - Vercel (nemokama, greita)
- [ ] Sukurti deployment
- [ ] Patikrinti, ar visos funkcijos veikia production
- [ ] Patikrinti, ar Google Script URL veikia production
- [ ] Testuoti form submission production aplinkoje
- [ ] Patikrinti mobile responsive production

**Kriterijai sėkmei:**
- ✅ Aplikacija prieinama production URL
- ✅ Visos funkcijos veikia
- ✅ Form submission veikia
- ✅ Mobile responsive veikia

---

## 4. ✅ Basic Testing (KRITINĖ)

**Prioritetas:** 🔴 AUKŠTAS  
**Sąmata:** 2-3 valandos  
**Terminas:** 2026-02-08

### Užduotys:
- [ ] Testuoti kopijavimo funkciją (visi 8 promptai)
- [ ] Testuoti kontaktų formą:
  - Validus email
  - Invalid email
  - Tuščias email
  - Su vardu
  - Su klausimu
- [ ] Testuoti error handling:
  - Network error
  - Invalid response
- [ ] Testuoti browser compatibility:
  - Chrome
  - Firefox
  - Safari
  - Edge
- [ ] Testuoti mobile:
  - iOS Safari
  - Chrome Mobile
- [ ] Testuoti accessibility:
  - Keyboard navigation
  - Screen reader (optional)

**Kriterijai sėkmei:**
- ✅ Visos pagrindinės funkcijos veikia
- ✅ Error handling veikia
- ✅ Veikia 3+ naršyklėse
- ✅ Veikia mobile

---

## 5. 📚 Minimali Dokumentacija (KRITINĖ)

**Prioritetas:** 🔴 AUKŠTAS  
**Sąmata:** 2-3 valandos  
**Terminas:** 2026-02-09

### Užduotys:
- [ ] Atnaujinti README.md:
  - Production URL
  - Deployment instrukcijos
  - Google Script setup instrukcijos
- [ ] Sukurti DEPLOYMENT.md (minimalus):
  - Kaip deploy'inti
  - Kaip nustatyti Google Script URL
  - Troubleshooting (baziniai)
- [ ] Patikrinti, ar INTEGRACIJA.md atnaujinta
- [ ] Pridėti privatumo politikos nuorodą README.md

**Kriterijai sėkmei:**
- ✅ README.md atnaujintas
- ✅ Deployment instrukcijos prieinamos
- ✅ Privatumo politika prieinama

---

## 6. 🔍 Final Check (KRITINĖ)

**Prioritetas:** 🔴 AUKŠTAS  
**Sąmata:** 1-2 valandos  
**Terminas:** 2026-02-10

### Užduotys:
- [ ] Patikrinti, ar nėra hardcoded jautrių duomenų
- [ ] Patikrinti, ar nėra console.log production kode
- [ ] Patikrinti, ar visi placeholder'ai pakeisti
- [ ] Patikrinti, ar veikia su JavaScript išjungtu (graceful degradation)
- [ ] Patikrinti, ar veikia su ad blocker
- [ ] Patikrinti, ar nėra broken links
- [ ] Patikrinti, ar nėra console errors
- [ ] Patikrinti, ar veikia print-friendly stilius

**Kriterijai sėkmei:**
- ✅ Nėra akivaizdžių klaidų
- ✅ Production-ready kodas
- ✅ Visi placeholder'ai pakeisti

---

## 📋 Quick Checklist - Prieš Launch

**Pastaba (2026-02-18):** Vartotojo kelionės/UX plano įgyvendinimas: privatumo nuoroda pridėta į index.html footer (→ privatumas.html); console.log pašalintas iš production kodo; semantika `<main id="main-content">`; code-block hint matomas ir su focus-visible; privatumas.html .back:focus-visible.

Prieš MVP launch, patikrinkite:

### Saugumas
- [ ] Nėra hardcoded API keys arba jautrių duomenų
- [ ] Google Script URL nustatytas
- [ ] Privatumo politika prieinama
- [ ] GDPR compliance patikrintas

### Funkcionalumas
- [ ] Visi 8 promptai veikia
- [ ] Kopijavimo funkcija veikia
- [ ] Kontaktų forma veikia
- [ ] Form submission veikia
- [ ] Error handling veikia

### Deployment
- [ ] Production URL veikia
- [ ] Mobile responsive veikia
- [ ] Browser compatibility patikrinta
- [ ] Nėra console errors

### Dokumentacija
- [ ] README.md atnaujintas
- [ ] Deployment instrukcijos prieinamos
- [ ] Privatumo politika prieinama

### Mobile QA checklist (Mobile UI First – S5)
- [ ] Viewport 320px: layout vienas stulpelis, nėra horizontalaus scroll
- [ ] Viewport 375px ir 428px: visi blokai skaitomi, mygtukai pasiekiami
- [ ] Touch targets: visi mygtukai, nuorodos ir interaktyvūs elementai ≥44×44px
- [ ] Thumb zone: pagrindiniai CTA (Kopijuoti, Siųsti) patogūs vienos rankos naudojimui
- [ ] Modal: užpildo ekraną arba patogiai atsidaro; uždarymo mygtukas ≥44px
- [ ] Toast: matomas ir skaitomas ant mažo ekrano
- [ ] Testavimas: iOS Safari ir Chrome Mobile (arba DevTools device emulation)

### Prieinamumas (a11y – S4)
- [ ] Tab navigacija: visi interaktyvūs elementai pasiekiami klaviatūra
- [ ] Focus visible: aiškiai matoma, kuris elementas turi fokusą
- [ ] Escape uždaro modalą ir toast (jei taikoma)
- [ ] ARIA: mygtukai ir formos turi labels/aria-label; role/aria-live kur reikia
- [ ] WCAG AA: kontrastas ir teksto dydis atitinka reikalavimus (žr. .cursorrules)

---

## ⏱️ Laiko Planas

| Užduotis | Sąmata | Terminas | Statusas |
|----------|--------|----------|----------|
| Google Script Integracija | 2-3h | 2026-02-05 | ⏳ |
| GDPR Compliance | 1d | 2026-02-06 | ⏳ |
| Production Deployment | 1d | 2026-02-07 | ⏳ |
| Basic Testing | 2-3h | 2026-02-08 | ⏳ |
| Minimali Dokumentacija | 2-3h | 2026-02-09 | ⏳ |
| Final Check | 1-2h | 2026-02-10 | ⏳ |

**Bendras laikas:** ~3-4 dienos  
**MVP Launch:** 2026-02-10

---

## 🚨 Ką GALIMA atidėti (NĖRA MVP)

Šie dalykai NĖRA būtini MVP, bet gali būti pridėti vėliau:

- ❌ CAPTCHA integracija (gali būti P1)
- ❌ Rate limiting (gali būti P1)
- ❌ Unit testai (gali būti P1)
- ❌ Integration testai (gali būti P1)
- ❌ Performance optimizacija (gali būti P1)
- ❌ Analytics (gali būti P2)
- ❌ Papildomos funkcijos (gali būti P2)

---

## 📝 Pastabos

- **Fokusuokitės tik šiomis užduotimis** - nereikia daryti visko iš karto
- **Testuokite po kiekvienos užduoties** - nereikia laukti iki galo
- **Jei kyla problemų** - dokumentuokite ir spręskite po vieną
- **MVP tikslas** - veikiantis produktas, ne tobulas produktas

---

**Paskutinis atnaujinimas:** 2026-02-03  
**Versija:** 1.0  
**Statusas:** Ready to Start
