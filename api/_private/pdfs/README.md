# Private PDF sources

Paid PDFs must not be placed in the public site root.

**Production:** Vercel Blob (private) — recommended:

1. `npm run pdf:export` then `npm run pdf:upload:blob` (needs `BLOB_READ_WRITE_TOKEN` in `.env`)
2. Set `PDF_BEGINNER_SOURCE_URL` and `PDF_ADVANCED_SOURCE_URL` on Vercel (URLs printed by upload script)
3. `BLOB_READ_WRITE_TOKEN` on Vercel (auto when Blob store is linked); fulfillment sends it as Bearer for `*.blob.vercel-storage.com`

**Local testing only:** place exported files here:

- `beginner-guide.pdf`
- `advanced-guide.pdf`

PDF binaries are gitignored (`api/_private/pdfs/*.pdf`). Export from [docs/pdf-source/README.md](../../../docs/pdf-source/README.md).
