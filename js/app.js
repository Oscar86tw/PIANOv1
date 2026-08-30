
const VERSION = "6.1.4";
const state = {
  bpm: 60,
  hand: "both",
  metronome: true,
  countBars: 1,
  scoreSound: true,
  volume: 0.82,
  playing: false,
  started: false,
  currentBeat: 0,
  startAt: 0,
  songBeats: 16,
  beatPx: 260,
  baseX: 0,
  anim: 0,
  audioCtx: null,
  buffers: new Map()
};

const SONG_EVENTS = [
  {b:0,   n:["D5"],    d:1,   h:"R"},
  {b:1,   n:["E5"],    d:1,   h:"R"},
  {b:2,   n:["Fs5"],   d:0.5, h:"R"},
  {b:2.5, n:["G5"],    d:0.5, h:"R"},
  {b:3,   n:["A5"],    d:0.5, h:"R"},
  {b:3.5, n:["Fs5"],   d:0.5, h:"R"},
  {b:4,   n:["E5"],    d:1,   h:"R"},
  {b:5,   n:["D5"],    d:1,   h:"R"},
  {b:6,   n:["Cs5"],   d:0.5, h:"R"},
  {b:6.5, n:["D5"],    d:0.5, h:"R"},
  {b:7,   n:["E5"],    d:0.5, h:"R"},
  {b:7.5, n:["Cs5"],   d:0.5, h:"R"},
  {b:8,   n:["D5","Fs5"], d:1, h:"R"},
  {b:9,   n:["A5"],    d:1,   h:"R"},
  {b:10,  n:["G5"],    d:0.5, h:"R"},
  {b:10.5,n:["Fs5"],   d:0.5, h:"R"},
  {b:11,  n:["E5"],    d:0.5, h:"R"},
  {b:11.5,n:["D5"],    d:0.5, h:"R"},
  {b:12,  n:["Cs5"],   d:1,   h:"R"},
  {b:13,  n:["D5"],    d:1,   h:"R"},
  {b:14,  n:["E5"],    d:1,   h:"R"},
  {b:15,  n:["D5"],    d:1,   h:"R"},

  ...["D3","A3","D4","Fs4","A3","D4","Fs4","A4"].map((n,i)=>({b:i*0.5,n:[n],d:0.5,h:"L"})),
  ...["G3","D4","G4","B4","D4","G4","B4","D5"].map((n,i)=>({b:4+i*0.5,n:[n],d:0.5,h:"L"})),
  ...["A3","E4","A4","Cs5","E4","A4","Cs5","E5"].map((n,i)=>({b:8+i*0.5,n:[n],d:0.5,h:"L"})),
  ...["D3","A3","D4","Fs4","A3","D4","Fs4","A4"].map((n,i)=>({b:12+i*0.5,n:[n],d:0.5,h:"L"}))
];

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const NS = "http://www.w3.org/2000/svg";
const HALF_SPACE = 40;        // one diatonic step = half staff-space
const STAFF_GAP = 80;         // V6.1.4: another ~2x visual increase
const TREBLE_TOP = 70;
const BASS_TOP = 500;

const letterIndex = {C:0,D:1,E:2,F:3,G:4,A:5,B:6};

/*
 * V6.1.4 統一音名解析
 * 支援：
 *   C4 / F5
 *   F#5 / C#5
 *   Fs5 / Cs5   ← 網站音檔使用 s 代表 sharp
 *   Bb3
 */
function parseNoteName(note){
  const raw = String(note ?? "").trim();
  const m = /^([A-G])([#sb]?)(\d)$/.exec(raw);
  if(!m){
    const err = new Error(`無法辨識樂譜音名：${raw || "(空白)"}`);
    err.code = "INVALID_NOTE_NAME";
    window.PianoDiagnostics?.add({
      kind:"score-data",
      message:err.message,
      source:"js/app.js",
      extra:{note:raw, accepted:"C4 / F#5 / Fs5 / Bb3"}
    });
    throw err;
  }
  return {
    raw,
    letter:m[1],
    accidental:m[2] || "",
    octave:Number(m[3])
  };
}

const nameToMidi = note => {
  const p = parseNoteName(note);
  const base = {C:0,D:2,E:4,F:5,G:7,A:9,B:11}[p.letter];
  const accidental = (p.accidental === "#" || p.accidental === "s") ? 1 : (p.accidental === "b" ? -1 : 0);
  return (p.octave + 1) * 12 + base + accidental;
};

const fileName = n => String(n).replace("#","s") + ".wav";

function diatonicStep(note){
  const p = parseNoteName(note);
  // 升降記號不改變音符在五線譜上的字母位置。
  return p.octave * 7 + letterIndex[p.letter];
}
const trebleBottom = TREBLE_TOP + STAFF_GAP*4; // E4
const bassBottom = BASS_TOP + STAFF_GAP*4;     // G2
const E4 = diatonicStep("E4");
const G2 = diatonicStep("G2");

function noteY(note, hand){
  // Formal staff placement:
  // Treble bottom line = E4.
  // Bass bottom line = G2.
  // Each next letter name moves exactly HALF_SPACE vertically.
  const step = diatonicStep(note);
  const anchorStep = hand === "R" ? E4 : G2;
  const anchorY = hand === "R" ? trebleBottom : bassBottom;
  return anchorY - (step - anchorStep) * HALF_SPACE;
}
function staffCenterY(hand){
  return hand === "R" ? (TREBLE_TOP + STAFF_GAP*2) : (BASS_TOP + STAFF_GAP*2);
}
function stemDirection(y, hand){
  return y >= staffCenterY(hand) ? "up" : "down";
}

function el(name, attrs={}){
  const node = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([k,v]) => node.setAttribute(k, v));
  return node;
}

function drawGrandStaff(svg, width){
  const staff = (top, clef, label) => {
    const g = el("g", {"data-staff": clef});
    for(let i=0;i<5;i++){
      g.appendChild(el("line", {x1: 36, x2: width-24, y1: top + i*STAFF_GAP, y2: top + i*STAFF_GAP, stroke:"#262626", "stroke-width":"1.2"}));
    }
    for(let b=0; b<=state.songBeats; b+=4){
      const x = 330 + b*state.beatPx;
      g.appendChild(el("line", {x1:x,x2:x,y1:top,y2:top+STAFF_GAP*4,stroke:"#333","stroke-width": b===0? "1.4":"1.2"}));
    }
    const clefText = el("text", {x:50, y: clef==="treble" ? top + 178 : top + 172, "font-size": clef==="treble" ? 190 : 150, "font-family":"serif", fill:"#111"});
    clefText.textContent = clef==="treble" ? "𝄞" : "𝄢";
    g.appendChild(clefText);

    const time1 = el("text", {x:210, y:top + 112, "font-size":"68", "font-weight":"700", "font-family":"Georgia", fill:"#111"});
    const time2 = el("text", {x:210, y:top + 205, "font-size":"68", "font-weight":"700", "font-family":"Georgia", fill:"#111"});
    time1.textContent = "4"; time2.textContent = "4";
    g.appendChild(time1); g.appendChild(time2);

    const handLabel = el("text", {x:8, y: top - 10, "font-size":"12", fill:"#888"});
    handLabel.textContent = label;
    g.appendChild(handLabel);
    svg.appendChild(g);
  };

  staff(TREBLE_TOP, "treble", "右手");
  staff(BASS_TOP, "bass", "左手");

  const brace = el("path", {
    d:`M38 ${TREBLE_TOP}
       C 14 ${TREBLE_TOP+28}, 14 ${TREBLE_TOP+80}, 38 ${TREBLE_TOP+STAFF_GAP*4}
       L 38 ${BASS_TOP}
       C 14 ${BASS_TOP+28}, 14 ${BASS_TOP+92}, 38 ${BASS_TOP+STAFF_GAP*4}`,
    fill:"none", stroke:"#333", "stroke-width":"4"
  });
  svg.appendChild(brace);
}

function drawLedger(svg, x, y, hand){
  const top = hand === "R" ? TREBLE_TOP : BASS_TOP;
  const bottom = top + STAFF_GAP*4;
  const lines = [];
  if(y < top){
    for(let yy = top - STAFF_GAP; yy >= y - 0.1; yy -= STAFF_GAP){
      lines.push(yy);
    }
  }else if(y > bottom){
    for(let yy = bottom + STAFF_GAP; yy <= y + 0.1; yy += STAFF_GAP){
      lines.push(yy);
    }
  }
  lines.forEach(yy => svg.appendChild(el("line", {x1:x-13,x2:x+13,y1:yy,y2:yy,stroke:"#222","stroke-width":"1.2"})));
}

function drawSingleNote(svg, x, note, duration, hand, color="#111"){
  const y = noteY(note, hand);
  drawLedger(svg, x, y, hand);
  const dir = stemDirection(y, hand);
  const g = el("g");
  const head = el("ellipse", {cx:x, cy:y, rx:22, ry:14, fill:color, transform:`rotate(-18 ${x} ${y})`});
  g.appendChild(head);

  let stemX, stemY2;
  if(duration < 4){
    if(dir === "up"){
      stemX = x + 8;
      stemY2 = y - 112;
      g.appendChild(el("line", {x1:stemX, y1:y, x2:stemX, y2:stemY2, stroke:color, "stroke-width":"2"}));
    }else{
      stemX = x - 8;
      stemY2 = y + 112;
      g.appendChild(el("line", {x1:stemX, y1:y, x2:stemX, y2:stemY2, stroke:color, "stroke-width":"2"}));
    }
  }
  svg.appendChild(g);
  return {x, y, dir, stemX, stemY2, hand, duration, color};
}

function drawChord(svg, x, notes, duration, hand, color="#111"){
  const sorted = [...notes].sort((a,b)=>noteY(a,hand)-noteY(b,hand));
  return sorted.map((n,i)=>drawSingleNote(svg, x + (i*1.5), n, duration, hand, color));
}

function beamYAnchor(item){
  return item.dir === "up" ? item.stemY2 : item.stemY2;
}

function drawBeam(svg, group){
  if(group.length < 2) return;
  const dir = group[0].dir;
  const color = group[0].color;
  const x1 = group[0].stemX;
  const x2 = group[group.length-1].stemX;
  const y1 = group[0].stemY2;
  const y2 = group[group.length-1].stemY2;
  const thickness = 18;

  const beam = el("path", {
    d: dir === "up"
      ? `M ${x1} ${y1} L ${x2} ${y2} L ${x2} ${y2+thickness} L ${x1} ${y1+thickness} Z`
      : `M ${x1} ${y1} L ${x2} ${y2} L ${x2} ${y2-thickness} L ${x1} ${y1-thickness} Z`,
    fill:color
  });
  svg.appendChild(beam);
}

function filteredEvents(){
  return SONG_EVENTS.filter(ev => {
    if(state.hand === "right" && ev.h === "L") return false;
    if(state.hand === "left" && ev.h === "R") return false;
    return true;
  });
}

function renderScore(){
  const svg = $("#scoreSvg");
  svg.innerHTML = "";
  const width = 760 + state.songBeats * state.beatPx;
  svg.setAttribute("viewBox", `0 0 ${width} 900`);
  svg.style.width = width + "px";
  $("#scoreTrack").style.width = width + "px";

  drawGrandStaff(svg, width);

  const drawnByEvent = new Map();
  filteredEvents().forEach(ev => {
    const x = 330 + ev.b * state.beatPx;
    const color = (Math.round(ev.b*2) % 8 === 0) ? "#111" : "#111";
    const notes = ev.n.length > 1
      ? drawChord(svg, x, ev.n, ev.d, ev.h, color)
      : [drawSingleNote(svg, x, ev.n[0], ev.d, ev.h, color)];
    drawnByEvent.set(ev, notes);
  });

  ["R","L"].forEach(hand => {
    const handEvents = filteredEvents().filter(ev => ev.h === hand && ev.d === 0.5);
    let group = [];
    for(let i=0;i<handEvents.length;i++){
      const ev = handEvents[i];
      if(group.length === 0){
        group.push(ev);
      }else{
        const prev = group[group.length - 1];
        if(Math.abs(ev.b - (prev.b + 0.5)) < 0.001){
          group.push(ev);
        }else{
          finalizeGroup(group);
          group = [ev];
        }
      }
    }
    finalizeGroup(group);

    function finalizeGroup(gr){
      if(gr.length < 2) return;
      const items = gr.map(ev => drawnByEvent.get(ev)[0]);
      const avgY = items.reduce((s,x)=>s+x.y,0) / items.length;
      const dir = stemDirection(avgY, hand);
      items.forEach(item => {
        // redraw consistent stems for beam groups
        item.dir = dir;
        if(dir === "up"){
          item.stemX = item.x + 8;
          item.stemY2 = item.y - 112;
        }else{
          item.stemX = item.x - 8;
          item.stemY2 = item.y + 112;
        }
      });
      // overlay fresh stems to ensure visual consistency
      items.forEach(item => svg.appendChild(el("line", {
        x1:item.stemX, y1:item.y, x2:item.stemX, y2:item.stemY2, stroke:"#111", "stroke-width":"2"
      })));
      drawBeam(svg, items);
    }
  });

  applyHandFocus();
  requestAnimationFrame(setInitialOffset);
}

function applyHandFocus(){
  const svg = $("#scoreSvg");
  if(state.hand === "right"){
    svg.style.transform = "translateY(58px) scale(1.08)";
    const bass = svg.querySelector('g[data-staff="bass"]');
    if(bass) bass.style.display = "none";
  }else if(state.hand === "left"){
    svg.style.transform = "translateY(-80px) scale(1.08)";
    const treble = svg.querySelector('g[data-staff="treble"]');
    if(treble) treble.style.display = "none";
  }else{
    svg.style.transform = "";
  }
}

function setInitialOffset(){
  const wrap = $("#scoreWrap");
  const lineX = wrap.clientWidth * (window.innerWidth <= 700 ? 0.35 : 0.36);
  state.baseX = lineX - 330;
  updateTrack(0);
}
function updateTrack(beat){
  const x = state.baseX - beat * state.beatPx;
  $("#scoreTrack").style.transform = `translateX(${x}px)`;
}

function initKeyboard(){
  const kb = $("#keyboard");
  kb.innerHTML = "";
  const whiteMidis = [];
  for(let m=48; m<=84; m++){
    if(![1,3,6,8,10].includes(m % 12)) whiteMidis.push(m);
  }
  whiteMidis.forEach(m => {
    const key = document.createElement("div");
    key.className = "white";
    key.dataset.midi = m;
    if(m % 12 === 0){
      const label = document.createElement("div");
      label.className = "key-label";
      label.textContent = "C" + (m/12 - 1);
      key.appendChild(label);
    }
    kb.appendChild(key);
  });
  const pct = 100 / whiteMidis.length;
  for(let i=0;i<whiteMidis.length-1;i++){
    const a = whiteMidis[i], b = whiteMidis[i+1];
    if(b - a === 2){
      const m = a + 1;
      const key = document.createElement("div");
      key.className = "black";
      key.dataset.midi = m;
      key.style.left = `calc(${(i + 0.72) * pct}% - ${pct * 0.31}%)`;
      key.style.width = `${pct * 0.62}%`;
      kb.appendChild(key);
    }
  }
}

async function ensureAudio(){
  if(!state.audioCtx) state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if(state.audioCtx.state === "suspended") await state.audioCtx.resume();
}
async function loadNote(name){
  if(state.buffers.has(name)) return state.buffers.get(name);
  const res = await fetch(`assets/audio/piano/demo/${fileName(name)}`);
  if(!res.ok) throw new Error(name);
  const buf = await state.audioCtx.decodeAudioData(await res.arrayBuffer());
  state.buffers.set(name, buf);
  return buf;
}
async function preloadSong(){
  const notes = [...new Set(SONG_EVENTS.flatMap(ev => ev.n))];
  if(window.PianoAudio){
    // V6.1.1: 不再阻塞主畫面。先啟動練習，音源在背景載入。
    await PianoAudio.init(document.querySelector("#audioQuality")?.value || "auto",{activateAudio:true});
    PianoAudio.preload(notes,88).catch(err=>{
      window.PianoDiagnostics?.add({kind:"audio-preload",message:err?.message||String(err),stack:err?.stack||""});
    });
    return;
  }
  await ensureAudio();
}
function playSample(name){
  if(!state.scoreSound) return;
  if(window.PianoAudio){
    PianoAudio.setMasterVolume(state.volume);
    PianoAudio.play(name,{velocity:88,volume:1}).catch(()=>{});
    return;
  }
  if(!state.audioCtx) return;
  const buf = state.buffers.get(name);
  if(!buf) return;
  const src = state.audioCtx.createBufferSource();
  const gain = state.audioCtx.createGain();
  gain.gain.value = state.volume;
  src.buffer = buf;
  src.connect(gain).connect(state.audioCtx.destination);
  src.start();
}
function clickSound(accent=false){
  if(!state.metronome || !state.audioCtx) return;
  const osc = state.audioCtx.createOscillator();
  const gain = state.audioCtx.createGain();
  osc.frequency.value = accent ? 1180 : 880;
  gain.gain.setValueAtTime(0.14, state.audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + 0.06);
  osc.connect(gain).connect(state.audioCtx.destination);
  osc.start();
  osc.stop(state.audioCtx.currentTime + 0.065);
}

function clearKeys(){
  $$(".white.on, .black.on").forEach(k => k.classList.remove("on"));
}
function highlightKeysAtBeat(beat){
  clearKeys();
  SONG_EVENTS.filter(ev => Math.abs(ev.b - beat) < 0.08).forEach(ev => {
    if(state.hand === "right" && ev.h === "L") return;
    if(state.hand === "left" && ev.h === "R") return;
    ev.n.forEach(name => {
      const key = document.querySelector(`[data-midi="${nameToMidi(name)}"]`);
      if(key) key.classList.add("on");
    });
  });
}
function playNotesBetween(prevBeat, beat){
  SONG_EVENTS.forEach(ev => {
    if(ev.b > prevBeat + 1e-9 && ev.b <= beat + 1e-9){
      if(state.hand === "right" && ev.h === "L") return;
      if(state.hand === "left" && ev.h === "R") return;
      ev.n.forEach(playSample);
    }
  });
}
async function countIn(){
  const beats = state.countBars * 4;
  if(beats <= 0) return;
  $("#readyOverlay").classList.add("show");
  const num = $("#readyNum");
  for(let i=0;i<beats;i++){
    num.textContent = (i % 4) + 1;
    clickSound(i % 4 === 0);
    await new Promise(r => setTimeout(r, 60000 / state.bpm));
  }
  $("#readyOverlay").classList.remove("show");
}
async function startPractice(){
  if(state.playing){
    pausePractice();
    return;
  }
  try{
    await Promise.race([
      preloadSong(),
      new Promise(resolve=>setTimeout(resolve,900))
    ]);
  }catch(err){
    window.PianoDiagnostics?.add({kind:"practice-start",message:err?.message||String(err),stack:err?.stack||""});
  }
  if(!state.started && state.currentBeat === 0) await countIn();

  state.playing = true;
  state.started = true;
  state.startAt = performance.now() - state.currentBeat * (60000 / state.bpm);
  $("#playBtn").textContent = "Ⅱ";
  $("#practiceStart").textContent = "暫停";

  let lastBeat = state.currentBeat;
  let lastWhole = Math.floor(state.currentBeat) - 1;

  const frame = (now) => {
    if(!state.playing) return;
    const beat = (now - state.startAt) / (60000 / state.bpm);
    state.currentBeat = beat;
    updateTrack(beat);
    highlightKeysAtBeat(beat);
    playNotesBetween(lastBeat, beat);

    const whole = Math.floor(beat);
    if(whole !== lastWhole){
      clickSound(whole % 4 === 0);
      lastWhole = whole;
    }
    $("#beatStatus").textContent = beat >= state.songBeats ? "完成" : `第 ${Math.floor(beat/4) + 1} 小節`;
    $("#progress").textContent = `${Math.min(100, Math.round(beat / state.songBeats * 100))}%`;

    lastBeat = beat;
    if(beat >= state.songBeats){
      resetPractice(false);
      return;
    }
    state.anim = requestAnimationFrame(frame);
  };
  state.anim = requestAnimationFrame(frame);
}
function pausePractice(){
  state.playing = false;
  cancelAnimationFrame(state.anim);
  clearKeys();
  $("#playBtn").textContent = "▶";
  $("#practiceStart").textContent = "繼續";
}
function resetPractice(resetStarted=true){
  state.playing = false;
  cancelAnimationFrame(state.anim);
  state.currentBeat = 0;
  if(resetStarted) state.started = false;
  clearKeys();
  updateTrack(0);
  $("#playBtn").textContent = "▶";
  $("#practiceStart").textContent = "開始練習";
  $("#beatStatus").textContent = "準備";
  $("#progress").textContent = "0%";
}

function openDrawer(page="songs"){
  $("#drawer").classList.add("on");
  $("#mask").classList.add("on");
  showPage(page);
}
function closeDrawer(){
  $("#drawer").classList.remove("on");
  $("#mask").classList.remove("on");
}
function showPage(page){
  $$(".drawer-menu button").forEach(btn => btn.classList.toggle("on", btn.dataset.page === page));
  $$(".drawer-page").forEach(p => p.classList.toggle("on", p.id === "page-" + page));
}
function renderSongList(){
  const list = $("#songList");
  list.innerHTML = "";
  const defaults = [
    ["Lesson Practice 01","教材","課本教材"],
    ["Canon in D","J. Pachelbel","古典"],
    ["C Major Practice","練習","練習曲"]
  ];
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem("pianoImportedSongs") || "[]"); } catch {}
  [...defaults, ...saved.map(x => [x.title, "拍照匯入", x.category])].forEach((s, i) => {
    const item = document.createElement("div");
    item.className = "song-item" + (i === 0 ? " active" : "");
    item.innerHTML = `<b>${s[0]}</b><small>${s[1]} · ${s[2]}</small>`;
    item.onclick = () => { $("#songTitle").textContent = s[0]; closeDrawer(); };
    list.appendChild(item);
  });
}
function saveImportedSong(){
  const title = $("#importTitle").value.trim() || "未命名教材";
  const category = $("#importCategory").value;
  let arr = [];
  try { arr = JSON.parse(localStorage.getItem("pianoImportedSongs") || "[]"); } catch {}
  arr.push({title, category, status:"等待 OMR 辨識", created:new Date().toISOString()});
  localStorage.setItem("pianoImportedSongs", JSON.stringify(arr));
  $("#importMsg").textContent = "已存入網站曲庫（本機瀏覽器）。本版已加大正式五線譜顯示；OMR 轉 MusicXML 接口保留，避免用假辨識混過去。";
  renderSongList();
}
async function toggleMic(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    $("#micBtn").textContent = "🎤";
    $("#micTitle").textContent = "麥克風已就緒";
    stream.getTracks().forEach(t => t.stop());
  }catch{
    $("#micTitle").textContent = "麥克風未開啟";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initKeyboard();
  renderScore();
  renderSongList();

  $("#menuBtn").onclick = () => openDrawer("songs");
  $("#closeDrawer").onclick = closeDrawer;
  $("#mask").onclick = closeDrawer;

  $$(".drawer-menu button").forEach(btn => btn.onclick = () => showPage(btn.dataset.page));

  $("#playBtn").onclick = startPractice;
  $("#practiceStart").onclick = startPractice;
  $("#practiceReset").onclick = () => resetPractice();
  $("#micBtn").onclick = toggleMic;

  $("#bpm").oninput = (e) => {
    state.bpm = Number(e.target.value);
    $("#bpmLabel").textContent = state.bpm;
    $("#bpmStatus").textContent = "♩ " + state.bpm;
    if(state.playing){
      state.startAt = performance.now() - state.currentBeat * (60000 / state.bpm);
    }
  };
  $("#metronome").onchange = e => state.metronome = e.target.checked;
  $("#scoreSound").onchange = e => state.scoreSound = e.target.checked;
  $("#countBars").onchange = e => state.countBars = Number(e.target.value);
  $("#volume").oninput = e => state.volume = Number(e.target.value) / 100;

  $$("[data-hand]").forEach(btn => {
    btn.onclick = () => {
      state.hand = btn.dataset.hand;
      $$("[data-hand]").forEach(x => x.classList.toggle("on", x === btn));
      renderScore();
    };
  });

  $("#photoInput").onchange = e => {
    const file = e.target.files[0];
    if(!file) return;
    const img = $("#photoPreview");
    img.src = URL.createObjectURL(file);
    img.style.display = "block";
    $("#importMsg").textContent = "圖片已載入，接下來可存成網站內教材，並預留後續 OMR 電子譜轉換流程。";
  };
  $("#saveImport").onclick = saveImportedSong;

  const quality = document.querySelector("#audioQuality");
  const qualityStatus = document.querySelector("#audioQualityStatus");
  async function refreshAudioProfile(){
    if(!window.PianoAudio || !qualityStatus) return;
    const active = await PianoAudio.setProfile(quality?.value || "auto");
    qualityStatus.textContent = active === "web-hifi"
      ? "已啟用：網站內 Hi‑Fi 三角鋼琴 multi-sample"
      : "目前使用：V6 示範音源（Hi‑Fi 音源尚未安裝或檔案不完整）";
  }
  if(quality){
    quality.onchange = refreshAudioProfile;
    refreshAudioProfile().catch((err)=>{
      qualityStatus.textContent="音源初始化失敗，將使用示範音源。";
      window.PianoDiagnostics?.add({kind:"audio-profile",message:err?.message||String(err),stack:err?.stack||""});
    });
  }
  // V6.1.2 emergency UI recovery: stale invisible overlays must not block clicks.
  document.querySelector("#mask")?.classList.remove("on");
  document.querySelector("#readyOverlay")?.classList.remove("show");

  window.openPianoDiagnostics = ()=>{
    openDrawer("diagnostics");
  };

  const errorBadge=document.querySelector("#errorBadge");
  if(errorBadge) errorBadge.onclick=()=>openDrawer("diagnostics");
  if(window.PianoDiagnostics){
    const list=document.querySelector("#diagnosticList");
    PianoDiagnostics.subscribe(logs=>{
      if(!list) return;
      if(!logs.length){
        list.innerHTML='<div class="section"><b>目前沒有錯誤紀錄 ✓</b><p class="muted">如果之後網頁出錯，這裡會自動留下診斷資料。</p></div>';
        return;
      }
      list.innerHTML=logs.map(x=>`<div class="diag-item">
        <div class="diag-head"><span class="diag-title">${x.title} · ${x.category}</span><span class="diag-time">${new Date(x.time).toLocaleString()}</span></div>
        <code>${String(x.message).replace(/[&<>]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m]))}${x.source?`\n${x.source}:${x.line||0}:${x.column||0}`:""}</code>
        <div class="diag-advice">${x.advice}</div>
      </div>`).join("");
    });
    document.querySelector("#copyErrorReport")?.addEventListener("click",async()=>{
      await PianoDiagnostics.copyReport();
      const b=document.querySelector("#copyErrorReport"); const old=b.textContent;b.textContent="已複製 ✓";setTimeout(()=>b.textContent=old,1200);
    });
    document.querySelector("#clearErrorReport")?.addEventListener("click",()=>PianoDiagnostics.clear());
  }
  window.__PIANO_APP_READY__ = true;
  document.dispatchEvent(new CustomEvent("piano-app-ready"));
  window.addEventListener("resize", setInitialOffset);
});
