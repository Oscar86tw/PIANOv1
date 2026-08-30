
window.PianoPractice = window.PianoPractice || {};

PianoPractice.PracticeController = class PracticeController {
  constructor({model,renderer,transport,playhead,metronome,keyboard}){
    this.model=model;
    this.renderer=renderer;
    this.transport=transport;
    this.playhead=playhead;
    this.metronome=metronome;
    this.keyboard=keyboard;
    this.handMode="both";
    this.lastBeat=-.001;
    this.bindTransport();
  }

  bindTransport(){
    this.transport.on("phase",({phase})=>{
      if(phase==="idle"){
        this.playhead.reset();
        this.keyboard.clear();
        this.lastBeat=-.001;
      }
      if(phase==="countin"){
        this.lastBeat=-.001;
      }
      if(phase==="playing"){
        this.lastBeat=-.001;
      }
      if(phase==="paused"){
        this.keyboard.clear();
      }
    });

    this.transport.on("tick",t=>{
      if(t.phase==="countin"){
        this.playhead.updateCountIn(t.progress);
        const next=Math.min(this.transport.countInBeats,Math.max(1,Math.floor(t.countBeat)+1));
        this.setStatus(`預備 ${next} / ${this.transport.countInBeats}`);
        this.keyboard.clear();
        return;
      }

      if(t.phase==="playing"){
        // IMPORTANT:
        // Red line position is a direct function of the exact musical beat.
        // No pager, no reset, no independent CSS animation, no acceleration.
        const progress=this.model.totalBeats>0 ? t.beat/this.model.totalBeats : 0;
        this.playhead.updatePlaying(progress);

        const eventsNow=this.model.eventsAtBeat(t.beat,.035,this.handMode);
        this.keyboard.showNotes(eventsNow.flatMap(e=>e.notes));

        const crossed=this.model.eventsBetween(this.lastBeat,t.beat,this.handMode);
        crossed.forEach(e=>{
          if(window.PianoAudio){
            e.notes.forEach(n=>PianoAudio.play(n,{velocity:88,volume:1}).catch(err=>{
              window.PianoDiagnostics?.add({
                kind:"audio-play",
                message:err?.message||String(err),
                stack:err?.stack||""
              });
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
      this.playhead.updatePlaying(1);
      this.setStatus("完成");
      this.setProgress(100);
      document.querySelector("#playBtn").textContent="▶";
      document.querySelector("#practiceStart").textContent="重新開始";
    });
  }

  setStatus(text){
    const e=document.querySelector("#beatStatus");
    if(e)e.textContent=text;
  }

  setProgress(v){
    const e=document.querySelector("#progress");
    if(e)e.textContent=`${v}%`;
  }

  render(){
    const result=this.renderer.render(this.model,this.handMode);
    this.playhead.configureFromLayout(result);
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
      window.PianoDiagnostics?.add({
        kind:"practice-start",
        message:err?.message||String(err),
        stack:err?.stack||""
      });
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

    this.playhead.reset();
    await this.transport.start();
    document.querySelector("#playBtn").textContent="Ⅱ";
    document.querySelector("#practiceStart").textContent="暫停";
  }

  pauseOnly(){
    if(this.transport.phase==="playing"||this.transport.phase==="countin"){
      this.transport.pause();
      this.keyboard.clear();
      document.querySelector("#playBtn").textContent="▶";
      document.querySelector("#practiceStart").textContent="繼續";
      this.setStatus("暫停");
    }
  }

  restart(){
    this.reset();
    this.startOrPause();
  }

  reset(){
    this.transport.stop();
    this.playhead.reset();
    this.keyboard.clear();
    document.querySelector("#playBtn").textContent="▶";
    document.querySelector("#practiceStart").textContent="開始練習";
    this.setStatus("準備");
    this.setProgress(0);
  }
};
