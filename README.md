# Frontier Education

Static landing page for Frontier Education, ready for local preview and GitHub Pages hosting.

## Files

- `index.html` - page markup
- `style.css` - site styles
- `script.js` - navbar, CTA, form, and interaction logic
- `google-apps-script/Code.gs` - Google Apps Script backend for Sheets + Gmail
- `google-apps-script/appsscript.json` - Apps Script manifest
- `google-apps-script/SETUP.md` - local spreadsheet, Apps Script, and deployment guide

## Local Preview

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173`.

## Enquiry Form Setup

The enquiry form is configured for Formspree submission through `https://formspree.io/f/mykoabyq`.

## Notes

- The site is built with plain HTML, CSS, and JavaScript.
- The frontend uses one Formspree submit handler with success message: `Thank you! Our team will contact you shortly.`
- Recipient routing is managed in the Formspree dashboard for endpoint `mykoabyq` (currently verified against `adityakumarasd698@gmail.com`).
