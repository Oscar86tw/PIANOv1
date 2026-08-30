
window.PianoCore = window.PianoCore || {};

PianoCore.StaffGeometry = (() => {
  const DEG={C:0,D:1,E:2,F:3,G:4,A:5,B:6};

  // Directly adapted from the user's V6.4.2 practice geometry.
  const G={
    lineGap:20,
    step:10,
    trebleTop:96,
    bassTop:342,
    lineCount:5,
    noteHeadWidth:25,
    noteHeadHeight:15,
    practiceHeight:540
  };

  G.trebleBottom=G.trebleTop+(G.lineCount-1)*G.lineGap; // E4 = 176
  G.bassBottom=G.bassTop+(G.lineCount-1)*G.lineGap;     // G2 = 422
  G.staffGap=G.bassTop-G.trebleBottom;

  function parse(note){
    const raw=String(note??"").replace("s","#");
    const m=raw.match(/^([A-G])([#b]?)(-?\d)$/);
    if(!m)return null;
    return {letter:m[1],sharp:m[2]==="#",flat:m[2]==="b",octave:Number(m[3])};
  }

  function diatonic(note){
    const p=parse(note);
    if(!p)throw new Error(`StaffGeometry 無法辨識音名：${note}`);
    return p.octave*7+DEG[p.letter];
  }

  function centerY(note,hand){
    const d=diatonic(note);
    if(hand==="L" || hand==="left"){
      const base=2*7+DEG.G; // bass bottom line G2
      return G.bassBottom-(d-base)*G.step;
    }
    const base=4*7+DEG.E;   // treble bottom line E4
    return G.trebleBottom-(d-base)*G.step;
  }

  function topY(note,hand){
    return centerY(note,hand)-G.noteHeadHeight/2;
  }

  function lineYs(hand){
    const top=(hand==="L"||hand==="left")?G.bassTop:G.trebleTop;
    return Array.from({length:G.lineCount},(_,i)=>top+i*G.lineGap);
  }

  function needsLedger(note,hand){
    const y=centerY(note,hand);
    const lines=lineYs(hand);
    return y<lines[0]-G.step || y>lines[lines.length-1]+G.step;
  }

  return {...G,parse,diatonic,centerY,topY,lineYs,needsLedger};
})();
