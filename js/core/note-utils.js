
window.PianoCore = window.PianoCore || {};

PianoCore.Note = (() => {
  const LETTER = {C:0,D:1,E:2,F:3,G:4,A:5,B:6};
  const SEMITONE = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};

  function parse(note){
    const raw = String(note ?? "").trim();
    const m = /^([A-G])([#sb]?)(\d)$/.exec(raw);
    if(!m){
      const err = new Error(`無法辨識樂譜音名：${raw || "(空白)"}`);
      err.code = "INVALID_NOTE_NAME";
      window.PianoDiagnostics?.add({
        kind:"score-data",
        message:err.message,
        source:"js/core/note-utils.js",
        extra:{note:raw, accepted:"C4 / F#5 / Fs5 / Bb3"}
      });
      throw err;
    }
    return {raw, letter:m[1], accidental:m[2]||"", octave:Number(m[3])};
  }

  function midi(note){
    const p=parse(note);
    const accidental=(p.accidental==="#"||p.accidental==="s")?1:(p.accidental==="b"?-1:0);
    return (p.octave+1)*12 + SEMITONE[p.letter] + accidental;
  }

  function diatonic(note){
    const p=parse(note);
    return p.octave*7 + LETTER[p.letter];
  }

  function fileName(note){
    return String(note).replace("#","s")+".wav";
  }

  return {parse,midi,diatonic,fileName};
})();
