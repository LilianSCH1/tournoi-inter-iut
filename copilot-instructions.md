# Copilot Instructions

- Start from the most concrete local anchor: the nearest file, route, or failing behavior.
- Before editing, gather only the minimum context needed to form one falsifiable hypothesis.
- Prefer small, reversible changes over broad refactors.
- After the first substantive edit, run the cheapest focused validation available.
- Use `apply_patch` for manual edits and avoid rewriting unrelated code.
- Do not revert user changes unless explicitly asked.
- Keep searches and reads local to the task; avoid broad repo scans unless they are necessary.
- If a feature spans UI, API, and Airtable, update the data model, route, and view together.
- For this project, assume Next.js App Router, Airtable-backed data, and sessionStorage-based auth flows.
- When adding admin or benevole features, keep the dashboard consistent with the existing style and preserve current behavior outside the touched slice.
- For Airtable-backed records, check `lib/airtable.ts` and the matching `lib/data/*.ts` module before adding a new table or field.
- For file attachments, prefer Airtable attachment URLs or an explicitly documented storage strategy.
- If a task is ambiguous, inspect the nearest implementation first instead of asking immediately.
