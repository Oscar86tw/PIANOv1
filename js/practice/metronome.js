
window.PianoPractice = window.PianoPractice || {};

PianoPractice.Metronome = class Metronome {
  constructor(transport){
    this.transport=transport;
    this.enabled=true;
    this.sources=[];

    transport.on("timeline",()=>this.reschedule());
    transport.on("bpm",()=>this.reschedule());
    transport.on("phase",({phase})=>{
      if(phase==="idle"||phase==="complete"||phase==="paused") this.cancel();
      if(phase==="playing") this.schedulePlayback();
    });
  }

  async ensureAudio(){
    return this.transport.prepare();
  }

  cancel(){
    this.sources.forEach(src=>{
      try{src.stop()}catch{}
    });
    this.sources=[];
  }

  scheduleClick(time,accent=false){
    if(!this.enabled) return;

    const ctx=this.transport.audioContext;
    if(!ctx) return;

    const osc=ctx.createOscillator();
    const gain=ctx.createGain();

    osc.frequency.value=accent?1240:880;
    gain.gain.setValueAtTime(.0001,time);
    gain.gain.exponentialRampToValueAtTime(.12,time+.003);
    gain.gain.exponentialRampToValueAtTime(.0001,time+.06);

    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time+.065);

    this.sources.push(osc);
  }

  reschedule(){
    this.cancel();
    if(!this.enabled||!this.transport.audioContext) return;

    if(this.transport.phase==="countin"){
      for(let i=0;i<this.transport.countInBeats;i++){
        const time=this.transport.audioTimeForCountBeat(i);
        if(time>this.transport.audioContext.currentTime-.02){
          this.scheduleClick(time,i%4===0);
        }
      }
    }

    if(this.transport.phase==="playing"){
      this.schedulePlayback();
    }
  }

  schedulePlayback(){
    if(!this.enabled||!this.transport.audioContext) return;

    const ctx=this.transport.audioContext;
    const start=Math.max(0,Math.ceil(this.transport.beat-.0001));

    for(let i=start;i<=this.transport.totalBeats;i++){
      const time=this.transport.audioTimeForBeat(i);
      if(time>ctx.currentTime-.02){
        this.scheduleClick(time,i%4===0);
      }
    }
  }
};
