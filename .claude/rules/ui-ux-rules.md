---
paths:
  - "components/**"
---

# UI/UX Rules

## Accessibility
- Icon-only `<button>` → must have `aria-label`
- Form `<input>` → must have `<label htmlFor>` or `aria-label`
- Focus states: `focus-visible:ring-*` — never `outline-none` without replacement
- Semantic HTML: `<button>` for actions, `<a>`/`<Link>` for navigation — never `onClick` on `<div>`

## Forms
- Set `autocomplete` and `inputmode` on inputs
- Never block paste
- `spellCheck={false}` on emails, codes, usernames
- Placeholders end with `…`: `"exemple@mail.com…"`
- Submit button: enabled until request starts, then show spinner
- Inline error messages; focus first error on submit

## Animation
- Honor `prefers-reduced-motion` — provide reduced/disabled variant
- Animate only `transform` and `opacity` (compositor-friendly)
- Never `transition: all` — list properties explicitly
- SVG: animate wrapper `<div>`, not SVG element directly

## Content
- Text overflow: always handle with `truncate`, `line-clamp-*`, or `break-words`
- `min-w-0` on flex children for truncation to work
- Number columns: `font-variant-numeric: tabular-nums`
- Render empty states, never broken UI
- `touch-action: manipulation` on interactive mobile elements

## Images & Performance
- Use Next.js `<Image>` with `fill` + `sizes` or explicit `width`/`height`
- Below-fold: `loading="lazy"`. Above-fold: `priority`
- Virtualize lists > 50 items (`content-visibility: auto` or virtualization lib)

## Navigation
- URL reflects app state (filters, tabs, pagination)
- Destructive actions require confirmation modal
