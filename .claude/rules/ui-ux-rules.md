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
- `<MotionConfig reducedMotion="user">` wraps root layout (`app/layout.tsx`) — all `motion/react` animations inherit this automatically
- CSS-only animations: prefix with `motion-safe:` (e.g., `motion-safe:animate-pulse`, `motion-safe:animate-in`)
- Animate only `transform` and `opacity` (compositor-friendly)
- Never `transition: all` — list properties explicitly (e.g., `transition-colors`, `transition-[border-color,box-shadow]`)
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

## Lightbox (yet-another-react-lightbox)
- Shared component: `components/shared/media-lightbox.tsx` — plugins: Counter, Zoom, Fullscreen
- **Images only**: Always filter `media.type === "image"` before building slides — Bunny iframe video URLs break as `<img>` src
- **Zoom + custom render.slide**: YARL's Zoom plugin silently disables if slides lack `width`/`height` when using custom `render.slide`. Prefer YARL's native rendering over custom `NextImageSlide`.

## Bunny Stream Embeds
- **Autoplay requires THREE params + iframe attribute**: `autoplay=true&muted=true&preload=true` in the embed URL AND `allow="autoplay"` on the `<iframe>`. Browsers block unmuted autoplay; `preload=false` prevents the video from loading in time for autoplay.
- **No per-embed control hiding**: Player controls (play bar, volume, etc.) can only be toggled at the Bunny dashboard library level, not via query params. For feed/scroll UX, use a thumbnail + play button overlay that swaps to the iframe on click to avoid accidental control interactions.

## Navigation
- URL reflects app state (filters, tabs, pagination)
- Destructive actions require confirmation modal
- **Sheet/drawer nav items**: Use `<Link href={href} onClick={() => setIsOpen(false)}>`, never `<Button onClick={() => router.push(href)}>` — breaks prefetching, middle-click, and accessibility
