# Document finishing

Open **All Tools → Print & Finish**, or search using Ctrl/Cmd+K.

Eight utilities export a new copy without replacing the active document:

| Utility | Behavior |
| --- | --- |
| Resize pages | Fit pages to A4, A3, or US Letter; portrait/landscape; configurable margins |
| Multiple pages per sheet | Two or four source pages per output sheet |
| Booklet maker | Left-bound two-up imposition, padding to a multiple of four |
| Add writing margins | Enlarge page bounds with whitespace, retaining content scale |
| Odd / even pages | Extract alternate pages using one-based numbering |
| Flatten form fields | Flatten supported AcroForms into fixed appearances |
| Edit document metadata | Set title, author, subject, comma-separated keywords |
| Export text & JSON | Export existing text layer as plain text or page-numbered JSON |

Print layouts retain vector page artwork, account for PDF page rotation and crop boxes, and flatten supported fields before composing sheets. Links, bookmarks, signatures, and interactive annotations are not guaranteed to survive print composition. These outputs are print copies, not archival or digitally signed originals. Empty pages and unsupported documents should be checked in the preview before printing.

Booklets: print at actual size, duplex with short-edge flipping; verify one sheet on your printer before a full run. No right-to-left binding option is currently implemented.

Metadata and form flattening operate on saved document data. If the organizer has pending page operations, export and reopen those changes first. Other utilities use current organizer order and rotations.

Text export is not OCR; use the OCR workspace for scans. Text reading order follows the existing PDF layer and may not preserve multi-column layouts.

## Verification

`npm test` includes `scripts/test-print-tools.ts`: booklet order for 1–25 pages, seven PDF export modes, rotated-page dimensions, form flattening, invalid margins, missing even pages, and unchanged source bytes. UI smoke checks cover sample loading, booklet export, metadata/text controls, tool search, and favorites. Existing browser E2E scripts remain available separately; they are not run by `npm test`.
