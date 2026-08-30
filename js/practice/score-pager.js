
window.PianoPractice = window.PianoPractice || {};

PianoPractice.ScorePager = class ScorePager {
  constructor({renderer,track,beatsPerSystem=4}){
    this.renderer=renderer;
    this.track=track;
    this.beatsPerSystem=beatsPerSystem;
    this.systemIndex=0;
    this.model=null;
    this.handMode="both";
  }

  setModel(model,handMode="both"){
    this.model=model;
    this.handMode=handMode;
    this.systemIndex=0;
    this.renderSystem();
  }

  setHand(mode){
    this.handMode=mode;
    this.renderSystem();
  }

  totalSystems(){
    if(!this.model) return 1;
    return Math.max(1,Math.ceil(this.model.totalBeats/this.beatsPerSystem));
  }

  systemForBeat(beat){
    return Math.max(0,Math.min(this.totalSystems()-1,Math.floor(beat/this.beatsPerSystem)));
  }

  localBeat(beat){
    return beat-this.systemForBeat(beat)*this.beatsPerSystem;
  }

  ensureSystemForBeat(beat){
    const idx=this.systemForBeat(beat);
    if(idx!==this.systemIndex){
      this.systemIndex=idx;
      this.renderSystem();
    }
    return idx;
  }

  renderSystem(){
    if(!this.model) return;

    const startBeat=this.systemIndex*this.beatsPerSystem;
    const endBeat=Math.min(this.model.totalBeats,startBeat+this.beatsPerSystem);

    const slicedEvents=this.model.events
      .filter(e=>e.beat>=startBeat && e.beat<endBeat)
      .map(e=>({...e,beat:e.beat-startBeat}));

    const slicedModel=new PianoScore.ScoreModel({
      title:this.model.title,
      bpm:this.model.bpm,
      time:this.model.time,
      keySignature:this.model.keySignature,
      totalBeats:this.beatsPerSystem,
      events:slicedEvents
    });

    const result=this.renderer.render(slicedModel,this.handMode);
    this.track.style.transform="translate3d(0,0,0)";
    this.track.style.left="0";
    return result;
  }

  progressInSystem(beat){
    const local=this.localBeat(beat);
    return Math.max(0,Math.min(1,local/this.beatsPerSystem));
  }
};
