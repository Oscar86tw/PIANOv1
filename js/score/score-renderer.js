
window.PianoScore = window.PianoScore || {};

PianoScore.ScoreRenderer = class ScoreRenderer {
  constructor(svg){
    this.svg=svg;
    this.NS="http://www.w3.org/2000/svg";

    // Large learning score, but proportions follow normal printed notation.
    this.STAFF_SPACE=34;
    this.HALF_SPACE=this.STAFF_SPACE/2;

    this.TREBLE_TOP=62;
    this.SYSTEM_GAP=112; // clear gap between right and left hand staves
    this.BASS_TOP=this.TREBLE_TOP+this.STAFF_SPACE*4+this.SYSTEM_GAP;

    this.NOTE_RX=10.5;
    this.NOTE_RY=6.6;
    this.STEM=78;
    this.BEAM_THICK=8;

    this.BEAT_PX=165;
    this.CONTENT_START=290;
    this.CANVAS_H=this.BASS_TOP+this.STAFF_SPACE*4+76;

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

  noteY(note,hand){
    const step=PianoCore.Note.diatonic(note);
    const top=hand==="R"?this.TREBLE_TOP:this.BASS_TOP;
    const bottom=top+this.STAFF_SPACE*4;
    const anchor=hand==="R"?this.E4:this.G2;

    // Each letter-name step is exactly half a staff-space.
    return bottom-(step-anchor)*this.HALF_SPACE;
  }

  staffCenter(hand){
    return (hand==="R"?this.TREBLE_TOP:this.BASS_TOP)+this.STAFF_SPACE*2;
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
        stroke:"#252525","stroke-width":"1.15"
      }));
    }

    for(let beat=0;beat<=totalBeats;beat+=time[0]){
      const x=this.xForBeat(beat);
      g.appendChild(this.el("line",{
        x1:x,x2:x,y1:top,y2:top+this.STAFF_SPACE*4,
        stroke:"#333","stroke-width":beat===0?"1.5":"1"
      }));
    }
    this.svg.appendChild(g);
  }

  drawClef(top,clef,label){
    const handLabel=this.el("text",{x:8,y:top-11,"font-size":"12",fill:"#777"});
    handLabel.textContent=label;
    this.svg.appendChild(handLabel);

    const c=this.el("text",{
      x:44,
      y:clef==="treble"?top+this.STAFF_SPACE*3.45:top+this.STAFF_SPACE*3.25,
      "font-size":clef==="treble"?"91":"77",
      "font-family":"'Noto Music','Bravura',serif",
      fill:"#111"
    });
    c.textContent=clef==="treble"?"𝄞":"𝄢";
    this.svg.appendChild(c);
  }

  keySignatureY(hand,letter){
    // Standard D major: F# / C# positions.
    // Treble F5, C5. Bass F3, C3.
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
          "font-size":"31",
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
      "font-size":"39","font-weight":"600","font-family":"Georgia,serif",fill:"#111"
    });
    const botNum=this.el("text",{
      x,y:top+this.STAFF_SPACE*3.72,
      "font-size":"39","font-weight":"600","font-family":"Georgia,serif",fill:"#111"
    });
    topNum.textContent=String(time[0]);
    botNum.textContent=String(time[1]);
    this.svg.appendChild(topNum);
    this.svg.appendChild(botNum);
  }

  drawGrandStaff(width,model){
    this.drawStaffLines(width,this.TREBLE_TOP,model.totalBeats,model.time);
    this.drawStaffLines(width,this.BASS_TOP,model.totalBeats,model.time);
    this.drawClef(this.TREBLE_TOP,"treble","右手");
    this.drawClef(this.BASS_TOP,"bass","左手");
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
    const top=hand==="R"?this.TREBLE_TOP:this.BASS_TOP;
    const bottom=top+this.STAFF_SPACE*4;

    if(y<top){
      for(let ly=top-this.STAFF_SPACE;ly>=y-1;ly-=this.STAFF_SPACE){
        this.svg.appendChild(this.el("line",{
          x1:x-16,x2:x+16,y1:ly,y2:ly,stroke:"#222","stroke-width":"1.2"
        }));
      }
    }

    if(y>bottom){
      for(let ly=bottom+this.STAFF_SPACE;ly<=y+1;ly+=this.STAFF_SPACE){
        this.svg.appendChild(this.el("line",{
          x1:x-16,x2:x+16,y1:ly,y2:ly,stroke:"#222","stroke-width":"1.2"
        }));
      }
    }
  }

  shouldDrawAccidental(note,keySignature){
    const p=PianoCore.Note.parse(note);
    if(!p.accidental) return false;

    // D major key signature already contains F# and C#.
    if(keySignature==="D" && (p.accidental==="#"||p.accidental==="s") && ["F","C"].includes(p.letter)){
      return false;
    }
    return true;
  }

  drawAccidental(note,x,y,keySignature){
    if(!this.shouldDrawAccidental(note,keySignature)) return;

    const p=PianoCore.Note.parse(note);
    const a=this.el("text",{
      x:x-27,y:y+9,
      "font-size":"27",
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
      x1:stemX,x2:stemX,y1:startY,y2:endY,stroke:"#111","stroke-width":"1.8"
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
      const list=events
        .filter(e=>e.hand===hand && e.duration<=.5)
        .sort((a,b)=>a.beat-b.beat);

      let current=[];

      const flush=()=>{
        if(current.length>1) groups.push(current);
        current=[];
      };

      list.forEach(e=>{
        if(!current.length){
          current=[e];
          return;
        }

        const prev=current[current.length-1];
        const contiguous=Math.abs(e.beat-(prev.beat+prev.duration))<.001;

        // Group by one quarter-note beat for 4/4.
        const groupBase=Math.floor(current[0].beat);
        const sameBeat=Math.floor(e.beat)===groupBase;

        if(contiguous && sameBeat){
          current.push(e);
        }else{
          flush();
          current=[e];
        }
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

    // Isolated eighth / sixteenth flag.
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

    const hand=group[0].hand;
    const avgY=items.reduce((s,i)=>s+i.avg,0)/items.length;
    const dir=this.stemDirection(avgY,hand);

    const x1=items[0].x+(dir==="up"?this.NOTE_RX-1:-(this.NOTE_RX-1));
    const x2=items[items.length-1].x+(dir==="up"?this.NOTE_RX-1:-(this.NOTE_RX-1));

    const desired=items.map(i=>{
      const edge=dir==="up"?Math.min(...i.ys):Math.max(...i.ys);
      return edge+(dir==="up"?-this.STEM:this.STEM);
    });

    const y1=desired[0];
    const rawSlope=(desired[desired.length-1]-desired[0])/(x2-x1||1);

    // Printed notation uses restrained beam angles.
    const slope=Math.max(-0.035,Math.min(0.035,rawSlope));
    const y2=y1+slope*(x2-x1);

    items.forEach(i=>{
      const stemX=i.x+(dir==="up"?this.NOTE_RX-1:-(this.NOTE_RX-1));
      const beamY=y1+slope*(stemX-x1);
      this.drawStem(i.x,i.ys,dir,beamY);
    });

    const t=this.BEAM_THICK;
    this.svg.appendChild(this.el("path",{
      d:dir==="up"
        ? `M${x1} ${y1} L${x2} ${y2} L${x2} ${y2+t} L${x1} ${y1+t} Z`
        : `M${x1} ${y1} L${x2} ${y2} L${x2} ${y2-t} L${x1} ${y1-t} Z`,
      fill:"#111"
    }));

    // Sixteenth notes get a second beam.
    if(group.some(e=>e.duration<=.25)){
      const off=dir==="up"?13:-13;
      this.svg.appendChild(this.el("path",{
        d:dir==="up"
          ? `M${x1} ${y1+off} L${x2} ${y2+off} L${x2} ${y2+off+t} L${x1} ${y1+off+t} Z`
          : `M${x1} ${y1+off} L${x2} ${y2+off} L${x2} ${y2+off-t} L${x1} ${y1+off-t} Z`,
        fill:"#111"
      }));
    }
  }

  buildTimeline(model){
    const anchors=[];

    for(let beat=0;beat<=model.totalBeats;beat+=.5){
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

    events.forEach(event=>{
      rendered.set(event.id,this.renderEventHead(event,model));
    });

    const groups=this.beamGroups(events);
    const groupedIds=new Set(groups.flat().map(e=>e.id));

    groups.forEach(group=>this.drawBeam(group,rendered));

    events.forEach(event=>{
      if(groupedIds.has(event.id)) return;
      this.drawStandaloneStem(rendered.get(event.id));
    });

    if(handMode==="right"){
      // Do not remove the left stave: keep orientation, but de-emphasize it.
      this.svg.querySelectorAll("[data-left-muted]").forEach(()=>{});
    }

    const timeline=this.buildTimeline(model);

    return {
      width,
      timeline,
      contentStart:this.CONTENT_START,
      canvasHeight:this.CANVAS_H
    };
  }
};
