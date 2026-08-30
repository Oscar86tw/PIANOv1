
const VERSION="6.2.2";
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

function openDrawer(page="songs"){
  $("#drawer")?.classList.add("on");
  $("#mask")?.classList.add("on");
  showDrawerPage(page);
}
function closeDrawer(){
  $("#drawer")?.classList.remove("on");
  $("#mask")?.classList.remove("on");
}
function showDrawerPage(page){
  $$(".drawer-menu button").forEach(b=>b.classList.toggle("on",b.dataset.page===page));
  $$(".drawer-page").forEach(p=>p.classList.toggle("on",p.id==="page-"+page));
}

function renderSongList(){
  const list=$("#songList"); if(!list)return;
  const rows=[
    ["Lesson Practice 01","教材","課本教材"],
    ["Canon in D","J. Pachelbel","古典"],
    ["C Major Practice","練習","練習曲"]
  ];
  let saved=[];
  try{saved=JSON.parse(localStorage.getItem("pianoImportedSongs")||"[]")}catch{}
  list.innerHTML="";
  [...rows,...saved.map(x=>[x.title,"拍照匯入",x.category])].forEach((s,i)=>{
    const d=document.createElement("div");
    d.className="song-item"+(i===0?" active":"");
    d.innerHTML=`<b>${s[0]}</b><small>${s[1]} · ${s[2]}</small>`;
    d.onclick=()=>{$("#songTitle").textContent=s[0];closeDrawer()};
    list.appendChild(d);
  });
}

document.addEventListener("DOMContentLoaded",()=>{
  try{
    $("#mask")?.classList.remove("on");
    $("#readyOverlay")?.classList.remove("show");

    const model=PianoScore.ScoreModel.demo();
    const renderer=new PianoScore.ScoreRenderer($("#scoreSvg"));
    const transport=new PianoPractice.Transport({bpm:model.bpm,countInBeats:4,totalBeats:model.totalBeats});
    const playhead=new PianoPractice.Playhead($("#playhead"),{readyPct:.045,targetPct:.36});
    const scroller=new PianoPractice.ScoreScroller($("#scoreTrack"),renderer,playhead);
    const metronome=new PianoPractice.Metronome(transport);
    const keyboard=new PianoPractice.Keyboard($("#keyboard"));
    const practice=new PianoPractice.PracticeController({model,renderer,transport,playhead,scroller,metronome,keyboard});

    practice.render();

    $("#menuBtn").onclick=()=>openDrawer("songs");
    $("#closeDrawer").onclick=closeDrawer;
    $("#mask").onclick=closeDrawer;
    $$(".drawer-menu button").forEach(b=>b.onclick=()=>showDrawerPage(b.dataset.page));

    $("#playBtn").onclick=()=>practice.startOrPause();
    $("#practiceStart").onclick=()=>practice.startOrPause();
    $("#practiceReset").onclick=()=>practice.reset();

    $("#bpm").oninput=e=>{
      const bpm=Number(e.target.value);
      transport.setBpm(bpm);
      $("#bpmLabel").textContent=bpm;
      $("#bpmStatus").textContent="♩ "+bpm;
    };

    $("#countBars").value="1";
    $("#countBars").onchange=e=>{
      transport.countInBeats=Number(e.target.value)*4;
    };

    $("#metronome").onchange=e=>{
      metronome.enabled=e.target.checked;
      if(metronome.enabled) metronome.reschedule();
      else metronome.cancel();
    };

    const metroVolume=$("#metronomeVolume");
    if(metroVolume){
      metronome.setVolume(Number(metroVolume.value)/100);
      metroVolume.oninput=e=>metronome.setVolume(Number(e.target.value)/100);
    }

    $$("[data-hand]").forEach(btn=>btn.onclick=()=>{
      $$("[data-hand]").forEach(x=>x.classList.toggle("on",x===btn));
      practice.setHand(btn.dataset.hand);
    });

    $("#scoreSound").onchange=e=>{
      if(!e.target.checked && window.PianoAudio) PianoAudio.setMasterVolume(0);
      else if(window.PianoAudio) PianoAudio.setMasterVolume(Number($("#volume").value)/100);
    };

    $("#volume").oninput=e=>window.PianoAudio?.setMasterVolume(Number(e.target.value)/100);

    const quality=$("#audioQuality"),qualityStatus=$("#audioQualityStatus");
    async function refreshQuality(){
      if(!window.PianoAudio||!qualityStatus)return;
      const active=await PianoAudio.setProfile(quality?.value||"auto");
      qualityStatus.textContent=active==="web-hifi"
        ?"已啟用：網站內 Hi‑Fi 三角鋼琴"
        :"目前使用：網站內示範鋼琴音源";
    }
    if(quality){
      quality.onchange=()=>refreshQuality().catch(err=>PianoDiagnostics?.add({kind:"audio-profile",message:err.message,stack:err.stack}));
      refreshQuality().catch(()=>{});
    }

    $("#photoInput").onchange=e=>{
      const f=e.target.files?.[0];if(!f)return;
      const img=$("#photoPreview");img.src=URL.createObjectURL(f);img.style.display="block";
      $("#importMsg").textContent="圖片已載入，已預留 OMR → MusicXML 電子譜接口。";
    };
    $("#saveImport").onclick=()=>{
      const title=$("#importTitle").value.trim()||"未命名教材";
      let arr=[];try{arr=JSON.parse(localStorage.getItem("pianoImportedSongs")||"[]")}catch{}
      arr.push({title,category:$("#importCategory").value,status:"等待 OMR 辨識",created:new Date().toISOString()});
      localStorage.setItem("pianoImportedSongs",JSON.stringify(arr));
      renderSongList();
      $("#importMsg").textContent="已存入網站曲庫。";
    };

    const errorBadge=$("#errorBadge");
    if(errorBadge) errorBadge.onclick=()=>openDrawer("diagnostics");
    window.openPianoDiagnostics=()=>openDrawer("diagnostics");

    if(window.PianoDiagnostics){
      const list=$("#diagnosticList");
      PianoDiagnostics.subscribe(logs=>{
        if(!list)return;
        if(!logs.length){
          list.innerHTML='<div class="section"><b>目前沒有錯誤紀錄 ✓</b></div>';
          return;
        }
        list.innerHTML=logs.map(x=>`<div class="diag-item"><div class="diag-head"><span class="diag-title">${x.title} · ${x.category}</span><span class="diag-time">${new Date(x.time).toLocaleString()}</span></div><code>${String(x.message).replace(/[&<>]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m]))}${x.source?`\n${x.source}:${x.line||0}:${x.column||0}`:""}</code><div class="diag-advice">${x.advice}</div></div>`).join("");
      });
      $("#copyErrorReport").onclick=()=>PianoDiagnostics.copyReport();
      $("#clearErrorReport").onclick=()=>PianoDiagnostics.clear();
    }

    renderSongList();

    window.addEventListener("resize",()=>{
      practice.render();
    });

    window.__PIANO_APP_READY__=true;
    document.dispatchEvent(new CustomEvent("piano-app-ready"));
  }catch(err){
    window.PianoDiagnostics?.add({
      kind:"app-init",
      message:err?.message||String(err),
      stack:err?.stack||"",
      source:"js/app.js"
    });
    window.__PIANO_BOOT_SHOW_ERROR__?.(err?.message||String(err),err?.stack||"");
  }
});
