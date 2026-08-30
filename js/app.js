
const VERSION = "6.0.0";
const state = {
  bpm:60, hand:"both", metronome:true, countBars:1, scoreSound:true, volume:.82,
  playing:false, started:false, startAt:0, pausedBeats:0, anim:0,
  songBeats:16, beatPx:150, baseX:0, currentBeat:0, audioCtx:null, buffers:new Map()
};

const noteMidi = n => {
  const m = /^([A-G])([#b]?)(\d)$/.exec(n); if(!m) return 60;
  const pc={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1]] + (m[2]==="#"?1:m[2]==="b"?-1:0);
  return (Number(m[3])+1)*12+pc;
};
const fileName = n => n.replace("#","s")+".wav";

const events = [
  // right hand - beat, note(s), duration
  {b:0,n:["D5"],d:1,h:"R"},{b:1,n:["E5"],d:1,h:"R"},
  {b:2,n:["Fs5"],d:.5,h:"R"},{b:2.5,n:["G5"],d:.5,h:"R"},{b:3,n:["A5"],d:.5,h:"R"},{b:3.5,n:["Fs5"],d:.5,h:"R"},
  {b:4,n:["E5"],d:1,h:"R"},{b:5,n:["D5"],d:1,h:"R"},
  {b:6,n:["Cs5"],d:.5,h:"R"},{b:6.5,n:["D5"],d:.5,h:"R"},{b:7,n:["E5"],d:.5,h:"R"},{b:7.5,n:["Cs5"],d:.5,h:"R"},
  {b:8,n:["D5","Fs5"],d:1,h:"R"},{b:9,n:["A5"],d:1,h:"R"},
  {b:10,n:["G5"],d:.5,h:"R"},{b:10.5,n:["Fs5"],d:.5,h:"R"},{b:11,n:["E5"],d:.5,h:"R"},{b:11.5,n:["D5"],d:.5,h:"R"},
  {b:12,n:["Cs5"],d:1,h:"R"},{b:13,n:["D5"],d:1,h:"R"},{b:14,n:["E5"],d:1,h:"R"},{b:15,n:["D5"],d:1,h:"R"},
  // left hand eighth-note patterns
  ...["D3","A3","D4","Fs4","A3","D4","Fs4","A4"].map((n,i)=>({b:i*.5,n:[n],d:.5,h:"L"})),
  ...["G3","D4","G4","B4","D4","G4","B4","D5"].map((n,i)=>({b:4+i*.5,n:[n],d:.5,h:"L"})),
  ...["A3","E4","A4","Cs5","E4","A4","Cs5","E5"].map((n,i)=>({b:8+i*.5,n:[n],d:.5,h:"L"})),
  ...["D3","A3","D4","Fs4","A3","D4","Fs4","A4"].map((n,i)=>({b:12+i*.5,n:[n],d:.5,h:"L"}))
];

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function initKeyboard(){
  const kb=$("#keyboard"); kb.innerHTML="";
  const whiteMidis=[]; for(let m=48;m<=84;m++){ if(![1,3,6,8,10].includes(m%12)) whiteMidis.push(m); }
  whiteMidis.forEach(m=>{
    const k=document.createElement("div"); k.className="white"; k.dataset.midi=m;
    if(m%12===0){const l=document.createElement("div");l.className="key-label";l.textContent="C"+(m/12-1);k.appendChild(l)}
    kb.appendChild(k);
  });
  const rectPct=100/whiteMidis.length;
  const blacks=[];
  for(let i=0;i<whiteMidis.length-1;i++){
    const a=whiteMidis[i], b=whiteMidis[i+1];
    if(b-a===2){
      const m=a+1, k=document.createElement("div"); k.className="black"; k.dataset.midi=m;
      k.style.left=`calc(${(i+0.73)*rectPct}% - ${rectPct*.31}%)`; k.style.width=`${rectPct*.62}%`;
      kb.appendChild(k); blacks.push(k);
    }
  }
}

function yFor(note, hand){
  const midi=noteMidi(note);
  // compact visual mapping around treble/bass demo ranges
  if(hand==="R") return 128 - (midi-60)*5.1;
  return 287 - (midi-48)*5.0;
}
function drawNote(svg, x, y, duration, color="#111"){
  const ns="http://www.w3.org/2000/svg";
  const g=document.createElementNS(ns,"g");
  const e=document.createElementNS(ns,"ellipse"); e.setAttribute("cx",x);e.setAttribute("cy",y);e.setAttribute("rx",8);e.setAttribute("ry",5);e.setAttribute("fill",color);e.setAttribute("transform",`rotate(-18 ${x} ${y})`);g.appendChild(e);
  if(duration<4){
    const stem=document.createElementNS(ns,"line"); stem.setAttribute("x1",x+7);stem.setAttribute("x2",x+7);stem.setAttribute("y1",y);stem.setAttribute("y2",y-34);stem.setAttribute("stroke",color);stem.setAttribute("stroke-width","2");g.appendChild(stem);
  }
  svg.appendChild(g); return {g,x,y};
}
function renderScore(){
  const svg=$("#scoreSvg"); svg.innerHTML="";
  const ns="http://www.w3.org/2000/svg";
  const width = 520 + state.songBeats*state.beatPx;
  svg.setAttribute("viewBox",`0 0 ${width} 360`);
  svg.style.width=width+"px";
  $("#scoreTrack").style.width=width+"px";
  const staff=(top,clef)=>{
    const g=document.createElementNS(ns,"g");g.dataset.staff=clef;
    for(let i=0;i<5;i++){let l=document.createElementNS(ns,"line");l.setAttribute("x1",20);l.setAttribute("x2",width-20);l.setAttribute("y1",top+i*14);l.setAttribute("y2",top+i*14);l.setAttribute("stroke","#252525");l.setAttribute("stroke-width","1");g.appendChild(l)}
    for(let b=0;b<=state.songBeats;b+=4){let l=document.createElementNS(ns,"line");let x=220+b*state.beatPx;l.setAttribute("x1",x);l.setAttribute("x2",x);l.setAttribute("y1",top);l.setAttribute("y2",top+56);l.setAttribute("stroke","#333");g.appendChild(l)}
    let txt=document.createElementNS(ns,"text");txt.setAttribute("x",42);txt.setAttribute("y",top+(clef==="treble"?49:48));txt.setAttribute("font-size",clef==="treble"?"70":"58");txt.setAttribute("font-family","serif");txt.textContent=clef==="treble"?"𝄞":"𝄢";g.appendChild(txt);
    let tm=document.createElementNS(ns,"text");tm.setAttribute("x",112);tm.setAttribute("y",top+27);tm.setAttribute("font-size","25");tm.setAttribute("font-family","Georgia");tm.setAttribute("font-weight","700");tm.textContent="4";g.appendChild(tm);
    let bm=tm.cloneNode();bm.setAttribute("y",top+51);bm.textContent="4";g.appendChild(bm);
    svg.appendChild(g);
  };
  staff(86,"treble"); staff(238,"bass");
  // braces / labels
  const brace=document.createElementNS(ns,"path");brace.setAttribute("d","M30 86 Q12 115 28 161 Q43 204 28 294");brace.setAttribute("fill","none");brace.setAttribute("stroke","#333");brace.setAttribute("stroke-width","2");svg.appendChild(brace);
  let rt=document.createElementNS(ns,"text");rt.setAttribute("x",5);rt.setAttribute("y",75);rt.setAttribute("font-size","11");rt.setAttribute("fill","#777");rt.textContent="右手";svg.appendChild(rt);
  let lt=rt.cloneNode();lt.setAttribute("y",227);lt.textContent="左手";svg.appendChild(lt);

  const drawn=[];
  events.forEach(ev=>{
    if((state.hand==="right" && ev.h==="L") || (state.hand==="left" && ev.h==="R")) return;
    ev.n.forEach((n,j)=>{
      const x=220+ev.b*state.beatPx;
      const y=yFor(n,ev.h)+(j*7);
      const d=drawNote(svg,x,y,ev.d);
      d.ev=ev; drawn.push(d);
    });
  });
  // beam consecutive eighth groups by hand, grouped within each beat-pair pattern
  ["R","L"].forEach(hand=>{
    let e = events.filter(x=>x.h===hand && x.d===.5 && !((state.hand==="right"&&hand==="L")||(state.hand==="left"&&hand==="R")));
    let groups=[];
    let cur=[];
    e.forEach((ev,i)=>{
      if(!cur.length || Math.abs(ev.b-(cur[cur.length-1].b+.5))<.01) cur.push(ev); else {groups.push(cur);cur=[ev]}
      if(cur.length===4){groups.push(cur);cur=[]}
    }); if(cur.length>1)groups.push(cur);
    groups.forEach(gr=>{
      const x1=220+gr[0].b*state.beatPx+7, x2=220+gr[gr.length-1].b*state.beatPx+7;
      const ys=gr.map(ev=>yFor(ev.n[0],hand)-34);
      const y1=Math.min(...ys)-2, y2=y1 + (ys[ys.length-1]-ys[0])*.15;
      const p=document.createElementNS(ns,"path");p.setAttribute("d",`M${x1} ${y1} L${x2} ${y2} L${x2} ${y2+7} L${x1} ${y1+7} Z`);p.setAttribute("fill","#111");svg.appendChild(p);
    })
  });
  applyHandLayout();
  requestAnimationFrame(setInitialOffset);
}
function applyHandLayout(){
  const svg=$("#scoreSvg");
  if(state.hand==="right"){
    svg.style.transform="translateY(68px) scale(1.10)";
    [...svg.querySelectorAll('[data-staff="bass"]')].forEach(x=>x.style.display="none");
  }else if(state.hand==="left"){
    svg.style.transform="translateY(-72px) scale(1.10)";
    [...svg.querySelectorAll('[data-staff="treble"]')].forEach(x=>x.style.display="none");
  }else{
    svg.style.transform="";
  }
}
function setInitialOffset(){
  const wrap=$("#scoreWrap");
  const lineX=wrap.clientWidth*(window.innerWidth<=620?.35:.36);
  state.baseX=lineX-220;
  updateTrack(0);
}
function updateTrack(beat){
  const x=state.baseX - beat*state.beatPx;
  $("#scoreTrack").style.transform=`translateX(${x}px)`;
}
async function ensureAudio(){
  if(!state.audioCtx) state.audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  if(state.audioCtx.state==="suspended") await state.audioCtx.resume();
}
async function loadNote(n){
  if(state.buffers.has(n)) return state.buffers.get(n);
  const r=await fetch(`assets/audio/piano/demo/${fileName(n)}`);
  if(!r.ok) throw new Error("sample "+n);
  const buf=await state.audioCtx.decodeAudioData(await r.arrayBuffer());
  state.buffers.set(n,buf); return buf;
}
async function preloadSong(){
  await ensureAudio();
  const notes=[...new Set(events.flatMap(e=>e.n))];
  await Promise.all(notes.map(n=>loadNote(n).catch(()=>null)));
}
function playSample(n, when=0){
  if(!state.scoreSound || !state.audioCtx) return;
  const b=state.buffers.get(n); if(!b) return;
  const src=state.audioCtx.createBufferSource(), gain=state.audioCtx.createGain();
  src.buffer=b; gain.gain.value=state.volume;
  src.connect(gain).connect(state.audioCtx.destination);src.start(state.audioCtx.currentTime+when);
}
function clickSound(accent=false){
  if(!state.metronome || !state.audioCtx) return;
  const o=state.audioCtx.createOscillator(),g=state.audioCtx.createGain();
  o.frequency.value=accent?1200:880; g.gain.setValueAtTime(.12,state.audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,state.audioCtx.currentTime+.055);
  o.connect(g).connect(state.audioCtx.destination);o.start();o.stop(state.audioCtx.currentTime+.06);
}
function clearKeys(){ $$(".white.on,.black.on").forEach(k=>k.classList.remove("on")); }
function highlightAt(beat){
  clearKeys();
  const near=events.filter(e=>Math.abs(e.b-beat)<.09);
  near.forEach(ev=>ev.n.forEach(n=>{
    const k=document.querySelector(`[data-midi="${noteMidi(n)}"]`); if(k)k.classList.add("on");
  }));
}
function scheduleBeatNotes(prev,now){
  events.forEach(ev=>{
    if(ev.b>prev+1e-6 && ev.b<=now+1e-6){
      if((state.hand==="right"&&ev.h==="L")||(state.hand==="left"&&ev.h==="R")) return;
      ev.n.forEach(n=>playSample(n));
    }
  });
}
async function countIn(){
  const beats=state.countBars*4;
  if(beats<=0) return;
  const overlay=$("#readyOverlay"), num=$("#readyNum"); overlay.classList.add("show");
  for(let i=0;i<beats;i++){
    num.textContent=(i%4)+1; clickSound(i%4===0);
    await new Promise(r=>setTimeout(r,60000/state.bpm));
  }
  overlay.classList.remove("show");
}
async function startPractice(){
  await preloadSong();
  if(state.playing) return pausePractice();
  if(!state.started && state.currentBeat===0) await countIn();
  state.playing=true; state.started=true;
  state.startAt=performance.now()-state.currentBeat*(60000/state.bpm);
  $("#playBtn").textContent="Ⅱ";
  $("#practiceStart").textContent="暫停";
  let lastBeat=state.currentBeat, lastWhole=-1;
  const loop=now=>{
    if(!state.playing) return;
    const beat=(now-state.startAt)/(60000/state.bpm);
    state.currentBeat=beat;
    updateTrack(beat); highlightAt(beat);
    scheduleBeatNotes(lastBeat,beat);
    const whole=Math.floor(beat);
    if(whole!==lastWhole){ clickSound(whole%4===0); lastWhole=whole; }
    $("#beatStatus").textContent=`第 ${Math.min(4,Math.floor(beat/4)+1)} 小節`;
    $("#progress").textContent=`${Math.min(100,Math.round(beat/state.songBeats*100))}%`;
    lastBeat=beat;
    if(beat>=state.songBeats){ resetPractice(false); return; }
    state.anim=requestAnimationFrame(loop);
  };
  state.anim=requestAnimationFrame(loop);
}
function pausePractice(){
  state.playing=false;cancelAnimationFrame(state.anim);clearKeys();$("#playBtn").textContent="▶";$("#practiceStart").textContent="繼續";
}
function resetPractice(resetStarted=true){
  state.playing=false;cancelAnimationFrame(state.anim);state.currentBeat=0;if(resetStarted)state.started=false;updateTrack(0);clearKeys();$("#playBtn").textContent="▶";$("#practiceStart").textContent="開始練習";$("#beatStatus").textContent="準備";$("#progress").textContent="0%";
}
function openDrawer(page="songs"){
  $("#drawer").classList.add("on");$("#mask").classList.add("on");showDrawerPage(page);
}
function closeDrawer(){ $("#drawer").classList.remove("on");$("#mask").classList.remove("on"); }
function showDrawerPage(page){
  $$(".drawer-menu button").forEach(b=>b.classList.toggle("on",b.dataset.page===page));
  $$(".drawer-page").forEach(p=>p.classList.toggle("on",p.id==="page-"+page));
}
function renderSongList(){
  const list=$("#songList"); list.innerHTML="";
  const base=[
    ["Canon in D","J. Pachelbel","古典"],
    ["Lesson Practice 01","教材","課本教材"],
    ["C Major Practice","練習","練習曲"]
  ];
  let saved=[];try{saved=JSON.parse(localStorage.getItem("pianoImportedSongs")||"[]")}catch{}
  [...base,...saved.map(x=>[x.title,"拍照匯入",x.category])].forEach((s,i)=>{
    const d=document.createElement("div");d.className="song-item"+(i===0?" active":"");d.innerHTML=`<b>${s[0]}</b><small>${s[1]} · ${s[2]}</small>`;d.onclick=()=>{$("#songTitle").textContent=s[0];closeDrawer()};list.appendChild(d);
  })
}
function saveImportedSong(){
  const title=$("#importTitle").value.trim()||"未命名教材";
  const cat=$("#importCategory").value;
  let arr=[];try{arr=JSON.parse(localStorage.getItem("pianoImportedSongs")||"[]")}catch{}
  arr.push({title,category:cat,created:new Date().toISOString(),status:"等待 OMR 辨識"});
  localStorage.setItem("pianoImportedSongs",JSON.stringify(arr));
  $("#importMsg").textContent="已存入網站曲庫（本機瀏覽器）。V6.0.0 已預留 OMR→MusicXML 介面；正式辨識引擎下一版接入。";
  renderSongList();
}
async function toggleMic(){
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    $("#micStatus").textContent="🎤 收音 ON";$("#micStatus").classList.add("live");
    stream.getTracks().forEach(t=>t.stop());
  }catch{ $("#micStatus").textContent="🎤 無法取得麥克風"; }
}

document.addEventListener("DOMContentLoaded",()=>{
  initKeyboard();renderScore();renderSongList();
  $("#menuBtn").onclick=()=>openDrawer("songs");$("#closeDrawer").onclick=closeDrawer;$("#mask").onclick=closeDrawer;
  $$(".drawer-menu button").forEach(b=>b.onclick=()=>showDrawerPage(b.dataset.page));
  $("#playBtn").onclick=startPractice;$("#practiceStart").onclick=startPractice;$("#practiceReset").onclick=()=>resetPractice();
  $("#micStatus").onclick=toggleMic;
  $("#bpm").oninput=e=>{state.bpm=Number(e.target.value);$("#bpmLabel").textContent=state.bpm;$("#bpmStatus").textContent="♩ "+state.bpm;if(state.playing){state.startAt=performance.now()-state.currentBeat*(60000/state.bpm)}};
  $$("[data-hand]").forEach(b=>b.onclick=()=>{state.hand=b.dataset.hand;$$("[data-hand]").forEach(x=>x.classList.toggle("on",x===b));renderScore()});
  $("#metronome").onchange=e=>state.metronome=e.target.checked;
  $("#scoreSound").onchange=e=>state.scoreSound=e.target.checked;
  $("#countBars").onchange=e=>state.countBars=Number(e.target.value);
  $("#volume").oninput=e=>state.volume=Number(e.target.value)/100;
  $("#photoInput").onchange=e=>{const f=e.target.files[0];if(!f)return;const img=$("#photoPreview");img.src=URL.createObjectURL(f);img.style.display="block";$("#importMsg").textContent="圖片已載入，等待建立電子譜流程。"};
  $("#saveImport").onclick=saveImportedSong;
  window.addEventListener("resize",setInitialOffset);
});
