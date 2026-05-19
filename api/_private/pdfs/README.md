# Private PDF sources

Paid PDFs must not be placed in the public site root.

**Production:** private object storage via:

- `PDF_BEGINNER_SOURCE_URL`
- `PDF_ADVANCED_SOURCE_URL`
- `PDF_SOURCE_AUTH_TOKEN` or `PDF_SOURCE_AUTH_HEADER` (if required)

**Local testing only:** place exported files here:

- `beginner-guide.pdf`
- `advanced-guide.pdf`

PDF binaries are gitignored (`api/_private/pdfs/*.pdf`). Export from [docs/pdf-source/README.md](../../../docs/pdf-source/README.md).
