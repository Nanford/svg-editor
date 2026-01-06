const SVG_NS = "http://www.w3.org/2000/svg";

const svg = document.getElementById("svg-canvas");
const content = document.getElementById("sve-content");
const bgRect = document.getElementById("sve-bg");
const guidesLayer = document.getElementById("sve-guides");
const selectionLayer = document.getElementById("sve-selection");
const nodesLayer = document.getElementById("sve-nodes");
const defs = document.getElementById("sve-defs");

const zoomReadout = document.getElementById("zoom-readout");
const statusZoom = document.getElementById("status-zoom");
const statusTool = document.getElementById("status-tool");
const statusSelection = document.getElementById("status-selection");
const docTitle = document.getElementById("doc-title");
const docStatus = document.getElementById("doc-status");

const toolbarButtons = document.querySelectorAll(".tool");
const toolbar = document.querySelector(".toolbar");
const btnToolbarToggle = document.getElementById("btn-toolbar-toggle");
const menuGroups = document.querySelectorAll(".menu-group");

const modalNew = document.getElementById("modal-new");
const modalExport = document.getElementById("modal-export");
const modalSource = document.getElementById("modal-source");
const modalHelp = document.getElementById("modal-help");
const modalDraft = document.getElementById("modal-draft");

const draftSkip = document.getElementById("draft-skip");
const btnDraftLater = document.getElementById("btn-draft-later");
const btnDraftDelete = document.getElementById("btn-draft-delete");
const btnDraftRestore = document.getElementById("btn-draft-restore");

const newPreset = document.getElementById("new-preset");
const newWidth = document.getElementById("new-width");
const newHeight = document.getElementById("new-height");
const newBg = document.getElementById("new-bg");

const exportScale = document.getElementById("export-scale");
const exportBg = document.getElementById("export-bg");
const exportName = document.getElementById("export-name");

const sourceEditor = document.getElementById("source-editor");
const sourceError = document.getElementById("source-error");

const btnUndo = document.getElementById("btn-undo");
const btnRedo = document.getElementById("btn-redo");
const btnFit = document.getElementById("btn-fit");
const btnSnap = document.getElementById("btn-snap");

const fileOpen = document.getElementById("file-open");
const fileImage = document.getElementById("file-image");

const geometryFields = document.getElementById("geometry-fields");
const fieldType = document.getElementById("field-type");
const fieldId = document.getElementById("field-id");
const fieldFill = document.getElementById("field-fill");
const fieldFillColor = document.getElementById("field-fill-color");
const btnFillNone = document.getElementById("btn-fill-none");
const fieldStroke = document.getElementById("field-stroke");
const fieldStrokeColor = document.getElementById("field-stroke-color");
const btnStrokeNone = document.getElementById("btn-stroke-none");
const fieldStrokeWidth = document.getElementById("field-stroke-width");
const fieldOpacity = document.getElementById("field-opacity");
const fieldOpacityRange = document.getElementById("field-opacity-range");
const fieldLinecap = document.getElementById("field-linecap");
const fieldLinejoin = document.getElementById("field-linejoin");
const fieldDasharray = document.getElementById("field-dasharray");
const fieldRotate = document.getElementById("field-rotate");
const fieldScale = document.getElementById("field-scale");
const fieldPathMode = document.getElementById("field-path-mode");
const btnAddNode = document.getElementById("btn-add-node");
const btnDelNode = document.getElementById("btn-del-node");
const btnToggleClose = document.getElementById("btn-toggle-close");
const btnConvertPath = document.getElementById("btn-convert-path");

const rulerX = document.getElementById("ruler-x");
const rulerY = document.getElementById("ruler-y");
const canvasStage = document.querySelector(".canvas-stage");

const toast = document.getElementById("toast");

const DRAFT_KEY = "sve-draft";
const DRAFT_POLICY_KEY = "sve-draft-policy";
const TOOLBAR_STATE_KEY = "sve-toolbar-state";
const MAX_SELECT_DEPTH = 6;
const HIT_TEST_TIMEOUT = 2000;
let pendingDraft = null;

const defaultStyle = {
  fill: "#f8c15c",
  stroke: "#1b1916",
  "stroke-width": 2,
  opacity: 1,
};

const state = {
  doc: {
    width: 960,
    height: 640,
    viewBox: { x: 0, y: 0, width: 960, height: 640 },
    background: "#ffffff",
    name: "未命名",
  },
  ui: {
    tool: "select",
    zoom: 1,
    panX: 0,
    panY: 0,
    snap: true,
    showRulers: false,
    spacePan: false,
  },
  selection: [],
  history: {
    undo: [],
    redo: [],
    locked: false,
  },
  clipboard: null,
  idCounter: 1,
  drag: null,
  pathDraw: null,
  pathEdit: null,
  hitTest: null,
};

const toolLabels = {
  select: "选择",
  pan: "拖拽",
  zoom: "缩放",
  rect: "矩形",
  square: "正方形",
  circle: "圆形",
  ellipse: "椭圆",
  line: "线段",
  arrow: "箭头",
  path: "路径",
  text: "文字",
  image: "图片",
  nodes: "节点",
};

init();

function init() {
  bindMenus();
  bindToolbar();
  bindModals();
  bindFields();
  bindActions();
  bindCanvasEvents();
  bindShortcuts();

  applyDocSettings();
  updateViewBox();
  updateZoomReadout();
  pushHistory("init");
  restoreDraft();
  updateSelectionUI();
  updateRulers();
}

function bindMenus() {
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".menu-group")) {
      closeMenus();
    }
  });

  menuGroups.forEach((group) => {
    const trigger = group.querySelector(".menu-trigger");
    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = group.classList.contains("open");
      closeMenus();
      if (!isOpen) {
        group.classList.add("open");
      }
    });
  });

  document.querySelectorAll(".menu-dropdown button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (action) {
        runAction(action);
      }
      closeMenus();
    });
  });
}

function closeMenus() {
  menuGroups.forEach((group) => group.classList.remove("open"));
}

function bindToolbar() {
  toolbarButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setTool(btn.dataset.tool);
    });
  });

  if (btnToolbarToggle && toolbar) {
    btnToolbarToggle.addEventListener("click", () => {
      const expanded = !toolbar.classList.contains("is-expanded");
      setToolbarExpanded(expanded);
    });
  }

  initToolbarState();
}

function initToolbarState() {
  if (!toolbar) {
    return;
  }
  const stored = localStorage.getItem(TOOLBAR_STATE_KEY);
  const expanded = stored ? stored === "expanded" : false;
  setToolbarExpanded(expanded, { persist: false });
}

function setToolbarExpanded(expanded, options = {}) {
  if (!toolbar) {
    return;
  }
  toolbar.classList.toggle("is-expanded", expanded);
  if (btnToolbarToggle) {
    btnToolbarToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
  }
  if (options.persist === false) {
    return;
  }
  localStorage.setItem(TOOLBAR_STATE_KEY, expanded ? "expanded" : "collapsed");
}

function bindModals() {
  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.close;
      const modal = document.getElementById(id);
      if (modal) {
        modal.close();
      }
    });
  });

  document.getElementById("btn-new-confirm").addEventListener("click", () => {
    const width = parseNumber(newWidth.value, 1080);
    const height = parseNumber(newHeight.value, 1080);
    const bg = newBg.value || "#ffffff";
    createNewDocument(width, height, bg);
    modalNew.close();
  });

  document
    .getElementById("btn-export-confirm")
    .addEventListener("click", () => {
      const scale = parseNumber(exportScale.value, 1);
      const bgMode = exportBg.value;
      const name = exportName.value.trim() || "export";
      exportPNG(scale, bgMode, name);
      modalExport.close();
    });

  document
    .getElementById("btn-source-apply")
    .addEventListener("click", () => {
      const value = sourceEditor.value;
      const error = validateSvg(value);
      if (error) {
        sourceError.textContent = error;
        return;
      }
      loadSvgFromText(value, { pushHistory: true });
      modalSource.close();
    });

  newPreset.addEventListener("change", () => {
    if (newPreset.value === "custom") {
      return;
    }
    const [w, h] = newPreset.value.split("x").map(Number);
    newWidth.value = w;
    newHeight.value = h;
  });

  bindDraftModal();
}

function bindDraftModal() {
  if (!modalDraft) {
    return;
  }
  if (btnDraftLater) {
    btnDraftLater.addEventListener("click", () => handleDraftAction("later"));
  }
  if (btnDraftDelete) {
    btnDraftDelete.addEventListener("click", () => handleDraftAction("delete"));
  }
  if (btnDraftRestore) {
    btnDraftRestore.addEventListener("click", () => handleDraftAction("restore"));
  }
}

function bindFields() {
  fieldId.addEventListener("change", () => {
    if (state.selection.length !== 1) {
      return;
    }
    const el = state.selection[0];
    if (fieldId.value.trim()) {
      el.id = ensureUniqueId(fieldId.value.trim());
    }
    updateSelectionUI();
    pushHistory("id");
  });

  const styleFields = [
    [fieldStrokeWidth, "stroke-width"],
    [fieldLinecap, "stroke-linecap"],
    [fieldLinejoin, "stroke-linejoin"],
    [fieldDasharray, "stroke-dasharray"],
  ];

  styleFields.forEach(([input, attr]) => {
    input.addEventListener("input", () => {
      if (!state.selection.length) {
        return;
      }
      const value = input.value.trim();
      state.selection.forEach((el) => {
        if (value === "") {
          el.removeAttribute(attr);
        } else {
          el.setAttribute(attr, value);
        }
      });
      updateSelectionUI();
    });

    input.addEventListener("change", () => {
      if (state.selection.length) {
        pushHistory("style");
      }
    });
  });

  bindColorField(fieldFill, fieldFillColor, btnFillNone, "fill", "#ffffff");
  bindColorField(fieldStroke, fieldStrokeColor, btnStrokeNone, "stroke", "#222222");
  bindOpacityField();

  fieldRotate.addEventListener("change", () => {
    if (state.selection.length !== 1) {
      return;
    }
    const el = state.selection[0];
    const angle = parseNumber(fieldRotate.value, 0);
    setElementRotation(el, angle);
    updateSelectionUI();
    pushHistory("rotate");
  });

  fieldScale.addEventListener("change", () => {
    if (state.selection.length !== 1) {
      return;
    }
    const el = state.selection[0];
    const target = parseNumber(fieldScale.value, 1);
    setElementScale(el, target);
    updateSelectionUI();
    pushHistory("scale");
  });

  fieldPathMode.addEventListener("change", () => {
    if (fieldPathMode.value === "nodes") {
      startPathEdit();
    } else {
      stopPathEdit();
    }
  });

  btnAddNode.addEventListener("click", () => {
    if (!state.pathEdit) {
      showToast("请先选择路径再编辑节点。");
      return;
    }
    state.pathEdit.addMode = true;
    showToast("点击线段以添加节点。");
  });

  btnDelNode.addEventListener("click", () => {
    deleteActiveNode();
  });

  btnToggleClose.addEventListener("click", () => {
    togglePathClosed();
  });

  btnConvertPath.addEventListener("click", () => {
    convertSelectionToPath();
  });
}

function bindActions() {
  btnUndo.addEventListener("click", undo);
  btnRedo.addEventListener("click", redo);
  btnFit.addEventListener("click", () => runAction("fit"));
  btnSnap.addEventListener("click", () => runAction("toggle-snap"));

  fileOpen.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      loadSvgFromText(reader.result, { pushHistory: true });
    };
    reader.readAsText(file);
    fileOpen.value = "";
  });

  fileImage.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        addImageElement(reader.result, img.width, img.height);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    fileImage.value = "";
  });
}

function bindCanvasEvents() {
  svg.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  svg.addEventListener("dblclick", onDoubleClick);
  svg.addEventListener("wheel", onWheel, { passive: false });
}

function bindShortcuts() {
  window.addEventListener("keydown", (event) => {
    if (event.target.closest("input, textarea")) {
      return;
    }

    if (event.code === "Space") {
      if (!state.ui.spacePan) {
        state.ui.spacePan = true;
        svg.classList.add("pan-mode");
      }
      event.preventDefault();
    }

    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === "n") {
      event.preventDefault();
      openModal(modalNew);
    }
    if (modifier && event.key.toLowerCase() === "o") {
      event.preventDefault();
      fileOpen.click();
    }
    if (modifier && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveSvg();
    }
    if (modifier && event.key.toLowerCase() === "e") {
      event.preventDefault();
      openSourceView();
    }
    if (modifier && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    }
    if (modifier && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redo();
    }
    if (modifier && event.key.toLowerCase() === "c") {
      event.preventDefault();
      copySelection();
    }
    if (modifier && event.key.toLowerCase() === "v") {
      event.preventDefault();
      pasteSelection();
    }
    if (modifier && event.key.toLowerCase() === "x") {
      event.preventDefault();
      cutSelection();
    }
    if (modifier && event.key.toLowerCase() === "g") {
      event.preventDefault();
      if (event.shiftKey) {
        ungroupSelection();
      } else {
        groupSelection();
      }
    }
    if (modifier && event.key === "0") {
      event.preventDefault();
      setZoom(1);
    }
    if (modifier && event.key === "=") {
      event.preventDefault();
      setZoom(state.ui.zoom * 1.1);
    }
    if (modifier && event.key === "-") {
      event.preventDefault();
      setZoom(state.ui.zoom / 1.1);
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      deleteSelection();
    }
    if (event.key === "Escape") {
      if (state.pathDraw) {
        cancelPathDraw();
      } else {
        clearSelection();
      }
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.code === "Space") {
      state.ui.spacePan = false;
      svg.classList.remove("pan-mode");
    }
  });
}

function runAction(action) {
  const actions = {
    new: () => openModal(modalNew),
    open: () => fileOpen.click(),
    save: saveSvg,
    export: () => openModal(modalExport),
    undo,
    redo,
    cut: cutSelection,
    copy: copySelection,
    paste: pasteSelection,
    delete: deleteSelection,
    group: groupSelection,
    ungroup: ungroupSelection,
    front: () => reorderSelection("front"),
    back: () => reorderSelection("back"),
    forward: () => reorderSelection("forward"),
    backward: () => reorderSelection("backward"),
    "align-left": () => alignSelection("left"),
    "align-center-x": () => alignSelection("center-x"),
    "align-right": () => alignSelection("right"),
    "align-top": () => alignSelection("top"),
    "align-center-y": () => alignSelection("center-y"),
    "align-bottom": () => alignSelection("bottom"),
    "convert-path": convertSelectionToPath,
    "zoom-in": () => setZoom(state.ui.zoom * 1.1),
    "zoom-out": () => setZoom(state.ui.zoom / 1.1),
    "zoom-reset": () => setZoom(1),
    fit: fitToContent,
    "toggle-ruler": toggleRulers,
    "toggle-snap": toggleSnap,
    source: openSourceView,
    shortcuts: () => openModal(modalHelp),
  };
  if (actions[action]) {
    actions[action]();
  }
}

function setTool(tool) {
  state.ui.tool = tool;
  toolbarButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tool === tool);
  });
  statusTool.textContent = toolLabels[tool] || tool;
  if (tool !== "nodes") {
    fieldPathMode.value = "off";
    stopPathEdit();
  } else {
    fieldPathMode.value = "nodes";
    startPathEdit();
  }
}

function applyDocSettings() {
  svg.setAttribute("width", state.doc.width);
  svg.setAttribute("height", state.doc.height);
  bgRect.setAttribute("width", state.doc.width);
  bgRect.setAttribute("height", state.doc.height);
  bgRect.setAttribute("fill", state.doc.background);
  docTitle.textContent = state.doc.name;
}

function updateViewBox() {
  const view = getUiViewBox();
  svg.setAttribute(
    "viewBox",
    `${view.x} ${view.y} ${view.width} ${view.height}`
  );
  updateRulers();
}

function getUiViewBox() {
  const vb = state.doc.viewBox;
  return {
    x: vb.x + state.ui.panX,
    y: vb.y + state.ui.panY,
    width: vb.width / state.ui.zoom,
    height: vb.height / state.ui.zoom,
  };
}

function setZoom(value, anchor) {
  const next = clamp(value, 0.1, 8);
  const prev = state.ui.zoom;
  const view = getUiViewBox();
  const focus = anchor || {
    x: view.x + view.width / 2,
    y: view.y + view.height / 2,
  };

  const nextWidth = state.doc.viewBox.width / next;
  const nextHeight = state.doc.viewBox.height / next;

  const offsetX = (focus.x - view.x) / view.width;
  const offsetY = (focus.y - view.y) / view.height;

  const nextX = focus.x - offsetX * nextWidth;
  const nextY = focus.y - offsetY * nextHeight;

  state.ui.zoom = next;
  state.ui.panX = nextX - state.doc.viewBox.x;
  state.ui.panY = nextY - state.doc.viewBox.y;

  updateViewBox();
  updateZoomReadout();

  if (prev !== next) {
    docStatus.textContent = "缩放已更新";
  }
}

function updateZoomReadout() {
  const percent = Math.round(state.ui.zoom * 100);
  zoomReadout.textContent = `${percent}%`;
  statusZoom.textContent = `缩放 ${percent}%`;
}

function toggleRulers() {
  state.ui.showRulers = !state.ui.showRulers;
  rulerX.classList.toggle("hidden", !state.ui.showRulers);
  rulerY.classList.toggle("hidden", !state.ui.showRulers);
  updateRulers();
}

function toggleSnap() {
  state.ui.snap = !state.ui.snap;
  btnSnap.textContent = `吸附: ${state.ui.snap ? "开" : "关"}`;
}

function updateRulers() {
  if (!state.ui.showRulers) {
    return;
  }
  positionRulers();
  drawRuler(rulerX, "x");
  drawRuler(rulerY, "y");
}

function positionRulers() {
  if (!canvasStage) {
    return;
  }
  const stageRect = canvasStage.getBoundingClientRect();
  const svgRect = svg.getBoundingClientRect();
  if (!stageRect.width || !stageRect.height || !svgRect.width || !svgRect.height) {
    return;
  }
  const thickness = 28;
  const offsetX = svgRect.left - stageRect.left;
  const offsetY = svgRect.top - stageRect.top;

  rulerX.style.left = `${offsetX}px`;
  rulerX.style.top = `${Math.max(0, offsetY - thickness)}px`;
  rulerX.style.width = `${svgRect.width}px`;
  rulerX.style.height = `${thickness}px`;

  rulerY.style.left = `${Math.max(0, offsetX - thickness)}px`;
  rulerY.style.top = `${offsetY}px`;
  rulerY.style.width = `${thickness}px`;
  rulerY.style.height = `${svgRect.height}px`;
}

function drawRuler(canvas, axis) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const theme = getRulerTheme();
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, rect.width, rect.height);
  ctx.strokeStyle = theme.line;
  ctx.fillStyle = theme.text;
  ctx.font = theme.font;

  const view = getUiViewBox();
  const length = axis === "x" ? view.width : view.height;
  const pixels = axis === "x" ? rect.width : rect.height;
  const step = pickRulerStep(length);
  const scale = pixels / length;
  const start = axis === "x" ? view.x : view.y;
  const majorTick = 12;
  const minorTick = 7;

  for (
    let value = Math.floor(start / step) * step;
    value < start + length;
    value += step
  ) {
    const pos = (value - start) * scale;
    const isMajor = Math.round(value) % (step * 5) === 0;
    ctx.lineWidth = isMajor ? 1.6 : 1.1;
    ctx.strokeStyle = isMajor ? theme.major : theme.line;
    if (axis === "x") {
      ctx.beginPath();
      ctx.moveTo(pos, rect.height - (isMajor ? majorTick : minorTick));
      ctx.lineTo(pos, rect.height);
      ctx.stroke();
      if (isMajor) {
        ctx.fillStyle = theme.text;
        ctx.fillText(Math.round(value), pos + 2, 12);
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(rect.width - (isMajor ? majorTick : minorTick), pos);
      ctx.lineTo(rect.width, pos);
      ctx.stroke();
      if (isMajor) {
        ctx.fillStyle = theme.text;
        ctx.save();
        ctx.translate(2, pos + 8);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(Math.round(value), 0, 0);
        ctx.restore();
      }
    }
  }
}

function getRulerTheme() {
  const styles = getComputedStyle(document.documentElement);
  const fontFamily =
    styles.getPropertyValue("--sans").trim() || "IBM Plex Sans";
  return {
    bg: styles.getPropertyValue("--ruler-bg").trim() || "#2b241e",
    line: styles.getPropertyValue("--ruler-line").trim() || "rgba(241,93,61,0.45)",
    major:
      styles.getPropertyValue("--ruler-line-strong").trim() ||
      "rgba(241,93,61,0.75)",
    text: styles.getPropertyValue("--ruler-text").trim() || "rgba(248,240,229,0.85)",
    font: `11px ${fontFamily}`,
  };
}
function pickRulerStep(length) {
  const steps = [10, 20, 50, 100, 200, 500, 1000];
  for (const step of steps) {
    if (length / step <= 20) {
      return step;
    }
  }
  return 1000;
}

function openModal(modal) {
  if (modal && !modal.open) {
    modal.showModal();
  }
}

function createNewDocument(width, height, bg) {
  state.doc.width = width;
  state.doc.height = height;
  state.doc.viewBox = { x: 0, y: 0, width, height };
  state.doc.background = bg;
  state.doc.name = "未命名";
  state.ui.zoom = 1;
  state.ui.panX = 0;
  state.ui.panY = 0;
  clearContent();
  applyDocSettings();
  updateViewBox();
  updateSelectionUI();
  pushHistory("new");
  saveDraft();
}

function clearContent() {
  content.innerHTML = "";
  defs.innerHTML = "";
  clearSelection();
  stopPathEdit();
}

function loadSvgFromText(text, options = {}) {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(text, "image/svg+xml");
  const parseError = parsed.querySelector("parsererror");
  if (parseError) {
    showToast("SVG XML 解析失败，请检查文件。");
    return;
  }
  const svgNode = parsed.querySelector("svg");
  if (!svgNode) {
    showToast("SVG 文件无效，无法加载。");
    return;
  }

  const width = parseNumber(svgNode.getAttribute("width"), 960);
  const height = parseNumber(svgNode.getAttribute("height"), 640);
  const viewBoxAttr = svgNode.getAttribute("viewBox");
  const viewBox = viewBoxAttr
    ? parseViewBox(viewBoxAttr)
    : { x: 0, y: 0, width, height };

  clearContent();

  const incomingDefs = svgNode.querySelector("defs");
  if (incomingDefs) {
    defs.innerHTML = incomingDefs.innerHTML;
  }

  Array.from(svgNode.children).forEach((child) => {
    const tag = child.tagName.toLowerCase();
    if (tag === "defs") {
      return;
    }
    if (tag === "style") {
      defs.appendChild(document.importNode(child, true));
      return;
    }
    const clone = document.importNode(child, true);
    content.appendChild(clone);
  });

  state.doc.width = width;
  state.doc.height = height;
  state.doc.viewBox = viewBox;
  state.doc.background = "#ffffff";
  state.ui.zoom = 1;
  state.ui.panX = 0;
  state.ui.panY = 0;

  ensureIds();
  applyDocSettings();
  updateViewBox();
  updateSelectionUI();

  if (options.pushHistory) {
    pushHistory("open");
  }
  saveDraft();
}

function serializeSvg(includeBackground) {
  const clone = svg.cloneNode(true);
  clone.querySelectorAll("[data-sve-ui]").forEach((el) => el.remove());
  clone.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("data-sve-")) {
        el.removeAttribute(attr.name);
      }
    });
  });
  clone.querySelectorAll("[transform]").forEach((el) => {
    const value = el.getAttribute("transform") || "";
    if (value.includes("NaN") || value.includes("Infinity")) {
      el.removeAttribute("transform");
    }
  });

  const contentGroup = clone.querySelector("#sve-content");
  if (contentGroup) {
    const parent = contentGroup.parentNode;
    while (contentGroup.firstChild) {
      parent.insertBefore(contentGroup.firstChild, contentGroup);
    }
    contentGroup.remove();
  }

  const sceneGroup = clone.querySelector("#sve-scene");
  if (sceneGroup) {
    const parent = sceneGroup.parentNode;
    while (sceneGroup.firstChild) {
      parent.insertBefore(sceneGroup.firstChild, sceneGroup);
    }
    sceneGroup.remove();
  }

  const defsNode = clone.querySelector("#sve-defs");
  if (defsNode) {
    defsNode.removeAttribute("id");
  }

  if (includeBackground) {
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", state.doc.viewBox.x);
    rect.setAttribute("y", state.doc.viewBox.y);
    rect.setAttribute("width", state.doc.viewBox.width);
    rect.setAttribute("height", state.doc.viewBox.height);
    rect.setAttribute("fill", state.doc.background);
    clone.insertBefore(rect, clone.firstChild);
  }

  clone.setAttribute("xmlns", SVG_NS);
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  clone.setAttribute("width", state.doc.width);
  clone.setAttribute("height", state.doc.height);
  clone.setAttribute(
    "viewBox",
    `${state.doc.viewBox.x} ${state.doc.viewBox.y} ${state.doc.viewBox.width} ${state.doc.viewBox.height}`
  );

  return new XMLSerializer().serializeToString(clone);
}

function saveSvg() {
  const blob = new Blob([serializeSvg(false)], {
    type: "image/svg+xml;charset=utf-8",
  });
  downloadBlob(blob, `${state.doc.name || "文档"}.svg`);
  docStatus.textContent = "SVG 已保存";
}

function exportPNG(scale, bgMode, name) {
  const hasExternal = Array.from(content.querySelectorAll("image")).some((el) => {
    const href = el.getAttribute("href") || el.getAttribute("xlink:href") || "";
    return href && !href.startsWith("data:");
  });
  if (hasExternal) {
    showToast("PNG 导出被外链图片阻止。");
    return;
  }

  const svgText = serializeSvg(bgMode === "canvas");
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = state.doc.width * scale;
    canvas.height = state.doc.height * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((png) => {
      if (png) {
        downloadBlob(png, `${name}.png`);
      }
      URL.revokeObjectURL(url);
    });
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    showToast("PNG 导出失败。");
  };
  img.src = url;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getDraftPolicy() {
  return localStorage.getItem(DRAFT_POLICY_KEY) || "ask";
}

function setDraftPolicy(value) {
  if (!value || value === "ask") {
    localStorage.removeItem(DRAFT_POLICY_KEY);
    return;
  }
  localStorage.setItem(DRAFT_POLICY_KEY, value);
}

function applyDraft(data) {
  if (!data || !data.svg) {
    return;
  }
  loadSvgFromText(data.svg, { pushHistory: false });
  state.doc.background = data.background || "#ffffff";
  applyDocSettings();
  updateViewBox();
  pushHistory("restore");
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
  pendingDraft = null;
}

function openDraftModal(data) {
  pendingDraft = data;
  if (draftSkip) {
    draftSkip.checked = false;
  }
  openModal(modalDraft);
}

function handleDraftAction(action) {
  if (!pendingDraft) {
    if (modalDraft && modalDraft.open) {
      modalDraft.close();
    }
    return;
  }
  const skip = draftSkip && draftSkip.checked;
  if (action === "restore") {
    applyDraft(pendingDraft);
    if (skip) {
      setDraftPolicy("auto-restore");
    }
  }
  if (action === "delete") {
    clearDraft();
    if (skip) {
      setDraftPolicy("ignore");
    }
  }
  if (action === "later") {
    if (skip) {
      setDraftPolicy("ignore");
    }
  }
  if (modalDraft && modalDraft.open) {
    modalDraft.close();
  }
  pendingDraft = null;
  if (draftSkip) {
    draftSkip.checked = false;
  }
}

function restoreDraft() {
  const draft = localStorage.getItem(DRAFT_KEY);
  if (!draft) {
    return;
  }
  try {
    const data = JSON.parse(draft);
    if (!data || !data.svg) {
      return;
    }
    const policy = getDraftPolicy();
    if (policy === "auto-restore") {
      applyDraft(data);
      return;
    }
    if (policy === "ignore") {
      return;
    }
    openDraftModal(data);
  } catch (error) {
    localStorage.removeItem(DRAFT_KEY);
  }
}

function saveDraft() {
  const payload = {
    svg: serializeSvg(false),
    background: state.doc.background,
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  docStatus.textContent = "草稿已保存";
}

function pushHistory(label) {
  if (state.history.locked) {
    return;
  }
  const snapshot = {
    svg: serializeSvg(false),
    background: state.doc.background,
    viewBox: { ...state.doc.viewBox },
    width: state.doc.width,
    height: state.doc.height,
  };
  const last = state.history.undo[state.history.undo.length - 1];
  if (last && last.svg === snapshot.svg) {
    return;
  }
  state.history.undo.push(snapshot);
  if (state.history.undo.length > 50) {
    state.history.undo.shift();
  }
  state.history.redo.length = 0;
  updateHistoryButtons();
  saveDraft();
}

function undo() {
  if (state.history.undo.length <= 1) {
    return;
  }
  const current = state.history.undo.pop();
  state.history.redo.push(current);
  const previous = state.history.undo[state.history.undo.length - 1];
  applySnapshot(previous);
  updateHistoryButtons();
}

function redo() {
  const next = state.history.redo.pop();
  if (!next) {
    return;
  }
  state.history.undo.push(next);
  applySnapshot(next);
  updateHistoryButtons();
}

function applySnapshot(snapshot) {
  state.history.locked = true;
  loadSvgFromText(snapshot.svg, { pushHistory: false });
  state.doc.background = snapshot.background || "#ffffff";
  state.doc.viewBox = snapshot.viewBox || state.doc.viewBox;
  state.doc.width = snapshot.width || state.doc.width;
  state.doc.height = snapshot.height || state.doc.height;
  applyDocSettings();
  updateViewBox();
  state.history.locked = false;
}

function updateHistoryButtons() {
  btnUndo.disabled = state.history.undo.length <= 1;
  btnRedo.disabled = state.history.redo.length === 0;
}

function onWheel(event) {
  event.preventDefault();
  const point = svgPoint(event);
  const delta = event.deltaY > 0 ? 0.9 : 1.1;
  setZoom(state.ui.zoom * delta, point);
}

function onPointerDown(event) {
  const point = svgPoint(event);
  const target = event.target;
  const handle = target.getAttribute("data-handle");
  const nodeIndex = target.getAttribute("data-node-index");

  if (state.ui.spacePan || state.ui.tool === "pan") {
    state.drag = {
      type: "pan",
      start: point,
      panX: state.ui.panX,
      panY: state.ui.panY,
    };
    return;
  }

  if (handle) {
    startResize(handle, point);
    return;
  }

  if (nodeIndex !== null) {
    startNodeDrag(Number(nodeIndex), point);
    return;
  }

  if (state.pathEdit && state.pathEdit.addMode) {
    state.pathEdit.addMode = false;
    addNodeAtPoint(point);
    return;
  }

  if (state.ui.tool === "path" && state.pathDraw) {
    addPathPoint(point);
    return;
  }

  if (state.ui.tool === "path" && !state.pathDraw) {
    startPathDraw(point);
    return;
  }

  if (state.ui.tool === "text") {
    const text = createSvgElement("text", {
      x: point.x,
      y: point.y,
    });
    text.textContent = "文字";
    applyDefaultStyle(text, {
      fill: "#1b1916",
      stroke: "none",
      "stroke-width": 0,
    });
    text.setAttribute("font-family", "IBM Plex Sans");
    text.setAttribute("font-size", "28");
    content.appendChild(text);
    setSelection([text]);
    pushHistory("text");
    return;
  }

  if (state.ui.tool === "image") {
    fileImage.click();
    return;
  }

  if (state.ui.tool === "zoom") {
    const scale = event.shiftKey ? 0.9 : 1.1;
    setZoom(state.ui.zoom * scale, point);
    return;
  }

  const selectable = findSelectable(target, {
    preferGroup: !event.altKey,
    allowCycle: !event.shiftKey,
  });

  if (state.ui.tool === "select" || state.ui.tool === "nodes") {
    if (selectable) {
      const add = event.shiftKey;
      setSelection([selectable], { append: add });
      startMove(point);
    } else {
      clearSelection();
      startMarquee(point);
    }
    return;
  }

  if (["rect", "square", "circle", "ellipse", "line", "arrow"].includes(state.ui.tool)) {
    startShapeDraw(point, state.ui.tool);
  }
}

function onPointerMove(event) {
  if (!state.drag) {
    return;
  }
  const point = svgPoint(event);
  const drag = state.drag;

  if (drag.type === "pan") {
    const dx = point.x - drag.start.x;
    const dy = point.y - drag.start.y;
    state.ui.panX = drag.panX - dx;
    state.ui.panY = drag.panY - dy;
    updateViewBox();
    return;
  }

  if (drag.type === "move") {
    const dx = point.x - drag.start.x;
    const dy = point.y - drag.start.y;
    moveSelection(dx, dy);
    return;
  }

  if (drag.type === "resize") {
    resizeSelection(point);
    return;
  }

  if (drag.type === "rotate") {
    rotateSelection(point);
    return;
  }

  if (drag.type === "marquee") {
    updateMarquee(point);
    return;
  }

  if (drag.type === "draw") {
    updateShapeDraw(point);
    return;
  }

  if (drag.type === "node") {
    updateNodeDrag(point);
  }
}

function onPointerUp() {
  if (!state.drag) {
    return;
  }
  const type = state.drag.type;
  if (["move", "resize", "rotate", "draw", "node"].includes(type)) {
    pushHistory(type);
  }
  if (type === "marquee") {
    finalizeMarquee();
  }
  clearGuides();
  state.drag = null;
}

function onDoubleClick(event) {
  if (state.pathDraw) {
    finishPathDraw();
    return;
  }
  if (
    state.pathEdit &&
    (event.target.closest("#sve-content") ||
      event.target.closest("#sve-nodes"))
  ) {
    if (state.pathEdit.addMode) {
      return;
    }
    const point = svgPoint(event);
    addNodeAtPoint(point);
  }
}

function svgPoint(event) {
  const pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) {
    return { x: event.offsetX, y: event.offsetY };
  }
  return pt.matrixTransform(matrix.inverse());
}

function findSelectable(target, options = {}) {
  const textTarget = getTextTarget(target);
  const baseTarget = textTarget || target;
  const path = buildSelectablePath(baseTarget);
  if (!path.length) {
    return null;
  }
  const preferGroup = options.preferGroup !== false && !textTarget;
  const allowCycle = options.allowCycle !== false;
  let order = path;
  if (preferGroup) {
    const groupIndex = path.findIndex(
      (el) => el.tagName && el.tagName.toLowerCase() === "g"
    );
    if (groupIndex >= 0) {
      order = buildDepthCycleOrder(path, groupIndex);
    }
  }
  if (allowCycle) {
    const now = Date.now();
    if (
      state.hitTest &&
      state.hitTest.target === target &&
      now - state.hitTest.time < HIT_TEST_TIMEOUT
    ) {
      const nextIndex = (state.hitTest.index + 1) % order.length;
      state.hitTest = {
        target,
        order,
        index: nextIndex,
        time: now,
      };
      return order[nextIndex];
    }
  } else {
    state.hitTest = null;
  }
  state.hitTest = {
    target,
    order,
    index: 0,
    time: Date.now(),
  };
  return order[0];
}

function getTextTarget(target) {
  if (!target) {
    return null;
  }
  const textEl = target.closest("text");
  if (!textEl) {
    return null;
  }
  if (textEl.closest("[data-sve-ui]")) {
    return null;
  }
  if (!textEl.closest("#sve-content") || textEl.closest("defs")) {
    return null;
  }
  return textEl;
}

function buildSelectablePath(target) {
  if (!target || target === svg) {
    return [];
  }
  if (target.closest("[data-sve-ui]")) {
    return [];
  }
  if (!target.closest("#sve-content") || target.closest("defs")) {
    return [];
  }
  const path = [];
  let node = target;
  while (node && node !== content && path.length < MAX_SELECT_DEPTH) {
    if (node.tagName) {
      const tag = node.tagName.toLowerCase();
      if (isSelectableTag(tag)) {
        path.push(node);
      }
    }
    node = node.parentNode;
  }
  return path;
}

function buildDepthCycleOrder(path, startIndex) {
  const order = [path[startIndex]];
  for (let i = startIndex - 1; i >= 0; i -= 1) {
    order.push(path[i]);
  }
  for (let i = startIndex + 1; i < path.length; i += 1) {
    order.push(path[i]);
  }
  return order;
}

function isSelectableTag(tag) {
  return [
    "rect",
    "circle",
    "ellipse",
    "line",
    "path",
    "polygon",
    "polyline",
    "text",
    "image",
    "use",
    "g",
  ].includes(tag);
}

function setSelection(elements, options = {}) {
  const append = options.append || false;
  if (!append) {
    clearSelection();
  }
  const next = [...state.selection];
  elements.forEach((el) => {
    if (!next.includes(el)) {
      next.push(el);
      el.setAttribute("data-sve-selected", "1");
    }
  });
  state.selection = next;
  updateSelectionUI();
}

function clearSelection() {
  state.selection.forEach((el) => el.removeAttribute("data-sve-selected"));
  state.selection = [];
  stopPathEdit();
  updateSelectionUI();
}

function updateSelectionUI() {
  selectionLayer.innerHTML = "";
  if (!state.drag) {
    guidesLayer.innerHTML = "";
  }
  nodesLayer.innerHTML = "";

  const selection = state.selection;
  statusSelection.textContent = selection.length
    ? `已选 ${selection.length} 个`
    : "未选择";

  if (!selection.length) {
    fieldType.value = "";
    fieldId.value = "";
    geometryFields.innerHTML = "";
    updateStyleFields();
    return;
  }

  const bbox = getSelectionBBox();
  if (bbox) {
    const rect = createSvgElement("rect", {
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
      class: "selection-box",
    });
    selectionLayer.appendChild(rect);

    if (selection.length === 1 && !state.pathEdit) {
      const handles = getHandlePoints(bbox);
      handles.forEach((handle) => {
        if (handle.type === "rotate") {
          const arrow = createRotationArrow(handle.x, handle.y);
          selectionLayer.appendChild(arrow.arc);
          selectionLayer.appendChild(arrow.head);
        }
        const radius = handle.type === "rotate" ? 5 : 4;
        const circle = createSvgElement("circle", {
          cx: handle.x,
          cy: handle.y,
          r: radius,
          class: `selection-handle ${handle.type === "rotate" ? "rotation-handle" : ""}`,
          "data-handle": handle.type,
        });
        selectionLayer.appendChild(circle);
      });
    }
  }

  updateFieldsForSelection();
  if (state.pathEdit) {
    renderPathNodes();
  }
  if (modalSource.open) {
    highlightSourceSelection();
  }
}

function updateFieldsForSelection() {
  if (state.selection.length === 1) {
    const el = state.selection[0];
    ensureElementId(el);
    fieldType.value = el.tagName.toLowerCase();
    fieldId.value = el.id || "";
    renderGeometryFields(el);
  } else {
    fieldType.value = "多选";
    fieldId.value = "";
    geometryFields.innerHTML =
      "<div class=\"panel-note\">多选状态下不显示几何参数。</div>";
  }
  updateStyleFields();
  updateTransformFields();
}

function updateStyleFields() {
  const attrs = [
    ["stroke-width", fieldStrokeWidth],
    ["stroke-linecap", fieldLinecap],
    ["stroke-linejoin", fieldLinejoin],
    ["stroke-dasharray", fieldDasharray],
  ];
  attrs.forEach(([attr, input]) => {
    const value = getCommonAttribute(attr);
    input.value = value ?? "";
  });
  const fillValue = getCommonAttribute("fill");
  fieldFill.value = fillValue ?? "";
  updateColorFieldState(fieldFill, fieldFillColor, btnFillNone);

  const strokeValue = getCommonAttribute("stroke");
  fieldStroke.value = strokeValue ?? "";
  updateColorFieldState(fieldStroke, fieldStrokeColor, btnStrokeNone);

  const opacityValue = getCommonOpacity();
  setOpacityInputs(opacityValue);
}

function applyStyleValue(attr, value) {
  if (!state.selection.length) {
    return;
  }
  state.selection.forEach((el) => {
    if (value === "") {
      el.removeAttribute(attr);
    } else {
      el.setAttribute(attr, value);
    }
  });
  updateSelectionUI();
}

function bindColorField(input, colorInput, noneButton, attr, fallback) {
  input.addEventListener("input", () => {
    if (!state.selection.length) {
      return;
    }
    const value = input.value.trim();
    applyStyleValue(attr, value);
    updateColorFieldState(input, colorInput, noneButton);
  });

  input.addEventListener("change", () => {
    if (state.selection.length) {
      pushHistory("style");
    }
  });

  colorInput.addEventListener("input", () => {
    if (!state.selection.length) {
      return;
    }
    const value = colorInput.value;
    input.value = value;
    applyStyleValue(attr, value);
    updateColorFieldState(input, colorInput, noneButton);
  });

  colorInput.addEventListener("change", () => {
    if (state.selection.length) {
      pushHistory("style");
    }
  });

  if (noneButton) {
    noneButton.addEventListener("click", () => {
      if (!state.selection.length) {
        return;
      }
      toggleNoneStyle(attr, input, colorInput, noneButton, fallback);
      pushHistory("style");
    });
  }
}

function updateColorFieldState(input, colorInput, noneButton) {
  const value = input.value.trim().toLowerCase();
  const isNone = value === "none";
  if (noneButton) {
    noneButton.classList.toggle("active", isNone);
    noneButton.setAttribute("aria-pressed", isNone ? "true" : "false");
  }
  if (colorInput) {
    colorInput.disabled = isNone;
  }
  if (!isNone && colorInput) {
    syncColorInput(input.value, colorInput);
  }
}

function toggleNoneStyle(attr, input, colorInput, noneButton, fallback) {
  const value = input.value.trim().toLowerCase();
  if (value === "none") {
    const restore =
      input.dataset.prevColor ||
      (colorInput ? colorInput.value : "") ||
      fallback;
    input.value = restore;
    applyStyleValue(attr, restore);
  } else {
    if (isHexColor(input.value)) {
      input.dataset.prevColor = normalizeHex(input.value);
    } else if (colorInput && isHexColor(colorInput.value)) {
      input.dataset.prevColor = normalizeHex(colorInput.value);
    }
    input.value = "none";
    applyStyleValue(attr, "none");
  }
  updateColorFieldState(input, colorInput, noneButton);
}

function bindOpacityField() {
  const applyOpacity = (rawValue) => {
    if (!state.selection.length) {
      return;
    }
    const percent = normalizeOpacityPercent(rawValue);
    if (percent === null) {
      return;
    }
    const rounded = Math.round(percent);
    fieldOpacity.value = rounded;
    fieldOpacityRange.value = rounded;
    const value = roundNumber(rounded / 100, 2);
    applyStyleValue("opacity", value === 1 ? "1" : String(value));
  };

  fieldOpacity.addEventListener("input", () => {
    applyOpacity(fieldOpacity.value);
  });

  fieldOpacityRange.addEventListener("input", () => {
    applyOpacity(fieldOpacityRange.value);
  });

  fieldOpacity.addEventListener("change", () => {
    if (state.selection.length) {
      pushHistory("style");
    }
  });

  fieldOpacityRange.addEventListener("change", () => {
    if (state.selection.length) {
      pushHistory("style");
    }
  });
}

function normalizeOpacityPercent(value) {
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return clamp(parsed, 0, 100);
}

function updateTransformFields() {
  if (state.selection.length !== 1) {
    fieldRotate.value = "";
    fieldScale.value = "";
    return;
  }
  const matrix = getElementMatrix(state.selection[0]);
  fieldRotate.value = Math.round(getRotationFromMatrix(matrix));
  fieldScale.value = roundNumber(getScaleFromMatrix(matrix), 2);
}

function renderGeometryFields(el) {
  geometryFields.innerHTML = "";
  const tag = el.tagName.toLowerCase();
  const fields = [];

  if (tag === "rect") {
    fields.push(
      ["x", "x"],
      ["y", "y"],
      ["width", "width"],
      ["height", "height"],
      ["rx", "rx"],
      ["ry", "ry"]
    );
  } else if (tag === "circle") {
    fields.push(["cx", "cx"], ["cy", "cy"], ["r", "r"]);
  } else if (tag === "ellipse") {
    fields.push(["cx", "cx"], ["cy", "cy"], ["rx", "rx"], ["ry", "ry"]);
  } else if (tag === "line") {
    fields.push(["x1", "x1"], ["y1", "y1"], ["x2", "x2"], ["y2", "y2"]);
  } else if (tag === "image") {
    fields.push(["x", "x"], ["y", "y"], ["width", "width"], ["height", "height"]);
    fields.push(["href", "href", true]);
  } else if (tag === "text") {
    fields.push(["text", "textContent"]);
    fields.push(["x", "x"], ["y", "y"]);
    fields.push(["font", "font-family"]);
    fields.push(["size", "font-size"]);
    fields.push(["weight", "font-weight"]);
    fields.push(["style", "font-style"]);
    fields.push(["anchor", "text-anchor"]);
  } else if (tag === "path") {
    fields.push(["d", "d"]);
  }

  fields.forEach(([label, attr, readOnly]) => {
    const field = document.createElement("div");
    field.className = "field";
    const id = `geo-${label}`;
    field.innerHTML = `<label for="${id}">${label}</label>`;
    const input = document.createElement("input");
    input.id = id;
    input.type = "text";
    input.value =
      attr === "textContent" ? el.textContent : el.getAttribute(attr) || "";
    if (readOnly) {
      input.disabled = true;
    }
    input.addEventListener("change", () => {
      if (attr === "textContent") {
        el.textContent = input.value;
      } else {
        if (input.value === "") {
          el.removeAttribute(attr);
        } else {
          el.setAttribute(attr, input.value);
        }
      }
      updateSelectionUI();
      pushHistory("geometry");
    });
    field.appendChild(input);
    geometryFields.appendChild(field);
  });
}

function getCommonAttribute(attr) {
  if (!state.selection.length) {
    return null;
  }
  const values = state.selection.map((el) => el.getAttribute(attr) || "");
  const first = values[0];
  const allSame = values.every((val) => val === first);
  return allSame ? first : "";
}

function getCommonOpacity() {
  if (!state.selection.length) {
    return null;
  }
  const values = state.selection.map((el) => {
    const raw = el.getAttribute("opacity");
    if (raw === null || raw === "") {
      return 1;
    }
    const num = parseFloat(raw);
    return Number.isFinite(num) ? num : 1;
  });
  const first = values[0];
  const allSame = values.every((val) => val === first);
  return allSame ? first : null;
}

function setOpacityInputs(value) {
  if (value === null) {
    fieldOpacity.value = "";
    fieldOpacityRange.value = 100;
    return;
  }
  const percent = Math.round(clamp(value * 100, 0, 100));
  fieldOpacity.value = percent;
  fieldOpacityRange.value = percent;
}

function getSelectionBBox() {
  if (!state.selection.length) {
    return null;
  }
  const boxes = state.selection
    .map((el) => getTransformedBBox(el))
    .filter(Boolean);
  if (!boxes.length) {
    return null;
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  boxes.forEach((box) => {
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  });
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function getTransformedBBox(el) {
  try {
    const bbox = el.getBBox();
    const screenMatrix = el.getScreenCTM();
    const rootMatrix = svg.getScreenCTM();
    if (!screenMatrix || !rootMatrix) {
      return bbox;
    }
    const rootInverse = rootMatrix.inverse();
    const points = [
      transformPointToRoot(screenMatrix, rootInverse, bbox.x, bbox.y),
      transformPointToRoot(
        screenMatrix,
        rootInverse,
        bbox.x + bbox.width,
        bbox.y
      ),
      transformPointToRoot(
        screenMatrix,
        rootInverse,
        bbox.x + bbox.width,
        bbox.y + bbox.height
      ),
      transformPointToRoot(
        screenMatrix,
        rootInverse,
        bbox.x,
        bbox.y + bbox.height
      ),
    ];
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  } catch (error) {
    return null;
  }
}

function transformPoint(matrix, x, y) {
  const point = svg.createSVGPoint();
  point.x = x;
  point.y = y;
  const result = point.matrixTransform(matrix);
  return { x: result.x, y: result.y };
}

function transformPointToRoot(screenMatrix, rootInverse, x, y) {
  const point = svg.createSVGPoint();
  point.x = x;
  point.y = y;
  const screenPoint = point.matrixTransform(screenMatrix);
  const rootPoint = screenPoint.matrixTransform(rootInverse);
  return { x: rootPoint.x, y: rootPoint.y };
}

function getHandlePoints(bbox) {
  const x = bbox.x;
  const y = bbox.y;
  const w = bbox.width;
  const h = bbox.height;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return [
    { x, y, type: "nw" },
    { x: cx, y, type: "n" },
    { x: x + w, y, type: "ne" },
    { x: x + w, y: cy, type: "e" },
    { x: x + w, y: y + h, type: "se" },
    { x: cx, y: y + h, type: "s" },
    { x, y: y + h, type: "sw" },
    { x, y: cy, type: "w" },
    { x: cx, y: y - 30, type: "rotate" },
  ];
}

function polarToPoint(cx, cy, radius, angle) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function createRotationArrow(cx, cy) {
  const radius = 10;
  const startAngle = Math.PI * 0.15;
  const endAngle = Math.PI * 1.15;
  const start = polarToPoint(cx, cy, radius, startAngle);
  const end = polarToPoint(cx, cy, radius, endAngle);
  const largeArc = endAngle - startAngle <= Math.PI ? 0 : 1;
  const arc = createSvgElement("path", {
    d: `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    class: "rotation-arrow",
  });
  const vx = end.x - cx;
  const vy = end.y - cy;
  const len = Math.hypot(vx, vy) || 1;
  const tx = vy / len;
  const ty = -vx / len;
  const head = 4;
  const back = 2;
  const left = {
    x: end.x - tx * head - (vx / len) * back,
    y: end.y - ty * head - (vy / len) * back,
  };
  const right = {
    x: end.x + tx * head - (vx / len) * back,
    y: end.y + ty * head - (vy / len) * back,
  };
  const headEl = createSvgElement("polygon", {
    points: `${left.x} ${left.y} ${end.x} ${end.y} ${right.x} ${right.y}`,
    class: "rotation-arrowhead",
  });
  return { arc, head: headEl };
}

function startMove(point) {
  if (!state.selection.length) {
    return;
  }
  const bbox = getSelectionBBox();
  state.drag = {
    type: "move",
    start: point,
    bbox,
    elements: state.selection.map((el) => ({
      el,
      matrix: getElementMatrix(el),
    })),
  };
}

function moveSelection(dx, dy) {
  if (!state.drag) {
    return;
  }
  let nextDx = dx;
  let nextDy = dy;
  if (state.ui.snap && state.drag.bbox) {
    const snapped = applySnap(nextDx, nextDy, state.drag.bbox);
    nextDx = snapped.dx;
    nextDy = snapped.dy;
    drawGuides(snapped.guides);
  }
  state.drag.elements.forEach(({ el, matrix }) => {
    const next = new DOMMatrix(matrix).translate(nextDx, nextDy);
    setElementMatrix(el, next);
  });
  updateSelectionUI();
}

function startResize(handle, point) {
  if (state.selection.length !== 1) {
    return;
  }
  const bbox = getSelectionBBox();
  if (!bbox) {
    return;
  }
  if (handle === "rotate") {
    const center = {
      x: bbox.x + bbox.width / 2,
      y: bbox.y + bbox.height / 2,
    };
    state.drag = {
      type: "rotate",
      start: point,
      center,
      angle: Math.atan2(point.y - center.y, point.x - center.x),
      elements: state.selection.map((el) => ({
        el,
        matrix: getElementMatrix(el),
      })),
    };
    return;
  }

  state.drag = {
    type: "resize",
    handle,
    start: point,
    bbox,
    elements: state.selection.map((el) => ({
      el,
      matrix: getElementMatrix(el),
    })),
  };
}

function resizeSelection(point) {
  const drag = state.drag;
  if (!drag || drag.type !== "resize") {
    return;
  }
  const { bbox, handle } = drag;
  const anchor = getResizeAnchor(bbox, handle);
  const scale = getResizeScale(bbox, handle, point);

  drag.elements.forEach(({ el, matrix }) => {
    const transform = new DOMMatrix()
      .translate(anchor.x, anchor.y)
      .scale(scale.x, scale.y)
      .translate(-anchor.x, -anchor.y);
    setElementMatrix(el, transform.multiply(matrix));
  });
  updateSelectionUI();
}

function getResizeAnchor(bbox, handle) {
  const x0 = bbox.x;
  const y0 = bbox.y;
  const w = bbox.width;
  const h = bbox.height;
  const right = x0 + w;
  const bottom = y0 + h;
  const cx = x0 + w / 2;
  const cy = y0 + h / 2;

  if (handle === "n") {
    return { x: cx, y: bottom };
  }
  if (handle === "s") {
    return { x: cx, y: y0 };
  }
  if (handle === "e") {
    return { x: x0, y: cy };
  }
  if (handle === "w") {
    return { x: right, y: cy };
  }

  const anchorX = handle.includes("e") ? x0 : right;
  const anchorY = handle.includes("s") ? y0 : bottom;
  return { x: anchorX, y: anchorY };
}

function getResizeScale(bbox, handle, point) {
  const minSize = 8;
  const safeWidth = Math.max(bbox.width, minSize);
  const safeHeight = Math.max(bbox.height, minSize);
  let scaleX = 1;
  let scaleY = 1;
  if (handle.includes("e")) {
    const next = Math.max(minSize, point.x - bbox.x);
    scaleX = next / safeWidth;
  }
  if (handle.includes("w")) {
    const next = Math.max(minSize, bbox.x + bbox.width - point.x);
    scaleX = next / safeWidth;
  }
  if (handle.includes("s")) {
    const next = Math.max(minSize, point.y - bbox.y);
    scaleY = next / safeHeight;
  }
  if (handle.includes("n")) {
    const next = Math.max(minSize, bbox.y + bbox.height - point.y);
    scaleY = next / safeHeight;
  }
  if (!Number.isFinite(scaleX)) {
    scaleX = 1;
  }
  if (!Number.isFinite(scaleY)) {
    scaleY = 1;
  }
  return { x: scaleX, y: scaleY };
}

function rotateSelection(point) {
  const drag = state.drag;
  if (!drag || drag.type !== "rotate") {
    return;
  }
  const angle = Math.atan2(point.y - drag.center.y, point.x - drag.center.x);
  const delta = angle - drag.angle;
  const degrees = (delta * 180) / Math.PI;

  drag.elements.forEach(({ el, matrix }) => {
    const transform = new DOMMatrix()
      .translate(drag.center.x, drag.center.y)
      .rotate(degrees)
      .translate(-drag.center.x, -drag.center.y);
    setElementMatrix(el, transform.multiply(matrix));
  });
  updateSelectionUI();
}

function startMarquee(point) {
  const rect = createSvgElement("rect", {
    x: point.x,
    y: point.y,
    width: 0,
    height: 0,
    class: "selection-box",
    "data-marquee": "1",
  });
  selectionLayer.appendChild(rect);
  state.drag = { type: "marquee", start: point, rect };
}

function updateMarquee(point) {
  const drag = state.drag;
  if (!drag || drag.type !== "marquee") {
    return;
  }
  const x = Math.min(drag.start.x, point.x);
  const y = Math.min(drag.start.y, point.y);
  const w = Math.abs(point.x - drag.start.x);
  const h = Math.abs(point.y - drag.start.y);
  drag.rect.setAttribute("x", x);
  drag.rect.setAttribute("y", y);
  drag.rect.setAttribute("width", w);
  drag.rect.setAttribute("height", h);
}

function finalizeMarquee() {
  const rect = selectionLayer.querySelector("[data-marquee]");
  if (!rect) {
    return;
  }
  const box = {
    x: parseFloat(rect.getAttribute("x")),
    y: parseFloat(rect.getAttribute("y")),
    width: parseFloat(rect.getAttribute("width")),
    height: parseFloat(rect.getAttribute("height")),
  };
  rect.remove();
  const elements = Array.from(content.querySelectorAll("*")).filter((el) => {
    const bb = getTransformedBBox(el);
    if (!bb) {
      return false;
    }
    return (
      bb.x < box.x + box.width &&
      bb.x + bb.width > box.x &&
      bb.y < box.y + box.height &&
      bb.y + bb.height > box.y
    );
  });
  if (elements.length) {
    setSelection(elements);
  }
}

function startShapeDraw(point, tool) {
  let element;
  if (tool === "rect") {
    element = createSvgElement("rect", {
      x: point.x,
      y: point.y,
      width: 1,
      height: 1,
      rx: 0,
      ry: 0,
    });
    applyDefaultStyle(element);
  }
  if (tool === "square") {
    element = createSvgElement("rect", {
      x: point.x,
      y: point.y,
      width: 1,
      height: 1,
      rx: 0,
      ry: 0,
    });
    applyDefaultStyle(element);
  }
  if (tool === "circle") {
    element = createSvgElement("circle", {
      cx: point.x,
      cy: point.y,
      r: 1,
    });
    applyDefaultStyle(element);
  }
  if (tool === "ellipse") {
    element = createSvgElement("ellipse", {
      cx: point.x,
      cy: point.y,
      rx: 1,
      ry: 1,
    });
    applyDefaultStyle(element);
  }
  if (tool === "line") {
    element = createSvgElement("line", {
      x1: point.x,
      y1: point.y,
      x2: point.x + 1,
      y2: point.y + 1,
    });
    element.setAttribute("fill", "none");
    element.setAttribute("stroke", defaultStyle.stroke);
    element.setAttribute("stroke-width", defaultStyle["stroke-width"]);
  }
  if (tool === "arrow") {
    ensureArrowMarker();
    element = createSvgElement("line", {
      x1: point.x,
      y1: point.y,
      x2: point.x + 1,
      y2: point.y + 1,
      "marker-end": "url(#sve-arrow)",
    });
    element.setAttribute("fill", "none");
    element.setAttribute("stroke", defaultStyle.stroke);
    element.setAttribute("stroke-width", defaultStyle["stroke-width"]);
    element.setAttribute("stroke-linecap", "round");
  }
  if (!element) {
    return;
  }
  content.appendChild(element);
  state.drag = { type: "draw", tool, start: point, element };
  setSelection([element]);
}

function updateShapeDraw(point) {
  const drag = state.drag;
  if (!drag || drag.type !== "draw") {
    return;
  }
  const start = drag.start;
  const element = drag.element;
  const tool = drag.tool;

  if (tool === "rect") {
    const x = Math.min(start.x, point.x);
    const y = Math.min(start.y, point.y);
    const w = Math.abs(point.x - start.x);
    const h = Math.abs(point.y - start.y);
    element.setAttribute("x", x);
    element.setAttribute("y", y);
    element.setAttribute("width", w);
    element.setAttribute("height", h);
  }
  if (tool === "square") {
    const size = Math.max(Math.abs(point.x - start.x), Math.abs(point.y - start.y));
    const x = point.x < start.x ? start.x - size : start.x;
    const y = point.y < start.y ? start.y - size : start.y;
    element.setAttribute("x", x);
    element.setAttribute("y", y);
    element.setAttribute("width", size);
    element.setAttribute("height", size);
  }
  if (tool === "circle") {
    const r = Math.max(Math.abs(point.x - start.x), Math.abs(point.y - start.y));
    element.setAttribute("r", r);
  }
  if (tool === "ellipse") {
    const rx = Math.abs(point.x - start.x);
    const ry = Math.abs(point.y - start.y);
    element.setAttribute("rx", rx);
    element.setAttribute("ry", ry);
  }
  if (tool === "line") {
    element.setAttribute("x2", point.x);
    element.setAttribute("y2", point.y);
  }
  if (tool === "arrow") {
    element.setAttribute("x2", point.x);
    element.setAttribute("y2", point.y);
  }
  updateSelectionUI();
}

function startPathDraw(point) {
  const path = createSvgElement("path", {
    d: `M ${point.x} ${point.y}`,
  });
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", defaultStyle.stroke);
  path.setAttribute("stroke-width", defaultStyle["stroke-width"]);
  content.appendChild(path);
  state.pathDraw = {
    element: path,
    points: [point],
  };
  setSelection([path]);
  showToast("点击添加节点，双击结束路径。");
}

function addPathPoint(point) {
  if (!state.pathDraw) {
    return;
  }
  state.pathDraw.points.push(point);
  const d = buildPathD(state.pathDraw.points, false);
  state.pathDraw.element.setAttribute("d", d);
  updateSelectionUI();
}

function finishPathDraw() {
  if (!state.pathDraw) {
    return;
  }
  pushHistory("path");
  state.pathDraw = null;
}

function cancelPathDraw() {
  if (!state.pathDraw) {
    return;
  }
  state.pathDraw.element.remove();
  state.pathDraw = null;
  showToast("已取消路径绘制。");
  updateSelectionUI();
}

function addImageElement(dataUrl, naturalWidth, naturalHeight) {
  const view = getUiViewBox();
  const width = Math.min(naturalWidth, view.width * 0.6);
  const height = (naturalHeight / naturalWidth) * width;
  const x = view.x + (view.width - width) / 2;
  const y = view.y + (view.height - height) / 2;
  const image = createSvgElement("image", {
    x,
    y,
    width,
    height,
  });
  image.setAttribute("href", dataUrl);
  content.appendChild(image);
  setSelection([image]);
  pushHistory("image");
}

function applyDefaultStyle(element, overrides = {}) {
  Object.entries({ ...defaultStyle, ...overrides }).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

function createSvgElement(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });
  ensureElementId(el);
  return el;
}

function ensureArrowMarker() {
  if (!defs) {
    return null;
  }
  let marker = defs.querySelector("#sve-arrow");
  if (marker) {
    return marker;
  }
  marker = document.createElementNS(SVG_NS, "marker");
  marker.setAttribute("id", "sve-arrow");
  marker.setAttribute("viewBox", "0 0 10 10");
  marker.setAttribute("refX", "9");
  marker.setAttribute("refY", "5");
  marker.setAttribute("markerWidth", "8");
  marker.setAttribute("markerHeight", "8");
  marker.setAttribute("orient", "auto");
  marker.setAttribute("markerUnits", "strokeWidth");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
  path.setAttribute("fill", "context-stroke");
  marker.appendChild(path);
  defs.appendChild(marker);
  return marker;
}

function ensureElementId(el) {
  if (!el.id) {
    el.id = ensureUniqueId(`sve-${state.idCounter++}`);
  }
  return el.id;
}

function ensureUniqueId(base) {
  let id = base;
  let index = 1;
  while (document.getElementById(id)) {
    id = `${base}-${index++}`;
  }
  return id;
}

function ensureIds() {
  Array.from(content.querySelectorAll("*")).forEach((el) => {
    ensureElementId(el);
  });
}

function getElementMatrix(el) {
  const base = el.transform.baseVal.consolidate();
  if (base && base.matrix) {
    const m = base.matrix;
    if (typeof DOMMatrix.fromMatrix === "function") {
      return DOMMatrix.fromMatrix(m);
    }
    return new DOMMatrix([m.a, m.b, m.c, m.d, m.e, m.f]);
  }
  return new DOMMatrix();
}

function setElementMatrix(el, matrix) {
  if (
    !matrix ||
    ![
      matrix.a,
      matrix.b,
      matrix.c,
      matrix.d,
      matrix.e,
      matrix.f,
    ].every(Number.isFinite)
  ) {
    el.removeAttribute("transform");
    return;
  }
  el.setAttribute(
    "transform",
    `matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f})`
  );
}

function getRotationFromMatrix(matrix) {
  return (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
}

function getScaleFromMatrix(matrix) {
  const scaleX = Math.hypot(matrix.a, matrix.b);
  return scaleX || 1;
}

function setElementRotation(el, angle) {
  const bbox = getTransformedBBox(el);
  if (!bbox) {
    return;
  }
  const center = {
    x: bbox.x + bbox.width / 2,
    y: bbox.y + bbox.height / 2,
  };
  const current = getRotationFromMatrix(getElementMatrix(el));
  const delta = angle - current;
  const matrix = new DOMMatrix()
    .translate(center.x, center.y)
    .rotate(delta)
    .translate(-center.x, -center.y);
  setElementMatrix(el, matrix.multiply(getElementMatrix(el)));
}

function setElementScale(el, scale) {
  const bbox = getTransformedBBox(el);
  if (!bbox) {
    return;
  }
  const center = {
    x: bbox.x + bbox.width / 2,
    y: bbox.y + bbox.height / 2,
  };
  const current = getScaleFromMatrix(getElementMatrix(el));
  const delta = scale / current;
  const matrix = new DOMMatrix()
    .translate(center.x, center.y)
    .scale(delta)
    .translate(-center.x, -center.y);
  setElementMatrix(el, matrix.multiply(getElementMatrix(el)));
}

function applySnap(dx, dy, bbox) {
  const canvas = state.doc.viewBox;
  const tolerance = 6;
  let snapX = dx;
  let snapY = dy;
  const guides = [];

  const next = {
    left: bbox.x + dx,
    right: bbox.x + bbox.width + dx,
    top: bbox.y + dy,
    bottom: bbox.y + bbox.height + dy,
    centerX: bbox.x + bbox.width / 2 + dx,
    centerY: bbox.y + bbox.height / 2 + dy,
  };

  const targetsX = [
    { value: canvas.x, type: "left" },
    { value: canvas.x + canvas.width / 2, type: "centerX" },
    { value: canvas.x + canvas.width, type: "right" },
  ];
  const targetsY = [
    { value: canvas.y, type: "top" },
    { value: canvas.y + canvas.height / 2, type: "centerY" },
    { value: canvas.y + canvas.height, type: "bottom" },
  ];

  targetsX.forEach((target) => {
    const key = target.type;
    const delta = target.value - next[key];
    if (Math.abs(delta) <= tolerance) {
      snapX += delta;
      guides.push({ axis: "x", value: target.value });
    }
  });
  targetsY.forEach((target) => {
    const key = target.type;
    const delta = target.value - next[key];
    if (Math.abs(delta) <= tolerance) {
      snapY += delta;
      guides.push({ axis: "y", value: target.value });
    }
  });

  return { dx: snapX, dy: snapY, guides };
}

function drawGuides(lines) {
  guidesLayer.innerHTML = "";
  lines.forEach((line) => {
    if (line.axis === "x") {
      const el = createSvgElement("line", {
        x1: line.value,
        y1: state.doc.viewBox.y,
        x2: line.value,
        y2: state.doc.viewBox.y + state.doc.viewBox.height,
        class: "guide-line",
      });
      guidesLayer.appendChild(el);
    } else {
      const el = createSvgElement("line", {
        x1: state.doc.viewBox.x,
        y1: line.value,
        x2: state.doc.viewBox.x + state.doc.viewBox.width,
        y2: line.value,
        class: "guide-line",
      });
      guidesLayer.appendChild(el);
    }
  });
}

function clearGuides() {
  guidesLayer.innerHTML = "";
}

function alignSelection(mode) {
  if (!state.selection.length) {
    return;
  }
  const bbox = getSelectionBBox();
  if (!bbox) {
    return;
  }
  const canvas = state.doc.viewBox;
  let dx = 0;
  let dy = 0;

  if (mode === "left") {
    dx = canvas.x - bbox.x;
  }
  if (mode === "center-x") {
    dx = canvas.x + canvas.width / 2 - (bbox.x + bbox.width / 2);
  }
  if (mode === "right") {
    dx = canvas.x + canvas.width - (bbox.x + bbox.width);
  }
  if (mode === "top") {
    dy = canvas.y - bbox.y;
  }
  if (mode === "center-y") {
    dy = canvas.y + canvas.height / 2 - (bbox.y + bbox.height / 2);
  }
  if (mode === "bottom") {
    dy = canvas.y + canvas.height - (bbox.y + bbox.height);
  }

  state.selection.forEach((el) => {
    const matrix = getElementMatrix(el);
    setElementMatrix(el, matrix.translate(dx, dy));
  });
  updateSelectionUI();
  pushHistory("align");
}

function groupSelection() {
  if (state.selection.length < 2) {
    return;
  }
  const parents = new Set(state.selection.map((el) => el.parentNode));
  if (parents.size !== 1) {
    showToast("编组前需要处于同一父级。");
    return;
  }
  const parent = parents.values().next().value;
  const group = createSvgElement("g");
  const ordered = state.selection.slice().sort((a, b) => {
    return (
      Array.from(parent.children).indexOf(a) -
      Array.from(parent.children).indexOf(b)
    );
  });
  parent.insertBefore(group, ordered[0]);
  ordered.forEach((el) => group.appendChild(el));
  setSelection([group]);
  pushHistory("group");
}

function ungroupSelection() {
  const groups = state.selection.filter(
    (el) => el.tagName.toLowerCase() === "g"
  );
  if (!groups.length) {
    return;
  }
  groups.forEach((group) => {
    const parent = group.parentNode;
    const insertBefore = group.nextSibling;
    Array.from(group.children).forEach((child) => {
      parent.insertBefore(child, insertBefore);
    });
    group.remove();
  });
  clearSelection();
  pushHistory("ungroup");
}

function reorderSelection(mode) {
  if (!state.selection.length) {
    return;
  }
  const parent = state.selection[0].parentNode;
  const ordered = state.selection.slice().sort((a, b) => {
    return (
      Array.from(parent.children).indexOf(a) -
      Array.from(parent.children).indexOf(b)
    );
  });

  if (mode === "front") {
    ordered.forEach((el) => parent.appendChild(el));
  } else if (mode === "back") {
    ordered
      .slice()
      .reverse()
      .forEach((el) => parent.insertBefore(el, parent.firstChild));
  } else if (mode === "forward") {
    ordered
      .slice()
      .reverse()
      .forEach((el) => {
        const next = el.nextSibling;
        if (next) {
          parent.insertBefore(next, el);
        }
      });
  } else if (mode === "backward") {
    ordered.forEach((el) => {
      const prev = el.previousSibling;
      if (prev) {
        parent.insertBefore(el, prev);
      }
    });
  }
  updateSelectionUI();
  pushHistory("order");
}

function copySelection() {
  if (!state.selection.length) {
    return;
  }
  const fragment = state.selection.map((el) => el.outerHTML).join("");
  state.clipboard = fragment;
  showToast("已复制选中对象。");
}

function cutSelection() {
  copySelection();
  deleteSelection();
}

function pasteSelection() {
  if (!state.clipboard) {
    return;
  }
  const wrapper = document.createElementNS(SVG_NS, "svg");
  wrapper.innerHTML = state.clipboard;
  const elements = Array.from(wrapper.children).map((el) =>
    document.importNode(el, true)
  );
  const view = getUiViewBox();
  const offset = 24;
  elements.forEach((el) => {
    el.id = ensureUniqueId(el.id || `sve-${state.idCounter++}`);
    content.appendChild(el);
  });
  const bbox = getSelectionBBoxFor(elements);
  if (bbox) {
    const dx = view.x + view.width / 2 - (bbox.x + bbox.width / 2) + offset;
    const dy = view.y + view.height / 2 - (bbox.y + bbox.height / 2) + offset;
    elements.forEach((el) => {
      const matrix = getElementMatrix(el);
      setElementMatrix(el, matrix.translate(dx, dy));
    });
  }
  setSelection(elements);
  pushHistory("paste");
}

function deleteSelection() {
  if (!state.selection.length) {
    return;
  }
  state.selection.forEach((el) => el.remove());
  clearSelection();
  pushHistory("delete");
}

function getSelectionBBoxFor(elements) {
  const boxes = elements.map((el) => getTransformedBBox(el)).filter(Boolean);
  if (!boxes.length) {
    return null;
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  boxes.forEach((box) => {
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  });
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function fitToContent() {
  const elements = Array.from(content.children);
  if (!elements.length) {
    return;
  }
  const boxes = elements.map((el) => getTransformedBBox(el)).filter(Boolean);
  if (!boxes.length) {
    return;
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  boxes.forEach((box) => {
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  });
  const margin = 20;
  state.doc.viewBox = {
    x: minX - margin,
    y: minY - margin,
    width: maxX - minX + margin * 2,
    height: maxY - minY + margin * 2,
  };
  updateViewBox();
  pushHistory("fit");
}

function openSourceView() {
  sourceEditor.value = serializeSvg(false);
  sourceError.textContent = "";
  openModal(modalSource);
  highlightSourceSelection();
}

function highlightSourceSelection() {
  if (!modalSource.open || state.selection.length !== 1) {
    return;
  }
  const id = state.selection[0].id;
  if (!id) {
    return;
  }
  const text = sourceEditor.value;
  const index = text.indexOf(`id="${id}"`);
  if (index >= 0) {
    sourceEditor.focus();
    sourceEditor.setSelectionRange(index, index + id.length + 4);
  }
}

function validateSvg(text) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "image/svg+xml");
  const error = doc.querySelector("parsererror");
  if (error) {
    return "XML 不合法，请先修复错误。";
  }
  if (!doc.querySelector("svg")) {
    return "未找到 <svg> 根节点。";
  }
  return "";
}

function startPathEdit() {
  if (state.selection.length !== 1) {
    showToast("请选择单个路径进入节点编辑。");
    fieldPathMode.value = "off";
    return;
  }
  const el = state.selection[0];
  if (el.tagName.toLowerCase() !== "path") {
    showToast("节点编辑仅适用于路径，请先转为路径。");
    fieldPathMode.value = "off";
    return;
  }
  const { points, closed } = extractPathPoints(el);
  state.pathEdit = {
    element: el,
    points,
    closed,
    activeIndex: null,
    addMode: false,
  };
  renderPathNodes();
}

function stopPathEdit() {
  state.pathEdit = null;
  nodesLayer.innerHTML = "";
  fieldPathMode.value = "off";
}

function extractPathPoints(el) {
  const d = el.getAttribute("d") || "";
  const hasCurves = /[CQSA]/i.test(d);
  if (hasCurves) {
    const points = flattenPath(el);
    const closed = /z/i.test(d);
    el.setAttribute("d", buildPathD(points, closed));
    return { points, closed };
  }
  return { points: parsePathD(d), closed: /z/i.test(d) };
}

function parsePathD(d) {
  const tokens = d.replace(/,/g, " ").trim().split(/\s+/).filter(Boolean);
  const points = [];
  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === "M" || cmd === "L") {
      const x = parseFloat(tokens[i++]);
      const y = parseFloat(tokens[i++]);
      points.push({ x, y });
    } else if (cmd === "m" || cmd === "l") {
      const last = points[points.length - 1] || { x: 0, y: 0 };
      const x = last.x + parseFloat(tokens[i++]);
      const y = last.y + parseFloat(tokens[i++]);
      points.push({ x, y });
    } else if (cmd.toLowerCase() === "z") {
      break;
    } else {
      i++;
    }
  }
  return points;
}

function flattenPath(el) {
  const length = el.getTotalLength();
  const segments = Math.max(4, Math.ceil(length / 40));
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const p = el.getPointAtLength((length * i) / segments);
    points.push({ x: p.x, y: p.y });
  }
  return points;
}

function buildPathD(points, closed) {
  if (!points.length) {
    return "";
  }
  const parts = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 1; i < points.length; i += 1) {
    parts.push(`L ${points[i].x} ${points[i].y}`);
  }
  if (closed) {
    parts.push("Z");
  }
  return parts.join(" ");
}

function renderPathNodes() {
  nodesLayer.innerHTML = "";
  if (!state.pathEdit) {
    return;
  }
  state.pathEdit.points.forEach((pt, index) => {
    const circle = createSvgElement("circle", {
      cx: pt.x,
      cy: pt.y,
      r: 5,
      class: `node-point ${
        state.pathEdit.activeIndex === index ? "active" : ""
      }`,
      "data-node-index": index,
    });
    nodesLayer.appendChild(circle);
  });
}

function startNodeDrag(index, point) {
  if (!state.pathEdit) {
    return;
  }
  state.pathEdit.activeIndex = index;
  state.drag = {
    type: "node",
    index,
    start: point,
  };
  renderPathNodes();
}

function updateNodeDrag(point) {
  if (!state.pathEdit || state.drag.type !== "node") {
    return;
  }
  const idx = state.drag.index;
  state.pathEdit.points[idx] = { x: point.x, y: point.y };
  state.pathEdit.element.setAttribute(
    "d",
    buildPathD(state.pathEdit.points, state.pathEdit.closed)
  );
  renderPathNodes();
}

function addNodeAtPoint(point) {
  if (!state.pathEdit) {
    return;
  }
  const idx = findClosestSegment(state.pathEdit.points, point);
  if (idx !== null) {
    state.pathEdit.points.splice(idx + 1, 0, point);
    state.pathEdit.element.setAttribute(
      "d",
      buildPathD(state.pathEdit.points, state.pathEdit.closed)
    );
    renderPathNodes();
    pushHistory("add-node");
  }
}

function deleteActiveNode() {
  if (!state.pathEdit) {
    return;
  }
  const idx = state.pathEdit.activeIndex;
  if (idx === null || state.pathEdit.points.length <= 2) {
    return;
  }
  state.pathEdit.points.splice(idx, 1);
  state.pathEdit.activeIndex = null;
  state.pathEdit.element.setAttribute(
    "d",
    buildPathD(state.pathEdit.points, state.pathEdit.closed)
  );
  renderPathNodes();
  pushHistory("delete-node");
}

function togglePathClosed() {
  if (!state.pathEdit) {
    return;
  }
  state.pathEdit.closed = !state.pathEdit.closed;
  state.pathEdit.element.setAttribute(
    "d",
    buildPathD(state.pathEdit.points, state.pathEdit.closed)
  );
  renderPathNodes();
  pushHistory("toggle-close");
}

function findClosestSegment(points, point) {
  if (points.length < 2) {
    return null;
  }
  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < points.length - 1; i += 1) {
    const dist = distanceToSegment(point, points[i], points[i + 1]);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function distanceToSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
  const clamped = clamp(t, 0, 1);
  const projX = a.x + clamped * dx;
  const projY = a.y + clamped * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

function convertSelectionToPath() {
  if (!state.selection.length) {
    return;
  }
  const nextSelection = [];
  state.selection.forEach((el) => {
    const tag = el.tagName.toLowerCase();
    let pathData = "";
    if (tag === "rect") {
      pathData = rectToPath(el);
    } else if (tag === "circle") {
      pathData = circleToPath(el);
    } else if (tag === "ellipse") {
      pathData = ellipseToPath(el);
    } else if (tag === "line") {
      pathData = lineToPath(el);
    } else if (tag === "path") {
      nextSelection.push(el);
      return;
    } else {
      return;
    }

    const path = createSvgElement("path", { d: pathData });
    copyAttributes(el, path);
    path.removeAttribute("x");
    path.removeAttribute("y");
    path.removeAttribute("width");
    path.removeAttribute("height");
    path.removeAttribute("rx");
    path.removeAttribute("ry");
    path.removeAttribute("cx");
    path.removeAttribute("cy");
    path.removeAttribute("r");
    path.removeAttribute("x1");
    path.removeAttribute("y1");
    path.removeAttribute("x2");
    path.removeAttribute("y2");
    el.replaceWith(path);
    nextSelection.push(path);
  });
  setSelection(nextSelection);
  pushHistory("convert-path");
}

function copyAttributes(from, to) {
  Array.from(from.attributes).forEach((attr) => {
    if (!attr.name.startsWith("data-sve")) {
      to.setAttribute(attr.name, attr.value);
    }
  });
}

function rectToPath(el) {
  const x = parseNumber(el.getAttribute("x"), 0);
  const y = parseNumber(el.getAttribute("y"), 0);
  const w = parseNumber(el.getAttribute("width"), 0);
  const h = parseNumber(el.getAttribute("height"), 0);
  let rx = parseNumber(el.getAttribute("rx"), 0);
  let ry = parseNumber(el.getAttribute("ry"), 0);
  rx = Math.min(rx, w / 2);
  ry = Math.min(ry, h / 2);

  if (!rx && !ry) {
    return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
  }
  return [
    `M ${x + rx} ${y}`,
    `H ${x + w - rx}`,
    `A ${rx} ${ry} 0 0 1 ${x + w} ${y + ry}`,
    `V ${y + h - ry}`,
    `A ${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}`,
    `H ${x + rx}`,
    `A ${rx} ${ry} 0 0 1 ${x} ${y + h - ry}`,
    `V ${y + ry}`,
    `A ${rx} ${ry} 0 0 1 ${x + rx} ${y}`,
    "Z",
  ].join(" ");
}

function circleToPath(el) {
  const cx = parseNumber(el.getAttribute("cx"), 0);
  const cy = parseNumber(el.getAttribute("cy"), 0);
  const r = parseNumber(el.getAttribute("r"), 0);
  return [
    `M ${cx - r} ${cy}`,
    `A ${r} ${r} 0 1 0 ${cx + r} ${cy}`,
    `A ${r} ${r} 0 1 0 ${cx - r} ${cy}`,
    "Z",
  ].join(" ");
}

function ellipseToPath(el) {
  const cx = parseNumber(el.getAttribute("cx"), 0);
  const cy = parseNumber(el.getAttribute("cy"), 0);
  const rx = parseNumber(el.getAttribute("rx"), 0);
  const ry = parseNumber(el.getAttribute("ry"), 0);
  return [
    `M ${cx - rx} ${cy}`,
    `A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy}`,
    `A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`,
    "Z",
  ].join(" ");
}

function lineToPath(el) {
  const x1 = parseNumber(el.getAttribute("x1"), 0);
  const y1 = parseNumber(el.getAttribute("y1"), 0);
  const x2 = parseNumber(el.getAttribute("x2"), 0);
  const y2 = parseNumber(el.getAttribute("y2"), 0);
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

function syncColorInput(value, input) {
  if (!input || value.trim().toLowerCase() === "none") {
    return;
  }
  if (isHexColor(value)) {
    input.value = normalizeHex(value);
  } else {
    input.value = "#000000";
  }
}

function isHexColor(value) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

function normalizeHex(value) {
  if (value.length === 4) {
    return (
      "#" +
      value
        .slice(1)
        .split("")
        .map((ch) => ch + ch)
        .join("")
        .toLowerCase()
    );
  }
  return value.toLowerCase();
}

function parseNumber(value, fallback) {
  const num = parseFloat(value);
  return Number.isNaN(num) ? fallback : num;
}

function parseViewBox(value) {
  const parts = value.split(/\s+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    return { x: 0, y: 0, width: state.doc.width, height: state.doc.height };
  }
  return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function roundNumber(value, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

window.addEventListener("resize", updateRulers);

document.addEventListener("selectionchange", highlightSourceSelection);

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && state.pathDraw) {
    finishPathDraw();
  }
});
