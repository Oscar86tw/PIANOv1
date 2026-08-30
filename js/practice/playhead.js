
window.PianoPractice = window.PianoPractice || {};

PianoPractice.Playhead = class Playhead {
  constructor(element,{readyPct=.035,startPct=.16,endPct=.965}={}){
    this.el=element;
    this.readyPct=readyPct;
    this.startPct=startPct;
    this.endPct=endPct;
    this.container=element.parentElement;
  }

  configureFromLayout({contentStart=0,endX=0,width=1}={}){
    const w=Math.max(1,Number(width)||1);
    this.startPct=Math.max(0,Math.min(1,contentStart/w));
    this.endPct=Math.max(this.startPct,Math.min(1,endX/w));
    this.reset();
  }

  reset(){
    this.el.style.left=(this.readyPct*100)+"%";
    this.el.dataset.phase="ready";
  }

  updateCountIn(progress=0){
    // Exact linear motion during the count-in. No easing, no acceleration.
    const p=Math.max(0,Math.min(1,Number(progress)||0));
    const pct=this.readyPct+(this.startPct-this.readyPct)*p;
    this.el.style.left=(pct*100)+"%";
    this.el.dataset.phase="countin";
  }

  updatePlaying(songProgress=0){
    // Exact linear mapping from musical beat to screen X.
    const p=Math.max(0,Math.min(1,Number(songProgress)||0));
    const pct=this.startPct+(this.endPct-this.startPct)*p;
    this.el.style.left=(pct*100)+"%";
    this.el.dataset.phase="playing";
  }
};
