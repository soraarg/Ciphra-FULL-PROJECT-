lucide.createIcons();

// ── State ──────────────────────────────────────────────────────────────────
const state = {
    nodes: [],
    edges: [],
    selected: null,
    tool: 'select',
    placingType: null,
    transform: { x: 0, y: 0, scale: 1 },
    draggingNode: null,
    dragOffset: { x: 0, y: 0 },
    panning: false,
    spaceDown: false,
    panStart: { x: 0, y: 0 },
    panStartT: { x: 0, y: 0 },
    connectFrom: null,
    tempLine: null,
    history: [],
    historyIdx: -1,
};

let nodeCounter = 0;
let edgeCounter = 0;

// ── Theme ─────────────────────────────────────────────────────────────────
const THEMES = {
    start:    { fill: '#FFD700', stroke: '#ccad00', text: '#09090b' },
    process:  { fill: '#27272a', stroke: '#3f3f46', text: '#fafafa' },
    decision: { fill: '#1e1b4b', stroke: '#4338ca', text: '#c7d2fe' },
    io:       { fill: '#14532d', stroke: '#16a34a', text: '#bbf7d0' },
    note:     { fill: '#292524', stroke: '#57534e', text: '#a8a29e' },
};
const COLOR_SWATCHES = [
    '#FFD700','#27272a','#1e1b4b','#14532d','#292524',
    '#7f1d1d','#1d4ed8','#065f46','#4c1d95','#374151',
    '#0f172a','#fafafa',
];
const DEFAULT_SIZES = {
    start: { w: 140, h: 48 }, process: { w: 160, h: 52 },
    decision: { w: 160, h: 72 }, io: { w: 160, h: 52 }, note: { w: 160, h: 60 },
};

// ── SVG Elements ─────────────────────────────────────────────────────────
const svg        = document.getElementById('diagram-svg');
const edgesLayer = document.getElementById('edges-layer');
const nodesLayer = document.getElementById('nodes-layer');
const tempLayer  = document.getElementById('temp-layer');
const zoomInd    = document.getElementById('zoom-indicator');
const hint       = document.getElementById('canvas-hint');

// ── Helpers ───────────────────────────────────────────────────────────────
function svgPt(e) {
    const r = svg.getBoundingClientRect();
    return {
        x: (e.clientX - r.left - state.transform.x) / state.transform.scale,
        y: (e.clientY - r.top  - state.transform.y) / state.transform.scale,
    };
}

function applyTransform() {
    const { x, y, scale } = state.transform;
    document.getElementById('nodes-layer').setAttribute('transform', `translate(${x},${y}) scale(${scale})`);
    document.getElementById('edges-layer').setAttribute('transform', `translate(${x},${y}) scale(${scale})`);
    document.getElementById('temp-layer').setAttribute('transform',  `translate(${x},${y}) scale(${scale})`);
    document.getElementById('grid-layer').setAttribute('x', x % 20);
    document.getElementById('grid-layer').setAttribute('y', y % 20);
    zoomInd.textContent = Math.round(scale * 100) + '%';
}

function saveHistory() {
    const snap = JSON.stringify({ nodes: state.nodes, edges: state.edges });
    state.history = state.history.slice(0, state.historyIdx + 1);
    state.history.push(snap);
    if (state.history.length > 50) state.history.shift();
    state.historyIdx = state.history.length - 1;
}

function undo() {
    if (state.historyIdx <= 0) return;
    state.historyIdx--;
    const snap = JSON.parse(state.history[state.historyIdx]);
    state.nodes = snap.nodes; state.edges = snap.edges;
    state.selected = null;
    render(); updateProps();
}

function redo() {
    if (state.historyIdx >= state.history.length - 1) return;
    state.historyIdx++;
    const snap = JSON.parse(state.history[state.historyIdx]);
    state.nodes = snap.nodes; state.edges = snap.edges;
    state.selected = null;
    render(); updateProps();
}

// ── Render ────────────────────────────────────────────────────────────────
function render() {
    renderEdges();
    renderNodes();
}

function renderNodes() {
    nodesLayer.innerHTML = '';
    state.nodes.forEach(n => drawNode(n));
}

function renderEdges() {
    edgesLayer.innerHTML = '';
    state.edges.forEach(e => drawEdge(e));
}

function getNodeCenter(n) {
    return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
}

function getEdgePoints(from, to) {
    const fx = from.x + from.w, fy = from.y + from.h / 2;
    const tx = to.x,            ty = to.y + to.h / 2;
    const mx = (fx + tx) / 2;
    return { x1: fx, y1: fy, x2: tx, y2: ty, mx };
}

function drawEdge(edge) {
    const from = state.nodes.find(n => n.id === edge.from);
    const to   = state.nodes.find(n => n.id === edge.to);
    if (!from || !to) return;

    const { x1, y1, x2, y2, mx } = getEdgePoints(from, to);
    const isSel = state.selected === edge.id;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', isSel ? '#FFD700' : '#52525b');
    path.setAttribute('stroke-width', isSel ? '2' : '1.5');
    path.setAttribute('marker-end', isSel ? 'url(#arrow-selected)' : 'url(#arrow-normal)');
    path.setAttribute('data-id', edge.id);
    path.style.cursor = 'pointer';
    path.addEventListener('click', e => { e.stopPropagation(); selectItem(edge.id); });

    edgesLayer.appendChild(path);

    if (edge.label) {
        const lx = mx, ly = (y1 + y2) / 2 - 10;
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', lx - 18); bg.setAttribute('y', ly - 9);
        bg.setAttribute('width', '36'); bg.setAttribute('height', '16');
        bg.setAttribute('rx', '4'); bg.setAttribute('fill', '#09090b');
        bg.setAttribute('stroke', '#27272a'); bg.setAttribute('stroke-width', '1');
        const lt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        lt.setAttribute('x', lx); lt.setAttribute('y', ly);
        lt.setAttribute('text-anchor', 'middle'); lt.setAttribute('dominant-baseline', 'middle');
        lt.setAttribute('fill', '#FFD700'); lt.setAttribute('font-size', '10');
        lt.setAttribute('font-family', 'Inter, sans-serif'); lt.setAttribute('font-weight', '600');
        lt.textContent = edge.label;
        edgesLayer.appendChild(bg); edgesLayer.appendChild(lt);
    }
}

function drawNode(n) {
    const isSel = state.selected === n.id;
    const theme = { fill: n.fill || THEMES[n.type]?.fill, stroke: n.stroke || THEMES[n.type]?.stroke, text: n.textColor || THEMES[n.type]?.text };
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('data-id', n.id);
    g.setAttribute('filter', isSel ? 'url(#shadow-selected)' : 'url(#shadow-node)');
    g.style.cursor = state.tool === 'select' ? 'grab' : 'default';

    let shape;
    if (n.type === 'start' || n.type === 'end') {
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shape.setAttribute('x', n.x); shape.setAttribute('y', n.y);
        shape.setAttribute('width', n.w); shape.setAttribute('height', n.h);
        shape.setAttribute('rx', n.h / 2);
    } else if (n.type === 'decision') {
        const cx = n.x + n.w/2, cy = n.y + n.h/2;
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        shape.setAttribute('points', `${cx},${n.y} ${n.x+n.w},${cy} ${cx},${n.y+n.h} ${n.x},${cy}`);
    } else if (n.type === 'io') {
        const sk = 12;
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        shape.setAttribute('points', `${n.x+sk},${n.y} ${n.x+n.w},${n.y} ${n.x+n.w-sk},${n.y+n.h} ${n.x},${n.y+n.h}`);
    } else {
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shape.setAttribute('x', n.x); shape.setAttribute('y', n.y);
        shape.setAttribute('width', n.w); shape.setAttribute('height', n.h);
        shape.setAttribute('rx', n.type === 'note' ? '4' : '8');
        if (n.type === 'note') shape.setAttribute('stroke-dasharray', '5 3');
    }
    shape.setAttribute('fill', theme.fill);
    shape.setAttribute('stroke', isSel ? '#FFD700' : theme.stroke);
    shape.setAttribute('stroke-width', isSel ? '2' : '1.5');
    g.appendChild(shape);

    // Label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', n.x + n.w / 2);
    text.setAttribute('y', n.y + n.h / 2);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', theme.text);
    text.setAttribute('font-size', '12');
    text.setAttribute('font-family', 'Inter, sans-serif');
    text.setAttribute('font-weight', '500');
    text.setAttribute('pointer-events', 'none');

    const lines = (n.label || '').split('\n');
    if (lines.length === 1) {
        text.textContent = n.label;
    } else {
        lines.forEach((line, i) => {
            const ts = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            ts.setAttribute('x', n.x + n.w / 2);
            ts.setAttribute('dy', i === 0 ? `${-(lines.length - 1) * 7}` : '16');
            ts.textContent = line;
            text.appendChild(ts);
        });
    }
    g.appendChild(text);

    // Connection handles (on select)
    if (isSel && state.tool === 'connect') {
        const handles = [
            { x: n.x + n.w, y: n.y + n.h / 2 },
            { x: n.x,       y: n.y + n.h / 2 },
            { x: n.x + n.w/2, y: n.y },
            { x: n.x + n.w/2, y: n.y + n.h },
        ];
        handles.forEach(h => {
            const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('cx', h.x); c.setAttribute('cy', h.y); c.setAttribute('r', '6');
            c.setAttribute('fill', '#FFD700'); c.setAttribute('stroke', '#09090b'); c.setAttribute('stroke-width', '2');
            c.style.cursor = 'crosshair';
            c.addEventListener('mousedown', e => { e.stopPropagation(); startConnect(n.id, h); });
            g.appendChild(c);
        });
    }

    g.addEventListener('mousedown', e => onNodeMousedown(e, n));
    g.addEventListener('dblclick',  e => startTextEdit(e, n));
    g.addEventListener('click',     e => { e.stopPropagation(); if (state.tool === 'connect' && state.connectFrom && state.connectFrom !== n.id) finishConnect(n.id); else selectItem(n.id); });

    nodesLayer.appendChild(g);
}

// ── Node Interactions ─────────────────────────────────────────────────────
function onNodeMousedown(e, n) {
    if (state.tool !== 'select') return;
    e.stopPropagation();
    selectItem(n.id);
    const pt = svgPt(e);
    state.draggingNode = n.id;
    state.dragOffset = { x: pt.x - n.x, y: pt.y - n.y };
}

function selectItem(id) {
    state.selected = id;
    render();
    updateProps();
    hideHint();
}

function deselect() {
    state.selected = null;
    render();
    updateProps();
}

// ── Placing Nodes ─────────────────────────────────────────────────────────
function placeNode(type, x, y) {
    const sz = DEFAULT_SIZES[type] || { w: 160, h: 52 };
    const theme = THEMES[type];
    const n = {
        id: `n${++nodeCounter}`,
        type, label: type.charAt(0).toUpperCase() + type.slice(1),
        x: x - sz.w / 2, y: y - sz.h / 2,
        w: sz.w, h: sz.h,
        fill: theme.fill, stroke: theme.stroke, textColor: theme.text,
    };
    state.nodes.push(n);
    saveHistory();
    state.placingType = null;
    clearPlacingStyle();
    selectItem(n.id);
    render();
}

function clearPlacingStyle() {
    document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('placing'));
    svg.style.cursor = '';
}

// ── Connect Mode ──────────────────────────────────────────────────────────
function startConnect(fromId, handlePt) {
    state.connectFrom = fromId;
}

function finishConnect(toId) {
    if (!state.connectFrom || state.connectFrom === toId) { state.connectFrom = null; return; }
    const existing = state.edges.find(e => e.from === state.connectFrom && e.to === toId);
    if (!existing) {
        state.edges.push({ id: `e${++edgeCounter}`, from: state.connectFrom, to: toId, label: '' });
        saveHistory();
    }
    state.connectFrom = null;
    render();
}

// ── Inline Text Edit ──────────────────────────────────────────────────────
const overlay    = document.getElementById('text-editor-overlay');
const textInput  = document.getElementById('text-editor-input');
let editingId = null;

function startTextEdit(e, n) {
    e.stopPropagation();
    editingId = n.id;
    const r = svg.getBoundingClientRect();
    const scale = state.transform.scale;
    const ox = n.x * scale + state.transform.x + r.left;
    const oy = n.y * scale + state.transform.y + r.top;
    const ow = n.w * scale;
    const oh = n.h * scale;

    overlay.style.left   = ox + 'px';
    overlay.style.top    = oy + 'px';
    textInput.style.width  = ow + 'px';
    textInput.style.height = oh + 'px';
    textInput.value = n.label;
    overlay.classList.remove('hidden');
    textInput.focus();
    textInput.select();
}

textInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitTextEdit(); }
    if (e.key === 'Escape') cancelTextEdit();
});
textInput.addEventListener('blur', commitTextEdit);

function commitTextEdit() {
    if (!editingId) return;
    const n = state.nodes.find(n => n.id === editingId);
    if (n) { n.label = textInput.value.trim() || n.label; saveHistory(); render(); updateProps(); }
    editingId = null;
    overlay.classList.add('hidden');
}

function cancelTextEdit() {
    editingId = null;
    overlay.classList.add('hidden');
}

// ── Properties Panel ──────────────────────────────────────────────────────
const propEmpty   = document.getElementById('props-empty');
const propContent = document.getElementById('props-content');
const propText    = document.getElementById('prop-text');
const propW       = document.getElementById('prop-w');
const propH       = document.getElementById('prop-h');
const swatchCont  = document.getElementById('color-swatches');

COLOR_SWATCHES.forEach(color => {
    const s = document.createElement('div');
    s.className = 'color-swatch';
    s.style.background = color;
    s.style.border = `2px solid ${color === '#fafafa' ? '#27272a' : 'transparent'}`;
    s.addEventListener('click', () => applyColor(color));
    swatchCont.appendChild(s);
});

function updateProps() {
    if (!state.selected) {
        propEmpty.style.display = ''; propContent.classList.add('hidden'); return;
    }
    const n = state.nodes.find(n => n.id === state.selected);
    if (!n) { propEmpty.style.display = ''; propContent.classList.add('hidden'); return; }
    propEmpty.style.display = 'none'; propContent.classList.remove('hidden');
    propText.value = n.label;
    propW.value = Math.round(n.w);
    propH.value = Math.round(n.h);
    document.querySelectorAll('.color-swatch').forEach(s => {
        s.classList.toggle('active', s.style.background === n.fill || s.style.backgroundColor === n.fill);
    });
}

propText.addEventListener('input', () => {
    const n = state.nodes.find(n => n.id === state.selected);
    if (n) { n.label = propText.value; render(); }
});
propText.addEventListener('change', saveHistory);

propW.addEventListener('change', () => {
    const n = state.nodes.find(n => n.id === state.selected);
    if (n) { n.w = parseInt(propW.value); saveHistory(); render(); }
});
propH.addEventListener('change', () => {
    const n = state.nodes.find(n => n.id === state.selected);
    if (n) { n.h = parseInt(propH.value); saveHistory(); render(); }
});

function applyColor(color) {
    const n = state.nodes.find(n => n.id === state.selected);
    if (n) {
        n.fill = color;
        n.textColor = isLight(color) ? '#09090b' : '#fafafa';
        saveHistory(); render(); updateProps();
    }
}

function isLight(hex) {
    const c = hex.replace('#','');
    const r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
    return (r*299 + g*587 + b*114) / 1000 > 128;
}

document.getElementById('btn-delete-selected').addEventListener('click', deleteSelected);

function deleteSelected() {
    if (!state.selected) return;
    state.nodes  = state.nodes.filter(n => n.id !== state.selected);
    state.edges  = state.edges.filter(e => e.from !== state.selected && e.to !== state.selected && e.id !== state.selected);
    state.selected = null;
    saveHistory(); render(); updateProps();
}

// ── Canvas Events ─────────────────────────────────────────────────────────
svg.addEventListener('click', e => {
    // Si estamos en modo de colocación de forma
    if (state.placingType) {
        const pt = svgPt(e);
        placeNode(state.placingType, pt.x, pt.y);
        return;
    }
    
    // Si no, deseleccionar
    if (e.target === svg || e.target.id === 'grid-layer') {
        deselect();
    }
});

svg.addEventListener('mousedown', e => {
    if (e.target === svg || e.target.id === 'grid-layer' || e.target.tagName === 'rect' && !e.target.getAttribute('data-id')) {
        if (state.spaceDown || e.button === 1) {
            state.panning = true;
            state.panStart = { x: e.clientX, y: e.clientY };
            state.panStartT = { ...state.transform };
            svg.style.cursor = 'grabbing';
        }
    }
});

svg.addEventListener('mousemove', e => {
    if (state.draggingNode) {
        const pt = svgPt(e);
        const n = state.nodes.find(n => n.id === state.draggingNode);
        if (n) {
            n.x = pt.x - state.dragOffset.x;
            n.y = pt.y - state.dragOffset.y;
            render();
        }
    } else if (state.panning) {
        const dx = e.clientX - state.panStart.x;
        const dy = e.clientY - state.panStart.y;
        state.transform.x = state.panStartT.x + dx;
        state.transform.y = state.panStartT.y + dy;
        applyTransform();
    } else if (state.connectFrom) {
        // Draw temp line
        const pt = svgPt(e);
        const from = state.nodes.find(n => n.id === state.connectFrom);
        if (from) {
            tempLayer.innerHTML = '';
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', from.x + from.w);
            line.setAttribute('y1', from.y + from.h / 2);
            line.setAttribute('x2', pt.x); line.setAttribute('y2', pt.y);
            line.setAttribute('stroke', '#FFD700'); line.setAttribute('stroke-width', '1.5');
            line.setAttribute('stroke-dasharray', '6 3');
            line.setAttribute('marker-end', 'url(#arrow-selected)');
            tempLayer.appendChild(line);
        }
    }
});

svg.addEventListener('mouseup', e => {
    if (state.draggingNode) { saveHistory(); }
    state.draggingNode = null;
    state.panning = false;
    if (!state.placingType) svg.style.cursor = '';
    tempLayer.innerHTML = '';
    if (state.connectFrom && e.target === svg) { state.connectFrom = null; }
});

svg.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    const r = svg.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    state.transform.x = mx - (mx - state.transform.x) * delta;
    state.transform.y = my - (my - state.transform.y) * delta;
    state.transform.scale = Math.min(4, Math.max(0.1, state.transform.scale * delta));
    applyTransform();
}, { passive: false });

// ── Keyboard ──────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.target === propText || e.target === textInput || e.target.tagName === 'INPUT') return;
    if (e.key === ' ') { e.preventDefault(); state.spaceDown = true; svg.style.cursor = 'grab'; }
    if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
    if (e.key === 'v' || e.key === 'V') setTool('select');
    if (e.key === 'c' || e.key === 'C') setTool('connect');
    if (e.key === 'Escape') { state.placingType = null; clearPlacingStyle(); state.connectFrom = null; tempLayer.innerHTML = ''; }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
});

document.addEventListener('keyup', e => {
    if (e.key === ' ') { state.spaceDown = false; svg.style.cursor = state.placingType ? 'crosshair' : ''; }
});

// ── Toolbar Buttons ───────────────────────────────────────────────────────
function setTool(tool) {
    state.tool = tool;
    document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
    if (tool !== 'select') { state.placingType = null; clearPlacingStyle(); }
    render();
}

document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => setTool(btn.dataset.tool));
});

document.querySelectorAll('.shape-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        state.placingType = btn.dataset.type;
        document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('placing'));
        btn.classList.add('placing');
        svg.style.cursor = 'crosshair';
        hint.classList.add('hidden');
        setTool('select');
    });
});

document.getElementById('btn-undo').addEventListener('click', undo);
document.getElementById('btn-redo').addEventListener('click', redo);
document.getElementById('btn-fit-view').addEventListener('click', fitToView);
document.getElementById('btn-clear').addEventListener('click', () => {
    if (confirm('¿Limpiar todo el diagrama?')) {
        state.nodes = []; state.edges = []; state.selected = null;
        saveHistory(); render(); updateProps();
    }
});

document.getElementById('btn-export-png').addEventListener('click', exportPNG);

// ── Fit View ──────────────────────────────────────────────────────────────
function fitToView() {
    if (!state.nodes.length) return;
    const r = svg.getBoundingClientRect();
    const minX = Math.min(...state.nodes.map(n => n.x));
    const minY = Math.min(...state.nodes.map(n => n.y));
    const maxX = Math.max(...state.nodes.map(n => n.x + n.w));
    const maxY = Math.max(...state.nodes.map(n => n.y + n.h));
    const pad = 80;
    const scale = Math.min((r.width - pad*2) / (maxX - minX), (r.height - pad*2) / (maxY - minY), 2);
    state.transform.scale = scale;
    state.transform.x = pad - minX * scale + ((r.width - pad*2) - (maxX - minX)*scale) / 2;
    state.transform.y = pad - minY * scale + ((r.height - pad*2) - (maxY - minY)*scale) / 2;
    applyTransform();
}

// ── Export PNG ────────────────────────────────────────────────────────────
function exportPNG() {
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (document.getElementById('diagram-title').value || 'diagrama') + '.svg';
    a.click();
    URL.revokeObjectURL(url);
}

// ── Hint ──────────────────────────────────────────────────────────────────
function hideHint() { hint.classList.add('hidden'); }

// ── Init ──────────────────────────────────────────────────────────────────
saveHistory();
applyTransform();
