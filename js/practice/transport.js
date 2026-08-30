
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
    this._ctx=null;

    this._countOrigin=0;
    this._playOrigin=0;
    this._pausedBeat=0;
  }

  on(type,fn){
    if(!this.listeners.has(type)) this.listeners.set(type,new Set());
    this.listeners.get(type).add(fn);
    return ()=>this.listeners.get(type)?.delete(fn);
  }

  emit(type,payload){
    this.listeners.get(type)?.forEach(fn=>{
      try{fn(payload)}
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

  async prepare(){
    if(!this._ctx){
      this._ctx=new (window.AudioContext||window.webkitAudioContext)({latencyHint:"interactive"});
    }
    if(this._ctx.state==="suspended") await this._ctx.resume();
    return this._ctx;
  }

  get audioContext(){ return this._ctx; }

  secondsPerBeat(){ return 60/this.bpm; }

  audioTimeForCountBeat(index){
    return this._countOrigin+index*this.secondsPerBeat();
  }

  audioTimeForBeat(index){
    return this._playOrigin+index*this.secondsPerBeat();
  }

  setBpm(value){
    const next=Math.max(20,Math.min(240,Number(value)||60));

    if(this._ctx && this.phase==="playing"){
      const now=this._ctx.currentTime;
      this._playOrigin=now-this.beat*(60/next);
    }

    if(this._ctx && this.phase==="countin"){
      const now=this._ctx.currentTime;
      this._countOrigin=now-this.countBeat*(60/next);
    }

    this.bpm=next;
    this.emit("bpm",{bpm:this.bpm});
  }

  async start(){
    if(this.phase==="playing"||this.phase==="countin") return;

    await this.prepare();

    this.beat=0;
    this.countBeat=0;
    this._countOrigin=this._ctx.currentTime+.04;
    this._playOrigin=this._countOrigin+this.countInBeats*this.secondsPerBeat();

    this.phase=this.countInBeats>0?"countin":"playing";
    this.emit("phase",{phase:this.phase});
    this.emit("timeline",{
      countOrigin:this._countOrigin,
      playOrigin:this._playOrigin,
      secondsPerBeat:this.secondsPerBeat()
    });

    this._loop();
  }

  pause(){
    if(!["playing","countin"].includes(this.phase)) return;

    if(this.phase==="playing") this._pausedBeat=this.beat;
    else this._pausedBeat=0;

    this.phase="paused";
    cancelAnimationFrame(this._raf);
    this.emit("phase",{phase:"paused"});
  }

  resume(){
    if(this.phase!=="paused") return;

    const now=this._ctx.currentTime;

    if(this._pausedBeat>0){
      this.phase="playing";
      this._playOrigin=now-this._pausedBeat*this.secondsPerBeat();
    }else{
      this.phase="countin";
      this._countOrigin=now;
      this._playOrigin=this._countOrigin+this.countInBeats*this.secondsPerBeat();
    }

    this.emit("phase",{phase:this.phase});
    this.emit("timeline",{
      countOrigin:this._countOrigin,
      playOrigin:this._playOrigin,
      secondsPerBeat:this.secondsPerBeat()
    });
    this._loop();
  }

  stop(){
    cancelAnimationFrame(this._raf);
    this.phase="idle";
    this.beat=0;
    this.countBeat=0;
    this._pausedBeat=0;
    this.emit("phase",{phase:"idle"});
    this.emit("tick",{phase:"idle",beat:0,countBeat:0,progress:0});
  }

  _loop(){
    cancelAnimationFrame(this._raf);

    const frame=()=>{
      if(!["countin","playing"].includes(this.phase)) return;

      const now=this._ctx.currentTime;
      const spb=this.secondsPerBeat();

      if(this.phase==="countin"){
        this.countBeat=Math.max(0,Math.min(this.countInBeats,(now-this._countOrigin)/spb));

        this.emit("tick",{
          phase:"countin",
          beat:0,
          countBeat:this.countBeat,
          progress:this.countInBeats?this.countBeat/this.countInBeats:1,
          audioTime:now
        });

        if(now>=this._playOrigin){
          this.phase="playing";
          this.beat=Math.max(0,(now-this._playOrigin)/spb);
          this.emit("phase",{phase:"playing"});
        }
      }

      if(this.phase==="playing"){
        this.beat=Math.max(0,(now-this._playOrigin)/spb);
        const progress=Math.min(1,this.beat/this.totalBeats);

        this.emit("tick",{
          phase:"playing",
          beat:this.beat,
          countBeat:this.countInBeats,
          progress,
          audioTime:now
        });

        if(this.beat>=this.totalBeats){
          this.phase="complete";
          cancelAnimationFrame(this._raf);
          this.emit("phase",{phase:"complete"});
          this.emit("complete",{beat:this.totalBeats});
          return;
        }
      }

      this._raf=requestAnimationFrame(frame);
    };

    this._raf=requestAnimationFrame(frame);
  }
};
