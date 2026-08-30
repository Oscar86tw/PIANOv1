
window.PianoPractice = window.PianoPractice || {};

PianoPractice.Playhead = class Playhead {
  constructor(element,{readyPct=.055,targetPct=.36}={}){
    this.el=element;
    this.readyPct=readyPct;
    this.targetPct=targetPct;
    this.container=element.parentElement;
  }

  xForPct(pct){
    return this.container.clientWidth*pct;
  }

  reset(){
    this.el.style.left=(this.readyPct*100)+"%";
    this.el.dataset.phase="ready";
  }

  update({phase,progress=0}){
    if(phase==="countin"){
      // Move smoothly from left preparation position to the real judgment line.
      const eased=progress<.5 ? 2*progress*progress : 1-Math.pow(-2*progress+2,2)/2;
      const pct=this.readyPct+(this.targetPct-this.readyPct)*eased;
      this.el.style.left=(pct*100)+"%";
      this.el.dataset.phase="countin";
      return;
    }
    if(phase==="playing"||phase==="paused"||phase==="complete"){
      this.el.style.left=(this.targetPct*100)+"%";
      this.el.dataset.phase="playing";
      return;
    }
    this.reset();
  }

  targetX(){ return this.xForPct(this.targetPct); }
};
