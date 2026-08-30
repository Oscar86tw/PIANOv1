
window.PianoPractice = window.PianoPractice || {};

PianoPractice.Transport = class Transport {
  constructor({bpm=60,countInBeats=4,totalBeats=16}={}){
    this.bpm=bpm;
    this.countInBeats=countInBeats;
    this.totalBeats=totalBeats;
    this.phase="idle";
    this.beat=0;
    this.countBeat=0;
    this.listeners=new Map();
    this._raf=0;
    this._origin=0;
    this._pauseBeat=0;
  }

  on(type,fn){
    if(!this.listeners.has(type)) this.listeners.set(type,new Set());
    this.listeners.get(type).add(fn);
    return ()=>this.listeners.get(type)?.delete(fn);
  }

  emit(type,payload){
    this.listeners.get(type)?.forEach(fn=>{
      try{ fn(payload); }
      catch(err){
        window.PianoDiagnostics?.add({
          kind:"transport-listener",
          message:err?.message||String(err),
          stack:err?.stack||"",
          extra:{type}
        });
      }
    });
  }

  secondsPerBeat(){ return 60/this.bpm; }

  setBpm(bpm){
    const next=Math.max(20,Math.min(240,Number(bpm)||60));
    if(this.phase==="playing"){
      this._origin=performance.now()-this.beat*this.secondsPerBeat()*1000;
    }
    this.bpm=next;
    this.emit("bpm",{bpm:this.bpm});
  }

  start(){
    if(this.phase==="playing"||this.phase==="countin") return;
    this.phase=this.countInBeats>0?"countin":"playing";
    this.beat=0;
    this.countBeat=0;
    this._origin=performance.now();
    this.emit("phase",{phase:this.phase});
    this._loop();
  }

  pause(){
    if(!["playing","countin"].includes(this.phase)) return;
    this._pauseBeat=this.beat;
    this.phase="paused";
    cancelAnimationFrame(this._raf);
    this.emit("phase",{phase:this.phase});
  }

  resume(){
    if(this.phase!=="paused") return;
    this.phase="playing";
    this._origin=performance.now()-this._pauseBeat*this.secondsPerBeat()*1000;
    this.emit("phase",{phase:this.phase});
    this._loop();
  }

  stop(){
    cancelAnimationFrame(this._raf);
    this.phase="idle";
    this.beat=0;
    this.countBeat=0;
    this.emit("phase",{phase:"idle"});
    this.emit("tick",{phase:"idle",beat:0,countBeat:0,progress:0});
  }

  _loop(){
    cancelAnimationFrame(this._raf);
    const step=(now)=>{
      if(!["countin","playing"].includes(this.phase)) return;
      const elapsedBeats=(now-this._origin)/(this.secondsPerBeat()*1000);

      if(this.phase==="countin"){
        this.countBeat=Math.min(this.countInBeats,elapsedBeats);
        this.emit("tick",{
          phase:"countin",
          beat:0,
          countBeat:this.countBeat,
          progress:this.countInBeats?this.countBeat/this.countInBeats:1
        });

        if(elapsedBeats>=this.countInBeats){
          this.phase="playing";
          this.beat=0;
          this._origin=now;
          this.emit("phase",{phase:"playing"});
          this.emit("tick",{phase:"playing",beat:0,countBeat:this.countInBeats,progress:0});
        }
      }else{
        this.beat=(now-this._origin)/(this.secondsPerBeat()*1000);
        const progress=Math.min(1,this.beat/this.totalBeats);
        this.emit("tick",{phase:"playing",beat:this.beat,countBeat:this.countInBeats,progress});
        if(this.beat>=this.totalBeats){
          this.phase="complete";
          cancelAnimationFrame(this._raf);
          this.emit("phase",{phase:"complete"});
          this.emit("complete",{beat:this.totalBeats});
          return;
        }
      }

      this._raf=requestAnimationFrame(step);
    };
    this._raf=requestAnimationFrame(step);
  }
};
