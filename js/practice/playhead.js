
window.PianoPractice = window.PianoPractice || {};

PianoPractice.Playhead = class Playhead {
  constructor(element,{readyPct=.035,startPct=.16,endPct=.965}={}){
    this.el=element;
    this.readyPct=readyPct;
    this.startPct=startPct;
    this.endPct=endPct;
    this.container=element.parentElement;
    this.sheetImage=null;
    this.sheetSystems=[];
    this.fullSheetMode=false;
  }

  configureFromLayout({contentStart=0,endX=0,width=1}={}){
    this.fullSheetMode=false;
    const w=Math.max(1,Number(width)||1);
    this.startPct=Math.max(0,Math.min(1,contentStart/w));
    this.endPct=Math.max(this.startPct,Math.min(1,endX/w));
    this.el.style.top="";
    this.el.style.bottom="";
    this.el.style.height="";
    this.reset();
  }

  configureFullSheet(image,systems=[]){
    this.fullSheetMode=true;
    this.sheetImage=image||null;
    this.sheetSystems=Array.isArray(systems)?systems:[];
    this.reset();
  }

  reset(){
    if(this.fullSheetMode && this.sheetSystems.length){
      const s=this.sheetSystems[0];
      this.positionOnSheet(s,s.x1);
      this.el.dataset.phase="ready";
      return;
    }

    this.el.style.left=(this.readyPct*100)+"%";
    this.el.style.top="";
    this.el.style.bottom="";
    this.el.style.height="";
    this.el.dataset.phase="ready";
  }

  positionOnSheet(system,xNorm){
    if(!this.sheetImage || !system) return;

    const wrapRect=this.container.getBoundingClientRect();
    const imgRect=this.sheetImage.getBoundingClientRect();

    const left=(imgRect.left-wrapRect.left)+imgRect.width*xNorm;
    const top=(imgRect.top-wrapRect.top)+imgRect.height*system.y1;
    const height=Math.max(20,imgRect.height*(system.y2-system.y1));

    this.el.style.left=`${left}px`;
    this.el.style.top=`${top}px`;
    this.el.style.bottom="auto";
    this.el.style.height=`${height}px`;
  }

  updateFullSheet(beat){
    if(!this.fullSheetMode || !this.sheetSystems.length) return;

    const b=Math.max(0,Number(beat)||0);
    let system=this.sheetSystems[this.sheetSystems.length-1];

    for(const s of this.sheetSystems){
      if(b>=s.startBeat && b<s.endBeat){
        system=s;
        break;
      }
    }

    const span=Math.max(.0001,system.endBeat-system.startBeat);
    const local=Math.max(0,Math.min(1,(b-system.startBeat)/span));
    const x=system.x1+(system.x2-system.x1)*local;

    this.positionOnSheet(system,x);
    this.el.dataset.phase="playing";
  }

  updateCountIn(progress=0){
    if(this.fullSheetMode && this.sheetSystems.length){
      const s=this.sheetSystems[0];
      const p=Math.max(0,Math.min(1,Number(progress)||0));

      // Four preparation beats move only through a short lead-in immediately
      // before the first staff. No easing / no acceleration.
      const lead=Math.max(0.02,s.x1-0.045);
      const x=lead+(s.x1-lead)*p;
      this.positionOnSheet(s,x);
      this.el.dataset.phase="countin";
      return;
    }

    const p=Math.max(0,Math.min(1,Number(progress)||0));
    const pct=this.readyPct+(this.startPct-this.readyPct)*p;
    this.el.style.left=(pct*100)+"%";
    this.el.dataset.phase="countin";
  }

  updatePlaying(songProgress=0){
    if(this.fullSheetMode) return;

    const p=Math.max(0,Math.min(1,Number(songProgress)||0));
    const pct=this.startPct+(this.endPct-this.startPct)*p;
    this.el.style.left=(pct*100)+"%";
    this.el.dataset.phase="playing";
  }
};
