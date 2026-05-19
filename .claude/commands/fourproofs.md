# Four Proofs — Ship Readiness Check

Run this before every commit/deploy for the Ramzon project.

## 1. DIFF SUMMARY
```bash
git diff --stat HEAD
git diff HEAD -- "api/[...path].ts" pages/ components/ lib/
```
- What files changed?
- Any accidental changes to unrelated files?
- Schema changes in `neon-schema.sql` → migration needed on Neon?

## 2. COMMANDS RUN
```bash
# Type check (must be 0 errors)
npx tsc --noEmit

# Lint (must be 0 errors, warnings OK)
npx eslint . --max-warnings 9999

# Build (must succeed)
npm run build
```

## 3. MANUAL CHECKS
Go through this list for the changed feature:

### API changes
- [ ] Endpoint returns camelCase (via `row2camel` / `rows2camel`)
- [ ] Numeric DB columns coerced (Neon returns NUMERIC as string — use `sanitizeNulls`)
- [ ] Date columns handled (`instanceof Date → toISOString().slice(0,10)`)
- [ ] Auth guard in place (`getAuthUser` + `hasRole`)
- [ ] New DB columns → `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` added to `neon-schema.sql`

### Frontend changes  
- [ ] Error boundary won't swallow the new page (test in browser)
- [ ] Loading state shown while fetching
- [ ] Null/undefined guards on all API response fields (`?? ''`, `?? 0`)
- [ ] No `console.log` left in code

### Print / PDF
- [ ] Print preview not blank (use `visibility:hidden` not `display:none` on body)
- [ ] `no-print` class on UI chrome elements
- [ ] `@media print` CSS injected via `<style>` tag

## 4. REMAINING RISK
Document what was NOT tested and why it's acceptable:

| Risk | Mitigation |
|------|-----------|
| Neon migration not yet applied | Schema uses `ADD COLUMN IF NOT EXISTS` — safe to run anytime |
| 327 ESLint warnings | Pre-existing codebase debt; no new errors introduced |
| Print on Safari/Firefox | Only tested in Chrome; layout may differ |
| No automated tests | Manual smoke test covers happy path |

---

## Guardrails (always enforce)

**Never:**
- `display: none` on parent to hide for print → use `visibility: hidden` instead
- Call `.toFixed()` without checking `typeof n === 'number'` first
- Use `toCamel()` on a Date object (returns `{}`) → check `instanceof Date` first
- Commit without 0 TypeScript errors (`npx tsc --noEmit`)
- Hardcode `taxRate: 21` → default is 10% for Ramzon

**Always:**
- Run `row2camel()` on every DB row before returning from API
- Add `?? 0` fallback for numeric fields, `?? ''` for string fields
- Test print preview in browser before marking print feature done
