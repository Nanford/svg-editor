# SVG Editor V1 - Agent Notes

This project is a lightweight, browser-based SVG editor implemented as a
static web app. The source of truth is the live SVG DOM; UI panels read from
and write to the DOM directly. Export paths are cleaned to avoid editor-only
attributes.

## How to run

- Open `index.html` directly in a browser.
- No build step or server is required.

## Key files

- `index.html`: App shell, menus, panels, and SVG canvas markup.
- `styles.css`: Visual design, layout, and UI states.
- `app.js`: All editor logic (tools, commands, serialization, IO).

## Core behaviors

- Undo/redo uses snapshots captured on commit (mouse up / confirmed edits).
- Autosave persists the most recent document to localStorage.
- Export SVG/PNG uses a cleaned clone of the SVG to avoid private `data-*`.
- Zoom/pan is view-only and must not mutate the document viewBox on export.

## Feature scope (V1)

- Tools: select, pan, zoom, rect, circle, ellipse, line, path, text, image.
- Editing: move, resize, rotate, multi-select, align, group/ungroup, order.
- Style: fill, stroke, stroke width, opacity, linecap/linejoin/dasharray.
- Path: line-node editing with add/delete/close; curves are optional.
- Source: SVG code view with validation and undo integration.

## Constraints

- Keep editor metadata out of exported SVG (strip `data-sve-*`).
- Maintain consistent transforms; store transformations on the element.
- Avoid non-ASCII text in source files unless required.
