
window.PianoScore = window.PianoScore || {};

PianoScore.ScoreRenderer = class ScoreRenderer {
  constructor(svg){
    this.svg=svg;
    this.NS="http://www.w3.org/2000/svg";

    // V6.2.5 keeps V6.2.4 sizing, but fixes note-to-staff alignment.
    this.STAFF_SPACE=40.8;
    this.HALF_SPACE=this.STAFF_SPACE/2;

    // Two independent 50% practice zones.
    this.CANVAS_H=840;
    this.HALF_H=this.CANVAS_H/2;
    this.TREBLE_TOP=118;
    this.BASS_TOP=this.HALF_H+118;

    this.NOTE_RX=12.4;
    this.NOTE_RY=7.84;
    this.STEM=89.6;
    this.BEAM_THICK=9.6;

    this.BEAT_PX=225;
    this.CONTENT_START=340;

    // Formal staff anchors:
    // treble bottom line = E4, bass bottom line = G2
    this.E4=PianoCore.Note.diatonic("E4");
    this.G2=PianoCore.Note.diatonic("G2");

    this.lastTimeline=null;
  }

  el(name,attrs={}){
    const n=document.createElementNS(this.NS,name);
    Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));
    return n;
  }

  xForBeat(beat){
    return this.CONTENT_START+beat*this.BEAT_PX;
  }

  staffTop(hand){ return hand==="R" ? this.TREBLE_TOP : this.BASS_TOP; }
  staffBottom(hand){ return this.staffTop(hand)+this.STAFF_SPACE*4; }

  snapToGrid(y){
    // Every valid note center must fall exactly on a line or a space center.
    // This removes visual drift from floating-point layout.
    const unit = this.HALF_SPACE;
    return Math.round(y / unit) * unit;
  }

  noteY(note,hand){
    const step=PianoCore.Note.diatonic(note);
    const bottom=this.staffBottom(hand);
    const anchor=hand==="R"?this.E4:this.G2;

    // One diatonic step = one half-space.
    const raw = bottom - (step-anchor)*this.HALF_SPACE;
    return this.snapToGrid(raw);
  }

  staffCenter(hand){
    return this.staffTop(hand)+this.STAFF_SPACE*2;
  }

  stemDirection(y,hand){
    return y>=this.staffCenter(hand)?"up":"down";
  }

  drawStaffLines(width,top,totalBeats,time){
    const g=this.el("g");
    for(let i=0;i<5;i++){
      const y=top+i*this.STAFF_SPACE;
      g.appendChild(this.el("line",{
        x1:28,x2:width-24,y1:y,y2:y,
        stroke:"#252525","stroke-width":"1.15","shape-rendering":"crispEdges"
      }));
    }

    for(let beat=0;beat<=totalBeats;beat+=time[0]){
      const x=this.xForBeat(beat);
      g.appendChild(this.el("line",{
        x1:x,x2:x,y1:top,y2:top+this.STAFF_SPACE*4,
        stroke:"#333","stroke-width":beat===0?"1.5":"1","shape-rendering":"crispEdges"
      }));
    }
    this.svg.appendChild(g);
  }

  drawClef(top,clef){
    const c=this.el("text",{
      x:44,
      y:clef==="treble"?top+this.STAFF_SPACE*3.45:top+this.STAFF_SPACE*3.25,
      "font-size":clef==="treble"?"106":"90",
      "font-family":"'Noto Music','Bravura',serif",
      fill:"#111"
    });
    c.textContent=clef==="treble"?"𝄞":"𝄢";
    this.svg.appendChild(c);
  }

  keySignatureY(hand,letter){
    const note=hand==="R" ? (letter==="F"?"F5":"C5") : (letter==="F"?"F3":"C3");
    return this.noteY(note,hand);
  }

  drawKeyAndTime(top,hand,time,keySignature){
    let x=131;

    if(keySignature==="D"){
      ["F","C"].forEach(letter=>{
        const y=this.keySignatureY(hand,letter);
        const sharp=this.el("text",{
          x,y:y+10,
          "font-size":"35",
          "font-family":"'Noto Music','Bravura',serif",
          fill:"#111"
        });
        sharp.textContent="♯";
        this.svg.appendChild(sharp);
        x+=27;
      });
    }

    x+=15;
    const topNum=this.el("text",{
      x,y:top+this.STAFF_SPACE*1.7,
      "font-size":"45","font-weight":"600","font-family":"Georgia,serif",fill:"#111"
    });
    const botNum=this.el("text",{
      x,y:top+this.STAFF_SPACE*3.72,
      "font-size":"45","font-weight":"600","font-family":"Georgia,serif",fill:"#111"
    });
    topNum.textContent=String(time[0]);
    botNum.textContent=String(time[1]);
    this.svg.appendChild(topNum);
    this.svg.appendChild(botNum);
  }

  drawGrandStaff(width,model){
    this.svg.appendChild(this.el("rect",{x:0,y:0,width,height:this.HALF_H,fill:"#fffdf7"}));
    this.svg.appendChild(this.el("rect",{x:0,y:this.HALF_H,width,height:this.HALF_H,fill:"#fffaf2"}));
    this.svg.appendChild(this.el("line",{
      x1:0,x2:width,y1:this.HALF_H,y2:this.HALF_H,
      stroke:"#d8d2c7","stroke-width":"3","shape-rendering":"crispEdges"
    }));

    const rh=this.el("text",{x:18,y:34,"font-size":"18","font-weight":"700",fill:"#666"});
    rh.textContent="右手";
    const lh=this.el("text",{x:18,y:this.HALF_H+34,"font-size":"18","font-weight":"700",fill:"#666"});
    lh.textContent="左手";
    this.svg.appendChild(rh);
    this.svg.appendChild(lh);

    this.drawStaffLines(width,this.TREBLE_TOP,model.totalBeats,model.time);
    this.drawStaffLines(width,this.BASS_TOP,model.totalBeats,model.time);
    this.drawClef(this.TREBLE_TOP,"treble");
    this.drawClef(this.BASS_TOP,"bass");
    this.drawKeyAndTime(this.TREBLE_TOP,"R",model.time,model.keySignature);
    this.drawKeyAndTime(this.BASS_TOP,"L",model.time,model.keySignature);

    const t=this.TREBLE_TOP,b=this.BASS_TOP,s=this.STAFF_SPACE;
    this.svg.appendChild(this.el("path",{
      d:`M31 ${t}
         C15 ${t+25},15 ${t+72},31 ${t+s*4}
         L31 ${b}
         C15 ${b+25},15 ${b+72},31 ${b+s*4}`,
      fill:"none",stroke:"#333","stroke-width":"2.2"
    }));
  }

  drawLedger(x,y,hand){
    const top=this.staffTop(hand);
    const bottom=this.staffBottom(hand);

    if(y<top-this.HALF_SPACE*0.1){
      for(let ly=top-this.STAFF_SPACE; ly>=y-1; ly-=this.STAFF_SPACE){
        this.svg.appendChild(this.el("line",{
          x1:x-16,x2:x+16,y1:ly,y2:ly,stroke:"#222","stroke-width":"1.2","shape-rendering":"crispEdges"
        }));
      }
    }

    if(y>bottom+this.HALF_SPACE*0.1){
      for(let ly=bottom+this.STAFF_SPACE; ly<=y+1; ly+=this.STAFF_SPACE){
        this.svg.appendChild(this.el("line",{
          x1:x-16,x2:x+16,y1:ly,y2:ly,stroke:"#222","stroke-width":"1.2","shape-rendering":"crispEdges"
        }));
      }
    }
  }

  shouldDrawAccidental(note,keySignature){
    const p=PianoCore.Note.parse(note);
    if(!p.accidental) return false;
    if(keySignature==="D" && (p.accidental==="#"||p.accidental==="s") && ["F","C"].includes(p.letter)) return false;
    return true;
  }

  drawAccidental(note,x,y,keySignature){
    if(!this.shouldDrawAccidental(note,keySignature)) return;
    const p=PianoCore.Note.parse(note);
    const a=this.el("text",{
      x:x-27,y:y+9,
      "font-size":"31",
      "font-family":"'Noto Music','Bravura',serif",
      fill:"#111"
    });
    a.textContent=(p.accidental==="#"||p.accidental==="s")?"♯":"♭";
    this.svg.appendChild(a);
  }

  drawNoteHead(x,y,duration){
    const hollow=duration>=2;
    const head=this.el("ellipse",{
      cx:x,cy:y,rx:this.NOTE_RX,ry:this.NOTE_RY,
      fill:hollow?"#fffdf7":"#111",
      stroke:"#111",
      "stroke-width":hollow?"2":"1",
      transform:`rotate(-18 ${x} ${y})`
    });
    this.svg.appendChild(head);
  }

  drawStem(x,ys,dir,endY){
    const stemX=x+(dir==="up"?this.NOTE_RX-1:-(this.NOTE_RX-1));
    const startY=dir==="up"?Math.max(...ys):Math.min(...ys);
    this.svg.appendChild(this.el("line",{
      x1:stemX,x2:stemX,y1:startY,y2:endY,stroke:"#111","stroke-width":"1.8","shape-rendering":"crispEdges"
    }));
    return stemX;
  }

  renderEventHead(event,model){
    const x=this.xForBeat(event.beat);
    const ys=event.notes.map(n=>this.noteY(n,event.hand));
    const avg=ys.reduce((a,b)=>a+b,0)/ys.length;
    const dir=this.stemDirection(avg,event.hand);

    event.notes.forEach((note,i)=>{
      const y=ys[i];
      this.drawLedger(x,y,event.hand);
      this.drawAccidental(note,x,y,model.keySignature);
      this.drawNoteHead(x,y,event.duration);
    });

    return {event,x,ys,avg,dir};
  }

  beamGroups(events){
    const groups=[];
    ["R","L"].forEach(hand=>{
      const list=events.filter(e=>e.hand===hand && e.duration<=.5).sort((a,b)=>a.beat-b.beat);
      let current=[];
      const flush=()=>{ if(current.length>1) groups.push(current); current=[]; };

      list.forEach(e=>{
        if(!current.length){ current=[e]; return; }
        const prev=current[current.length-1];
        const contiguous=Math.abs(e.beat-(prev.beat+prev.duration))<.001;
        const groupBase=Math.floor(current[0].beat);
        const sameBeat=Math.floor(e.beat)===groupBase;

        if(contiguous && sameBeat) current.push(e);
        else { flush(); current=[e]; }
      });

      flush();
    });
    return groups;
  }

  drawStandaloneStem(item){
    const {event,x,ys,dir}=item;
    if(event.duration>=4) return;

    const edge=dir==="up"?Math.min(...ys):Math.max(...ys);
    const endY=edge+(dir==="up"?-this.STEM:this.STEM);
    this.drawStem(x,ys,dir,endY);

    if(event.duration<=.5){
      const stemX=x+(dir==="up"?this.NOTE_RX-1:-(this.NOTE_RX-1));
      const flag=this.el("path",{
        d:dir==="up"
          ? `M${stemX} ${endY} C${stemX+22} ${endY+8},${stemX+23} ${endY+25},${stemX+8} ${endY+31}`
          : `M${stemX} ${endY} C${stemX+22} ${endY-8},${stemX+23} ${endY-25},${stemX+8} ${endY-31}`,
        fill:"none",stroke:"#111","stroke-width":"4"
      });
      this.svg.appendChild(flag);
    }
  }

  drawBeam(group,rendered){
    const items=group.map(e=>rendered.get(e.id)).filter(Boolean);
    if(items.length<2) return;

    const dir="up";
    const x1=items[0].x+(this.NOTE_RX-1);
    const x2=items[items.length-1].x+(this.NOTE_RX-1);

    const desired=items.map(i=>{
      const edge=Math.min(...i.ys);
      return edge-this.STEM;
    });

    const y1=this.snapToGrid(desired[0]);
    const rawSlope=(desired[desired.length-1]-desired[0])/(x2-x1||1);
    const slope=Math.max(-0.035,Math.min(0.035,rawSlope));
    const y2=this.snapToGrid(y1+slope*(x2-x1));

    items.forEach(i=>{
      const stemX=i.x+(this.NOTE_RX-1);
      const beamY=this.snapToGrid(y1+slope*(stemX-x1));
      this.drawStem(i.x,i.ys,dir,beamY);
    });

    const t=this.BEAM_THICK;
    this.svg.appendChild(this.el("path",{
      d:`M${x1} ${y1} L${x2} ${y2} L${x2} ${y2+t} L${x1} ${y1+t} Z`,
      fill:"#111"
    }));

    if(group.some(e=>e.duration<=.25)){
      const off=13;
      this.svg.appendChild(this.el("path",{
        d:`M${x1} ${y1+off} L${x2} ${y2+off} L${x2} ${y2+off+t} L${x1} ${y1+off+t} Z`,
        fill:"#111"
      }));
    }
  }

  buildTimeline(model){
    const anchors=[];
    for(let beat=0; beat<=model.totalBeats; beat+=.5){
      anchors.push({beat,x:this.xForBeat(beat)});
    }
    this.lastTimeline=new PianoScore.TimelineMap(anchors);
    return this.lastTimeline;
  }

  render(model,handMode="both"){
    this.svg.innerHTML="";

    const width=this.CONTENT_START+model.totalBeats*this.BEAT_PX+360;
    this.svg.setAttribute("viewBox",`0 0 ${width} ${this.CANVAS_H}`);
    this.svg.style.width=width+"px";
    this.svg.parentElement.style.width=width+"px";

    this.drawGrandStaff(width,model);

    const events=model.eventsForHand(handMode);
    const rendered=new Map();
    events.forEach(event=>rendered.set(event.id,this.renderEventHead(event,model)));

    const groups=this.beamGroups(events);
    const groupedIds=new Set(groups.flat().map(e=>e.id));
    groups.forEach(group=>this.drawBeam(group,rendered));

    events.forEach(event=>{
      if(groupedIds.has(event.id)) return;
      this.drawStandaloneStem(rendered.get(event.id));
    });

    const timeline=this.buildTimeline(model);
    return { width, timeline, contentStart:this.CONTENT_START, canvasHeight:this.CANVAS_H };
  }
};
