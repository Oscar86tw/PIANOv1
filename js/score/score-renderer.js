
window.PianoScore = window.PianoScore || {};

PianoScore.ScoreRenderer = class ScoreRenderer {
  constructor(svg){
    this.svg=svg;
    this.NS="http://www.w3.org/2000/svg";

    const G=PianoCore.StaffGeometry;
    this.CANVAS_H=G.practiceHeight;
    this.STAFF_SPACE=G.lineGap;
    this.HALF_SPACE=G.step;
    this.TREBLE_TOP=G.trebleTop;
    this.BASS_TOP=G.bassTop;

    this.NOTE_RX=G.noteHeadWidth/2;
    this.NOTE_RY=G.noteHeadHeight/2;
    this.STEM=47;
    this.BEAM_THICK=6;

    this.BEAT_PX=116;
    this.CONTENT_START=250;

    // Reference colors: right hand neutral blue-gray, left hand purple.
    this.COLORS={
      R:{staff:"#4D566B",note:"#3F485D",zone:"#F7F9FC"},
      L:{staff:"#6658C9",note:"#6658C9",zone:"#F7F5FF"}
    };

    this.lastTimeline=null;
  }

  el(name,attrs={}){
    const n=document.createElementNS(this.NS,name);
    Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));
    return n;
  }

  xForBeat(beat){
    return this.CONTENT_START + beat * (this.ACTIVE_BEAT_PX || this.BEAT_PX);
  }
  staffTop(hand){ return hand==="R"?this.TREBLE_TOP:this.BASS_TOP; }
  staffBottom(hand){ return this.staffTop(hand)+this.STAFF_SPACE*4; }
  noteY(note,hand){ return PianoCore.StaffGeometry.centerY(note,hand); }
  staffCenter(hand){ return this.staffTop(hand)+this.STAFF_SPACE*2; }
  stemDirection(y,hand){ return y>=this.staffCenter(hand)?"up":"down"; }

  drawZones(width){
    const split=270;
    this.svg.appendChild(this.el("rect",{x:0,y:0,width,height:split,fill:this.COLORS.R.zone}));
    this.svg.appendChild(this.el("rect",{x:0,y:split,width,height:this.CANVAS_H-split,fill:this.COLORS.L.zone}));
    this.svg.appendChild(this.el("line",{
      x1:0,x2:width,y1:split,y2:split,stroke:"#D9DDE7","stroke-width":"2"
    }));

    const rh=this.el("text",{x:16,y:34,"font-size":"17","font-weight":"800",fill:this.COLORS.R.staff});
    rh.textContent="右手";
    const lh=this.el("text",{x:16,y:304,"font-size":"17","font-weight":"800",fill:this.COLORS.L.staff});
    lh.textContent="左手";
    this.svg.appendChild(rh);
    this.svg.appendChild(lh);
  }

  drawStaff(width,hand,totalBeats,time){
    const top=this.staffTop(hand);
    const color=this.COLORS[hand].staff;

    PianoCore.StaffGeometry.lineYs(hand).forEach(y=>{
      this.svg.appendChild(this.el("line",{
        x1:70,x2:width-12,y1:y,y2:y,
        stroke:color,"stroke-width":"1.5"
      }));
    });

    for(let beat=0;beat<=totalBeats;beat+=time[0]){
      const x=this.xForBeat(beat);
      this.svg.appendChild(this.el("line",{
        x1:x,x2:x,y1:top,y2:top+this.STAFF_SPACE*4,
        stroke:color,"stroke-width":beat===0?"1.5":"1","stroke-opacity":".68"
      }));
    }
  }

  drawClefs(){
    const t=this.el("text",{
      x:20,y:166,"font-size":"92",
      "font-family":"'Noto Music','Bravura',serif",fill:this.COLORS.R.staff
    });
    t.textContent="𝄞";
    const b=this.el("text",{
      x:20,y:408,"font-size":"78",
      "font-family":"'Noto Music','Bravura',serif",fill:this.COLORS.L.staff
    });
    b.textContent="𝄢";
    this.svg.appendChild(t); this.svg.appendChild(b);
  }

  drawTimeAndKey(model,hand){
    const top=this.staffTop(hand);
    const color=this.COLORS[hand].staff;
    let x=116;

    if(model.keySignature==="D"){
      ["F","C"].forEach(letter=>{
        const note=hand==="R" ? (letter==="F"?"F5":"C5") : (letter==="F"?"F3":"C3");
        const y=this.noteY(note,hand);
        const s=this.el("text",{
          x,y:y+8,"font-size":"26",
          "font-family":"'Noto Music','Bravura',serif",fill:color
        });
        s.textContent="♯";
        this.svg.appendChild(s);
        x+=22;
      });
    }

    x+=12;
    const a=this.el("text",{x,y:top+34,"font-size":"31","font-weight":"700","font-family":"Georgia,serif",fill:color});
    const d=this.el("text",{x,y:top+70,"font-size":"31","font-weight":"700","font-family":"Georgia,serif",fill:color});
    a.textContent=String(model.time[0]); d.textContent=String(model.time[1]);
    this.svg.appendChild(a); this.svg.appendChild(d);
  }

  drawGrandStaff(width,model){
    this.drawZones(width);
    this.drawStaff(width,"R",model.totalBeats,model.time);
    this.drawStaff(width,"L",model.totalBeats,model.time);
    this.drawClefs();
    this.drawTimeAndKey(model,"R");
    this.drawTimeAndKey(model,"L");
  }

  drawLedger(x,y,hand){
    const top=this.staffTop(hand);
    const bottom=this.staffBottom(hand);
    const color=this.COLORS[hand].staff;

    if(y<top-this.HALF_SPACE*.5){
      for(let ly=top-this.STAFF_SPACE;ly>=y-1;ly-=this.STAFF_SPACE){
        this.svg.appendChild(this.el("line",{
          x1:x-17,x2:x+17,y1:ly,y2:ly,stroke:color,"stroke-width":"1.5"
        }));
      }
    }

    if(y>bottom+this.HALF_SPACE*.5){
      for(let ly=bottom+this.STAFF_SPACE;ly<=y+1;ly+=this.STAFF_SPACE){
        this.svg.appendChild(this.el("line",{
          x1:x-17,x2:x+17,y1:ly,y2:ly,stroke:color,"stroke-width":"1.5"
        }));
      }
    }
  }

  shouldDrawAccidental(note,keySignature){
    const p=PianoCore.Note.parse(note);
    if(!p.accidental)return false;
    if(keySignature==="D" && (p.accidental==="#"||p.accidental==="s") && ["F","C"].includes(p.letter))return false;
    return true;
  }

  drawAccidental(note,x,y,keySignature,hand){
    if(!this.shouldDrawAccidental(note,keySignature))return;
    const p=PianoCore.Note.parse(note);
    const a=this.el("text",{
      x:x-24,y:y+8,"font-size":"25",
      "font-family":"'Noto Music','Bravura',serif",
      fill:this.COLORS[hand].note
    });
    a.textContent=(p.accidental==="#"||p.accidental==="s")?"♯":"♭";
    this.svg.appendChild(a);
  }

  drawNoteHead(x,y,duration,hand){
    const hollow=duration>=2;
    const color=this.COLORS[hand].note;
    const paper=hand==="R"?this.COLORS.R.zone:this.COLORS.L.zone;

    this.svg.appendChild(this.el("ellipse",{
      cx:x,cy:y,rx:this.NOTE_RX,ry:this.NOTE_RY,
      fill:hollow?paper:color,
      stroke:color,"stroke-width":hollow?"2":"1",
      transform:`rotate(-15 ${x} ${y})`
    }));
  }

  drawStem(x,ys,dir,endY,hand){
    const stemX=x+(dir==="up"?this.NOTE_RX-1:-(this.NOTE_RX-1));
    const startY=dir==="up"?Math.max(...ys):Math.min(...ys);
    this.svg.appendChild(this.el("line",{
      x1:stemX,x2:stemX,y1:startY,y2:endY,
      stroke:this.COLORS[hand].note,"stroke-width":"2.6"
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
      this.drawAccidental(note,x,y,model.keySignature,event.hand);
      this.drawNoteHead(x,y,event.duration,event.hand);
    });

    return {event,x,ys,avg,dir};
  }

  beamGroups(events){
    const groups=[];
    ["R","L"].forEach(hand=>{
      const list=events.filter(e=>e.hand===hand && e.duration<=.5).sort((a,b)=>a.beat-b.beat);
      let current=[];
      const flush=()=>{if(current.length>1)groups.push(current);current=[]};

      list.forEach(e=>{
        if(!current.length){current=[e];return}
        const prev=current[current.length-1];
        const contiguous=Math.abs(e.beat-(prev.beat+prev.duration))<.001;
        const sameBeat=Math.floor(e.beat)===Math.floor(current[0].beat);

        if(contiguous&&sameBeat)current.push(e);
        else{flush();current=[e]}
      });

      flush();
    });
    return groups;
  }

  drawStandaloneStem(item){
    const {event,x,ys,dir}=item;
    if(event.duration>=4)return;

    const edge=dir==="up"?Math.min(...ys):Math.max(...ys);
    const endY=edge+(dir==="up"?-this.STEM:this.STEM);
    this.drawStem(x,ys,dir,endY,event.hand);

    if(event.duration<=.5){
      const stemX=x+(dir==="up"?this.NOTE_RX-1:-(this.NOTE_RX-1));
      const color=this.COLORS[event.hand].note;
      this.svg.appendChild(this.el("path",{
        d:dir==="up"
          ? `M${stemX} ${endY} C${stemX+18} ${endY+7},${stemX+20} ${endY+20},${stemX+7} ${endY+27}`
          : `M${stemX} ${endY} C${stemX+18} ${endY-7},${stemX+20} ${endY-20},${stemX+7} ${endY-27}`,
        fill:"none",stroke:color,"stroke-width":"3.5"
      }));
    }
  }

  drawBeam(group,rendered){
    const items=group.map(e=>rendered.get(e.id)).filter(Boolean);
    if(items.length<2)return;

    const hand=group[0].hand;
    const color=this.COLORS[hand].note;
    const dir="up"; // match the supplied Canon practice reference

    const x1=items[0].x+(this.NOTE_RX-1);
    const x2=items[items.length-1].x+(this.NOTE_RX-1);

    const desired=items.map(i=>Math.min(...i.ys)-this.STEM);
    const y1=desired[0];
    const rawSlope=(desired[desired.length-1]-desired[0])/(x2-x1||1);
    const slope=Math.max(-0.035,Math.min(0.035,rawSlope));
    const y2=y1+slope*(x2-x1);

    items.forEach(i=>{
      const stemX=i.x+(this.NOTE_RX-1);
      const beamY=y1+slope*(stemX-x1);
      this.drawStem(i.x,i.ys,dir,beamY,hand);
    });

    const t=this.BEAM_THICK;
    this.svg.appendChild(this.el("path",{
      d:`M${x1} ${y1} L${x2} ${y2} L${x2} ${y2+t} L${x1} ${y1+t} Z`,
      fill:color
    }));
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

    // Whole-song mode: the full current score stays visible.
    // Horizontal note spacing is calculated once from the available practice width.
    const wrap=this.svg.closest(".score-wrap");
    const available=Math.max(900,wrap?.clientWidth||1200);
    const width=available;
    const endMargin=46;

    this.CONTENT_START=Math.max(210,Math.round(width*0.16));
    this.ACTIVE_BEAT_PX=Math.max(34,(width-this.CONTENT_START-endMargin)/Math.max(1,model.totalBeats));

    this.svg.setAttribute("viewBox",`0 0 ${width} ${this.CANVAS_H}`);
    this.svg.setAttribute("preserveAspectRatio","none");
    this.svg.style.width="100%";
    this.svg.style.height="100%";
    this.svg.parentElement.style.width="100%";
    this.svg.parentElement.style.height="100%";

    this.drawGrandStaff(width,model);

    const events=model.eventsForHand(handMode);
    const rendered=new Map();
    events.forEach(event=>rendered.set(event.id,this.renderEventHead(event,model)));

    const groups=this.beamGroups(events);
    const groupedIds=new Set(groups.flat().map(e=>e.id));
    groups.forEach(group=>this.drawBeam(group,rendered));

    events.forEach(event=>{
      if(groupedIds.has(event.id))return;
      this.drawStandaloneStem(rendered.get(event.id));
    });

    const timeline=this.buildTimeline(model);
    return {
      width,
      timeline,
      contentStart:this.CONTENT_START,
      endX:this.xForBeat(model.totalBeats),
      canvasHeight:this.CANVAS_H
    };
  }
};
