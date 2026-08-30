
window.PianoPractice = window.PianoPractice || {};

PianoPractice.Metronome = class Metronome {
  constructor(transport){
    this.transport=transport;
    this.enabled=true;
    this.lastIndex=-1;
    this.ctx=null;
    transport.on("phase",({phase})=>{
      if(phase==="idle"){this.lastIndex=-1;}
      if(phase==="countin"){this.lastIndex=-1;}
      if(phase==="playing"){this.lastIndex=-1;}
    });
    transport.on("tick",t=>this.onTick(t));
  }

  async ensureAudio(){
    if(!this.ctx) this.ctx=new (window.AudioContext||window.webkitAudioContext)({latencyHint:"interactive"});
    if(this.ctx.state==="suspended") await this.ctx.resume();
  }

  click(accent=false){
    if(!this.enabled||!this.ctx) return;
    const o=this.ctx.createOscillator();
    const g=this.ctx.createGain();
    o.frequency.value=accent?1180:860;
    g.gain.setValueAtTime(.12,this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+.055);
    o.connect(g).connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime+.06);
  }

  onTick(t){
    if(!this.enabled) return;
    const position=t.phase==="countin"?t.countBeat:t.beat;
    const index=Math.floor(position+1e-6);
    if(index!==this.lastIndex){
      this.lastIndex=index;
      this.click(index%4===0);
    }
  }
};
