# Original PDF and interactive Melineaire book

## Inspection results
- Exactly one first-book draft exists: **Melineaire: Authentic. Blessed. Why. — A Reflect While Colouring Book.** It has no saved cover, description, PDF attachment, or interactive entries.
- Its private upload folder contains a retrievable **40-page original PDF** and three images. The PDF is stored but not attached to the saved book. No original file was changed during inspection.
- Existing tools support separate PDF uploads, ordered reflection entries, illustration uploads, colouring, private account artwork and journal saves, and a static saved-book preview.
- Three live privacy/access tests passed. Full cross-device reading and reflection-specific writing resume are not yet implemented or verified.

## What to implement
1. **Keep one listing and preserve the original.** Attach the verified existing PDF to the existing draft without re-uploading or changing its bytes. Keep the book private; do not publish automatically. Verify the three uploaded images before assigning any as a cover or preview.
2. **Separate the two experiences.** Label the same listing's available actions **Read Interactive Book**, **Open Original PDF**, and **Download PDF**. Do not imply that a PDF upload produces interactive pages. Keep current free/paid restrictions enforced; paid reading remains unavailable until entitlements exist.
3. **Organize actual book content.** Extend the existing editor to organize sections and their individual reflections, with separate section/reflection titles, text, original illustration, and journal prompt. Preserve existing entries and their artwork identifiers. Support ordering, editing, replacing/removing illustration attachments, and preview before publishing.
4. **Prepare the interactive draft from the actual PDF.** Extract and verify original reflection text and line-art pages without modifying the PDF. Preserve the book's actual grouping and order. Leave unprovided reflection-specific journal prompts blank rather than inventing questions or applying the final-page questions to every reflection. Flag ambiguous illustration pairings for the owner to confirm.
5. **Connect reading, colouring and writing.** Reuse the existing colouring tools and artwork saves. Add a private writing area associated with each reflection, with explicit save and reload/resume. Save signed-in reading position across devices; guests remain explicitly device-local.
6. **Preview securely.** Allow administrators to preview the saved draft's real reading, colouring and writing experience without exposing draft files or content to public readers.

## Technical details
- Reuse `books`, `book_sections`, `book_files` and private book storage; extend the current transactional administrator save operation rather than creating duplicate publication systems.
- Add only the grouping and owner-scoped progress/writing fields or tables needed. Keep roles separate, enforce access through authenticated user-scoped clients and owner-only policies, and retain existing journal/artwork data.
- Preserve public SSR pages, protected administrator pages, shared metadata helpers, existing design tokens and overall design.
- Original PDF attachment is independent of interactive content creation. No automatic rewriting, conversion, or publication of the PDF.

## Verification
- Confirm the original PDF attachment reads back and retrieved bytes still match the inspected original.
- Test section/reflection organization and ordering, permissions, and stable artwork identifiers.
- Test private reading position and reflection writing using two accounts, including denied reads/writes by other accounts and visitors.
- Verify saved writing, artwork and reading position in a fresh browser context, then verify the reader and administrator preview on desktop and mobile.
- Keep unfinished content or ambiguous pairings explicitly pending; never describe an untested feature as complete.

## Content limits
The PDF provides the source reflections and line art. Separately labelled journaling prompts are absent for most reflections, and some illustration pairings require review. The owner must supply or confirm those; no replacement content will be invented.