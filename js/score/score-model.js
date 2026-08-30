
window.PianoScore = window.PianoScore || {};

PianoScore.ScoreModel = class ScoreModel {
  constructor({title="Lesson Practice 01", bpm=60, time=[4,4], totalBeats=16, events=[]}={}){
    this.title=title;
    this.bpm=bpm;
    this.time=time;
    this.totalBeats=totalBeats;
    this.events=events
      .map((e,i)=>({...e,id:e.id||`ev-${i}`}))
      .sort((a,b)=>a.beat-b.beat);
    this.validate();
  }

  validate(){
    this.events.forEach(e=>{
      if(!["R","L"].includes(e.hand)) throw new Error(`Score event hand 必須是 R/L：${e.id}`);
      if(!Number.isFinite(e.beat)||e.beat<0) throw new Error(`Score event beat 無效：${e.id}`);
      if(!Number.isFinite(e.duration)||e.duration<=0) throw new Error(`Score event duration 無效：${e.id}`);
      if(!Array.isArray(e.notes)||!e.notes.length) throw new Error(`Score event notes 為空：${e.id}`);
      e.notes.forEach(PianoCore.Note.parse);
    });
  }

  eventsForHand(mode="both"){
    if(mode==="right") return this.events.filter(e=>e.hand==="R");
    if(mode==="left") return this.events.filter(e=>e.hand==="L");
    return this.events;
  }

  eventsAtBeat(beat, tolerance=0.06, mode="both"){
    return this.eventsForHand(mode).filter(e=>Math.abs(e.beat-beat)<=tolerance);
  }

  eventsBetween(fromBeat,toBeat,mode="both"){
    return this.eventsForHand(mode).filter(e=>e.beat>fromBeat+1e-7 && e.beat<=toBeat+1e-7);
  }

  static demo(){
    const E=(beat,notes,duration,hand)=>({beat,notes:Array.isArray(notes)?notes:[notes],duration,hand});
    return new PianoScore.ScoreModel({
      title:"Lesson Practice 01",
      bpm:60,
      time:[4,4],
      totalBeats:16,
      events:[
        E(0,"D5",1,"R"), E(1,"E5",1,"R"),
        E(2,"Fs5",.5,"R"), E(2.5,"G5",.5,"R"), E(3,"A5",.5,"R"), E(3.5,"Fs5",.5,"R"),
        E(4,"E5",1,"R"), E(5,"D5",1,"R"),
        E(6,"Cs5",.5,"R"), E(6.5,"D5",.5,"R"), E(7,"E5",.5,"R"), E(7.5,"Cs5",.5,"R"),
        E(8,["D5","Fs5"],1,"R"), E(9,"A5",1,"R"),
        E(10,"G5",.5,"R"), E(10.5,"Fs5",.5,"R"), E(11,"E5",.5,"R"), E(11.5,"D5",.5,"R"),
        E(12,"Cs5",1,"R"), E(13,"D5",1,"R"), E(14,"E5",1,"R"), E(15,"D5",1,"R"),

        ...["D3","A3","D4","Fs4","A3","D4","Fs4","A4"].map((n,i)=>E(i*.5,n,.5,"L")),
        ...["G3","D4","G4","B4","D4","G4","B4","D5"].map((n,i)=>E(4+i*.5,n,.5,"L")),
        ...["A3","E4","A4","Cs5","E4","A4","Cs5","E5"].map((n,i)=>E(8+i*.5,n,.5,"L")),
        ...["D3","A3","D4","Fs4","A3","D4","Fs4","A4"].map((n,i)=>E(12+i*.5,n,.5,"L"))
      ]
    });
  }
};
