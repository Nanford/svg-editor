# SVG-Edit

A lightweight, browser-based SVG editor. The live SVG DOM is the source of
truth; UI panels read from and write to it directly.

## Features
- Tools: select, pan, zoom, rect, circle, ellipse, line, path, text, image,
  node edit.
- Editing: move, resize, rotate, multi-select, align, group/ungroup, order.
- Styling: fill, stroke, stroke width, opacity, linecap/linejoin, dasharray.
- Path workflow: node editing, add/delete nodes, close path, convert to path.
- Undo/redo with snapshot commits on mouse up or confirmed edits.
- Autosave draft to `localStorage` and restore on reload.
- Export: cleaned SVG and PNG (strips editor-only `data-sve-*` attributes).

## Run
- Open `index.html` in a browser.
- No build step or server required.

## Keyboard shortcuts
| Action | Shortcut |
| --- | --- |
| New document | Ctrl/Cmd + N |
| Open SVG | Ctrl/Cmd + O |
| Save SVG | Ctrl/Cmd + S |
| Source view | Ctrl/Cmd + E |
| Undo | Ctrl/Cmd + Z |
| Redo | Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y |
| Copy | Ctrl/Cmd + C |
| Paste | Ctrl/Cmd + V |
| Cut | Ctrl/Cmd + X |
| Group | Ctrl/Cmd + G |
| Ungroup | Ctrl/Cmd + Shift + G |
| Zoom reset | Ctrl/Cmd + 0 |
| Zoom in | Ctrl/Cmd + = |
| Zoom out | Ctrl/Cmd + - |
| Delete selection | Delete or Backspace |
| Cancel path / clear selection | Escape |
| Finish path drawing | Enter |
| Temporary pan | Hold Space |

## Project structure
- `index.html`: App shell, menus, panels, and SVG canvas markup.
- `styles.css`: Visual design, layout, and UI states.
- `app.js`: Editor logic (tools, commands, serialization, IO).
- `svg_edit_prd.md`: Product spec and UX requirements (Chinese).
- `page-view.png`: UI screenshot.

## Notes
- Zoom/pan is view-only and does not mutate the exported `viewBox`.
- Transforms are stored on elements to keep editing and export consistent.
- Fonts load from Google Fonts; offline use will fall back to system defaults.
