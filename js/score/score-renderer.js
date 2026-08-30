
window.PianoScore = window.PianoScore || {};

PianoScore.ScoreRenderer = class ScoreRenderer {
  constructor(svg){
    this.svg=svg;
    this.NS="http://www.w3.org/2000/svg";

    // Stable engraving geometry: large, but proportional.
    this.STAFF_SPACE=46;        // distance between adjacent staff lines
    this.HALF_SPACE=23;         // one diatonic step
    this.TREBLE_TOP=82;
    this.BASS_TOP=340;
    this.NOTE_RX=14;
    this.NOTE_RY=9;
    this.STEM=78;
    this.BEAT_PX=180;
    this.CONTENT_START=300;
    this.CANVAS_H=610;

    this.letterIndex={C:0,D:1,E:2,F:3,G:4,A:5,B:6};
    this.E4=PianoCore.Note.diatonic("E4");
    this.G2=PianoCore.Note.diatonic("G2");
  }

  el(name,attrs={}){
    const n=document.createElementNS(this.NS,name);
    Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));
    return n;
  }

  xForBeat(beat){ return this.CONTENT_START + beat*this.BEAT_PX; }

  noteY(note,hand){
    const step=PianoCore.Note.diatonic(note);
    const top=hand==="R"?this.TREBLE_TOP:this.BASS_TOP;
    const bottom=top+this.STAFF_SPACE*4;
    const anchor=hand==="R"?this.E4:this.G2;
    return bottom-(step-anchor)*this.HALF_SPACE;
  }

  staffCenter(hand){
    return (hand==="R"?this.TREBLE_TOP:this.BASS_TOP)+this.STAFF_SPACE*2;
  }

  stemDirection(y,hand){
    return y>=this.staffCenter(hand)?"up":"down";
  }

  drawStaff(width,top,clef,label,totalBeats,time){
    const g=this.el("g",{"data-staff":clef});
    for(let i=0;i<5;i++){
      const y=top+i*this.STAFF_SPACE;
      g.appendChild(this.el("line",{x1:34,x2:width-24,y1:y,y2:y,stroke:"#252525","stroke-width":"1.4"}));
    }

    for(let beat=0;beat<=totalBeats;beat+=time[0]){
      const x=this.xForBeat(beat);
      g.appendChild(this.el("line",{
        x1:x,x2:x,y1:top,y2:top+this.STAFF_SPACE*4,
        stroke:"#333","stroke-width":beat===0?"1.8":"1.2"
      }));
    }

    const clefText=this.el("text",{
      x:52,
      y:clef==="treble"?top+this.STAFF_SPACE*3.55:top+this.STAFF_SPACE*3.25,
      "font-size":clef==="treble"?"122":"100",
      "font-family":"serif",
      fill:"#111"
    });
    clefText.textContent=clef==="treble"?"𝄞":"𝄢";
    g.appendChild(clefText);

    const timeX=190;
    const topNum=this.el("text",{x:timeX,y:top+this.STAFF_SPACE*1.72,"font-size":"52","font-weight":"700","font-family":"Georgia",fill:"#111"});
    const botNum=this.el("text",{x:timeX,y:top+this.STAFF_SPACE*3.75,"font-size":"52","font-weight":"700","font-family":"Georgia",fill:"#111"});
    topNum.textContent=String(time[0]); botNum.textContent=String(time[1]);
    g.appendChild(topNum); g.appendChild(botNum);

    const handLabel=this.el("text",{x:8,y:top-12,"font-size":"13",fill:"#777"});
    handLabel.textContent=label;
    g.appendChild(handLabel);

    this.svg.appendChild(g);
  }

  drawBrace(){
    const t=this.TREBLE_TOP,b=this.BASS_TOP,s=this.STAFF_SPACE;
    this.svg.appendChild(this.el("path",{
      d:`M38 ${t} C16 ${t+28},16 ${t+80},38 ${t+s*4} L38 ${b} C16 ${b+28},16 ${b+80},38 ${b+s*4}`,
      fill:"none",stroke:"#333","stroke-width":"3"
    }));
  }

  drawLedger(x,y,hand){
    const top=hand==="R"?this.TREBLE_TOP:this.BASS_TOP;
    const bottom=top+this.STAFF_SPACE*4;
    if(y<top){
      for(let ly=top-this.STAFF_SPACE;ly>=y-1;ly-=this.STAFF_SPACE){
        this.svg.appendChild(this.el("line",{x1:x-22,x2:x+22,y1:ly,y2:ly,stroke:"#222","stroke-width":"1.3"}));
      }
    }
    if(y>bottom){
      for(let ly=bottom+this.STAFF_SPACE;ly<=y+1;ly+=this.STAFF_SPACE){
        this.svg.appendChild(this.el("line",{x1:x-22,x2:x+22,y1:ly,y2:ly,stroke:"#222","stroke-width":"1.3"}));
      }
    }
  }

  drawAccidental(note,x,y){
    const p=PianoCore.Note.parse(note);
    if(!p.accidental) return;
    const t=this.el("text",{x:x-32,y:y+11,"font-size":"34","font-family":"serif",fill:"#111"});
    t.textContent=(p.accidental==="#"||p.accidental==="s")?"♯":"♭";
    this.svg.appendChild(t);
  }

  drawEvent(event){
    const x=this.xForBeat(event.beat);
    const ys=event.notes.map(n=>this.noteY(n,event.hand));
    const avg=ys.reduce((a,b)=>a+b,0)/ys.length;
    const dir=this.stemDirection(avg,event.hand);

    const heads=[];
    event.notes.forEach((note,i)=>{
      const y=ys[i];
      this.drawLedger(x,y,event.hand);
      this.drawAccidental(note,x,y);

      const head=this.el("ellipse",{
        cx:x,cy:y,rx:this.NOTE_RX,ry:this.NOTE_RY,
        fill:"#111",transform:`rotate(-18 ${x} ${y})`
      });
      this.svg.appendChild(head);
      heads.push({x,y});
    });

    let stemX=null,stemEnd=null;
    if(event.duration<4){
      const anchor=dir==="up"?Math.min(...ys):Math.max(...ys);
      stemX=x+(dir==="up"?this.NOTE_RX-2:-(this.NOTE_RX-2));
      stemEnd=anchor+(dir==="up"?-this.STEM:this.STEM);
      const stemStart=dir==="up"?Math.max(...ys):Math.min(...ys);
      this.svg.appendChild(this.el("line",{
        x1:stemX,x2:stemX,y1:stemStart,y2:stemEnd,stroke:"#111","stroke-width":"2.2"
      }));
    }

    return {event,x,ys,avg,dir,stemX,stemEnd};
  }

  groupBeamCandidates(events){
    const groups=[];
    ["R","L"].forEach(hand=>{
      const list=events.filter(e=>e.hand===hand && e.duration===.5).sort((a,b)=>a.beat-b.beat);
      let current=[];
      list.forEach(e=>{
        if(!current.length){
          current=[e];
          return;
        }
        const prev=current[current.length-1];
        const sameBeatGroup=Math.floor(prev.beat)===Math.floor(e.beat) || Math.floor(prev.beat/2)===Math.floor(e.beat/2);
        const contiguous=Math.abs(e.beat-(prev.beat+.5))<.001;
        if(contiguous && sameBeatGroup && current.length<4) current.push(e);
        else {
          if(current.length>1) groups.push(current);
          current=[e];
        }
      });
      if(current.length>1) groups.push(current);
    });
    return groups;
  }

  drawBeam(group,rendered){
    const items=group.map(e=>rendered.get(e.id)).filter(Boolean);
    if(items.length<2) return;

    const hand=group[0].hand;
    const avgY=items.reduce((s,i)=>s+i.avg,0)/items.length;
    const dir=this.stemDirection(avgY,hand);

    const start=items[0], end=items[items.length-1];
    const x1=start.x+(dir==="up"?this.NOTE_RX-2:-(this.NOTE_RX-2));
    const x2=end.x+(dir==="up"?this.NOTE_RX-2:-(this.NOTE_RX-2));

    // Small, controlled beam slope. Never allow giant diagonal beams.
    const baseYs=items.map(i=>{
      const edge=dir==="up"?Math.min(...i.ys):Math.max(...i.ys);
      return edge+(dir==="up"?-this.STEM:this.STEM);
    });
    const y1=baseYs[0];
    const rawSlope=(baseYs[baseYs.length-1]-baseYs[0])/(x2-x1||1);
    const slope=Math.max(-0.08,Math.min(0.08,rawSlope));
    const y2=y1+slope*(x2-x1);
    const thick=10;

    items.forEach(i=>{
      const sx=i.x+(dir==="up"?this.NOTE_RX-2:-(this.NOTE_RX-2));
      const yBeam=y1+slope*(sx-x1);
      const stemStart=dir==="up"?Math.max(...i.ys):Math.min(...i.ys);
      this.svg.appendChild(this.el("line",{x1:sx,x2:sx,y1:stemStart,y2:yBeam,stroke:"#111","stroke-width":"2.2"}));
    });

    const path=dir==="up"
      ? `M${x1} ${y1} L${x2} ${y2} L${x2} ${y2+thick} L${x1} ${y1+thick} Z`
      : `M${x1} ${y1} L${x2} ${y2} L${x2} ${y2-thick} L${x1} ${y1-thick} Z`;
    this.svg.appendChild(this.el("path",{d:path,fill:"#111"}));
  }

  render(model,handMode="both"){
    this.svg.innerHTML="";
    const width=this.CONTENT_START+model.totalBeats*this.BEAT_PX+420;
    this.svg.setAttribute("viewBox",`0 0 ${width} ${this.CANVAS_H}`);
    this.svg.style.width=width+"px";
    this.svg.parentElement.style.width=width+"px";

    this.drawStaff(width,this.TREBLE_TOP,"treble","右手",model.totalBeats,model.time);
    this.drawStaff(width,this.BASS_TOP,"bass","左手",model.totalBeats,model.time);
    this.drawBrace();

    const events=model.eventsForHand(handMode);
    const rendered=new Map();
    events.forEach(e=>rendered.set(e.id,this.drawEvent(e)));
    this.groupBeamCandidates(events).forEach(g=>this.drawBeam(g,rendered));

    if(handMode==="right"){
      const bass=this.svg.querySelector('[data-staff="bass"]');
      if(bass) bass.style.opacity=".12";
    }else if(handMode==="left"){
      const treble=this.svg.querySelector('[data-staff="treble"]');
      if(treble) treble.style.opacity=".12";
    }

    return {width,beatPx:this.BEAT_PX,contentStart:this.CONTENT_START};
  }
};
