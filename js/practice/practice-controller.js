
window.PianoPractice = window.PianoPractice || {};

PianoPractice.PracticeController = class PracticeController {
  constructor({model,renderer,transport,playhead,scroller,metronome,keyboard}){
    this.model=model;
    this.renderer=renderer;
    this.transport=transport;
    this.playhead=playhead;
    this.scroller=scroller;
    this.metronome=metronome;
    this.keyboard=keyboard;
    this.handMode="both";
    this.lastBeat=-0.001;
    this.bindTransport();
  }

  bindTransport(){
    this.transport.on("phase",({phase})=>{
      this.playhead.update({phase,progress:phase==="playing"?1:0});
      if(phase==="idle"){
        this.scroller.reset();
        this.keyboard.clear();
        this.lastBeat=-.001;
      }
      if(phase==="countin"){
        this.lastBeat=-.001;
      }
      if(phase==="playing"){
        this.lastBeat=-.001;
      }
    });

    this.transport.on("tick",t=>{
      this.playhead.update(t);
      this.scroller.update(t);

      if(t.phase==="countin"){
        const next=Math.min(4,Math.max(1,Math.floor(t.countBeat)+1));
        this.setStatus(`預備 ${next} / 4`);
        this.keyboard.clear();
        return;
      }

      if(t.phase==="playing"){
        const eventsNow=this.model.eventsAtBeat(t.beat,.035,this.handMode);
        this.keyboard.showNotes(eventsNow.flatMap(e=>e.notes));

        const crossed=this.model.eventsBetween(this.lastBeat,t.beat,this.handMode);
        crossed.forEach(e=>{
          if(window.PianoAudio){
            e.notes.forEach(n=>PianoAudio.play(n,{velocity:88,volume:1}).catch(err=>{
              window.PianoDiagnostics?.add({kind:"audio-play",message:err?.message||String(err),stack:err?.stack||""});
            }));
          }
        });

        this.lastBeat=t.beat;
        const measure=Math.floor(t.beat/4)+1;
        this.setStatus(`第 ${measure} 小節`);
        this.setProgress(Math.round(t.progress*100));
      }
    });

    this.transport.on("complete",()=>{
      this.keyboard.clear();
      this.setStatus("完成");
      this.setProgress(100);
      document.querySelector("#playBtn").textContent="▶";
      document.querySelector("#practiceStart").textContent="重新開始";
    });
  }

  setStatus(text){ const e=document.querySelector("#beatStatus"); if(e)e.textContent=text; }
  setProgress(v){ const e=document.querySelector("#progress"); if(e)e.textContent=`${v}%`; }

  render(){
    const result=this.renderer.render(this.model,this.handMode);
    this.scroller.setTimeline(result.timeline);
    requestAnimationFrame(()=>{
      this.scroller.reset();
      this.playhead.reset();
    });
  }

  setHand(mode){
    this.handMode=mode;
    this.render();
  }

  setModel(model){
    this.transport.stop();
    this.model=model;
    this.transport.bpm=model.bpm;
    this.transport.totalBeats=model.totalBeats;
    this.lastBeat=-.001;
    this.keyboard.clear();
    this.render();
    this.setStatus("準備");
    this.setProgress(0);
  }

  async startOrPause(){
    try{
      if(window.PianoAudio){
        const notes=[...new Set(this.model.eventsForHand(this.handMode).flatMap(e=>e.notes))];
        await Promise.race([
          PianoAudio.init(document.querySelector("#audioQuality")?.value||"auto",{activateAudio:true}),
          new Promise(r=>setTimeout(r,350))
        ]);
        PianoAudio.preload(notes,88).catch(()=>{});
      }
      await this.transport.prepare();
      await this.metronome.ensureAudio();
    }catch(err){
      window.PianoDiagnostics?.add({kind:"practice-start",message:err?.message||String(err),stack:err?.stack||""});
    }

    if(this.transport.phase==="playing"||this.transport.phase==="countin"){
      this.transport.pause();
      document.querySelector("#playBtn").textContent="▶";
      document.querySelector("#practiceStart").textContent="繼續";
      return;
    }
    if(this.transport.phase==="paused"){
      this.transport.resume();
      document.querySelector("#playBtn").textContent="Ⅱ";
      document.querySelector("#practiceStart").textContent="暫停";
      return;
    }
    if(this.transport.phase==="complete") this.transport.stop();

    this.scroller.reset();
    this.playhead.reset();
    this.transport.start();
    document.querySelector("#playBtn").textContent="Ⅱ";
    document.querySelector("#practiceStart").textContent="暫停";
  }

  reset(){
    this.transport.stop();
    this.playhead.reset();
    this.scroller.reset();
    this.keyboard.clear();
    document.querySelector("#playBtn").textContent="▶";
    document.querySelector("#practiceStart").textContent="開始練習";
    this.setStatus("準備");
    this.setProgress(0);
  }
};
