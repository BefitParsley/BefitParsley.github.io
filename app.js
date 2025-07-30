const canvas = document.getElementById('strategy-canvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let paths = [];
let currentPath = [];
let panX = 0, panY = 0, lastPanX = 0, lastPanY = 0;
let redoStack = [];

const panZoomContainer = document.getElementById('panZoomContainer');
const robotsContainer = document.getElementById('robots');

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  redrawAll();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function getOffsetPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left - panX,
    y: clientY - rect.top - panY
  };
}

canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch' && e.isPrimary && e.shiftKey) {
    startPan(e);
    return;
  }
  drawing = true;
  const pos = getOffsetPos(e);
  currentPath = [{ x: pos.x, y: pos.y, color: getColor() }];
});

canvas.addEventListener('pointermove', (e) => {
  if (!drawing) return;
  const pos = getOffsetPos(e);
  const point = { x: pos.x, y: pos.y, color: getColor() };
  currentPath.push(point);
  drawLineSegment(currentPath[currentPath.length - 2], point);
});

canvas.addEventListener('pointerup', () => {
  if (drawing && currentPath.length > 1) {
    paths.push(currentPath);
    redoStack = []; // clear redo stack after new drawing
  }
  drawing = false;
});

function drawLineSegment(start, end) {
  ctx.strokeStyle = start.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(start.x + panX, start.y + panY);
  ctx.lineTo(end.x + panX, end.y + panY);
  ctx.stroke();
}

function redrawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const path of paths) {
    for (let i = 1; i < path.length; i++) {
      drawLineSegment(path[i - 1], path[i]);
    }
  }
}

function clearCanvas() {
  paths = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function getColor() {
  return document.getElementById('colorPicker').value;
}

function newMatch() {
  document.getElementById('teamInputModal').classList.remove('hidden');
}

function confirmTeams() {
  const red1 = document.getElementById('red1Input').value || "Red 1";
  const red2 = document.getElementById('red2Input').value || "Red 2";
  const blue1 = document.getElementById('blue1Input').value || "Blue 1";
  const blue2 = document.getElementById('blue2Input').value || "Blue 2";

  document.getElementById('teamInputModal').classList.add('hidden');
  robotsContainer.innerHTML = '';
  paths = [];
  redoStack = [];
  redrawAll();

  const teams = [
    { name: red1, color: '#ff9999' },
    { name: red2, color: '#ff6666' },
    { name: blue1, color: '#9999ff' },
    { name: blue2, color: '#6666ff' }
  ];

  teams.forEach((team, i) => {
    const div = document.createElement('div');
    div.className = 'robot-box';
    div.textContent = team.name;
    div.style.backgroundColor = team.color;
    div.style.left = `${50 + i * 90}px`;
    div.style.top = '60px';
    makeDraggable(div);
    robotsContainer.appendChild(div);
  });
}

function makeDraggable(el) {
  el.addEventListener('pointerdown', startDrag);
  function startDrag(e) {
    const startX = e.clientX - el.offsetLeft;
    const startY = e.clientY - el.offsetTop;
    function move(e) {
      el.style.left = `${e.clientX - startX}px`;
      el.style.top = `${e.clientY - startY}px`;
    }
    function stop() {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  }
}

function saveMatch() {
  const name = prompt("Match name?");
  if (!name) return;
  const robots = Array.from(document.getElementsByClassName('robot-box')).map(el => ({
    name: el.textContent,
    left: el.style.left,
    top: el.style.top,
    color: el.style.backgroundColor
  }));
  const data = { robots, paths };
  localStorage.setItem(`match-${name}`, JSON.stringify(data));
  updateMatchList();
}

function loadMatch(name) {
  const data = JSON.parse(localStorage.getItem(`match-${name}`));
  if (!data) return;
  paths = data.paths;
  redrawAll();
  robotsContainer.innerHTML = '';
  data.robots.forEach(r => {
    const div = document.createElement('div');
    div.className = 'robot-box';
    div.textContent = r.name;
    div.style.left = r.left;
    div.style.top = r.top;
    div.style.backgroundColor = r.color;
    makeDraggable(div);
    robotsContainer.appendChild(div);
  });
}

function redo() {
  if (redoStack.length > 0) {
    paths.push(redoStack.pop());
    redrawAll();
  }
}  

function undo() {
  if (paths.length > 0) {
    redoStack.push(paths.pop());
    redrawAll();
  }
}

function updateMatchList() {
  const select = document.getElementById('matchList');
  select.innerHTML = '<option value="">Load Saved</option>';
  for (let k in localStorage) {
    if (k.startsWith("match-")) {
      const name = k.replace("match-", "");
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    }
  }
}
updateMatchList();

