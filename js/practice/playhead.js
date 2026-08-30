
window.PianoPractice = window.PianoPractice || {};

PianoPractice.Playhead = class Playhead {
  constructor(element,{readyPct=.06,startPct=.12,endPct=.88}={}){
    this.el=element;
    this.readyPct=readyPct;
    this.startPct=startPct;
    this.endPct=endPct;
    this.container=element.parentElement;
  }

  reset(){
    this.el.style.left=(this.readyPct*100)+"%";
    this.el.dataset.phase="ready";
  }

  startX(){ return this.container.clientWidth*this.startPct; }
  endX(){ return this.container.clientWidth*this.endPct; }

  updateCountIn(progress=0){
    const p=Math.max(0,Math.min(1,progress));
    const pct=this.readyPct+(this.startPct-this.readyPct)*p;
    this.el.style.left=(pct*100)+"%";
    this.el.dataset.phase="countin";
  }

  updatePlaying(systemProgress=0){
    const p=Math.max(0,Math.min(1,systemProgress));
    const pct=this.startPct+(this.endPct-this.startPct)*p;
    this.el.style.left=(pct*100)+"%";
    this.el.dataset.phase="playing";
  }
};
