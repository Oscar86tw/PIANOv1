
window.PianoPractice = window.PianoPractice || {};

PianoPractice.Keyboard = class Keyboard {
  constructor(container){
    this.el=container;
    this.noteToMidi=PianoCore.Note.midi;
    this.build();
  }

  build(){
    this.el.innerHTML="";
    const whites=[];
    for(let m=48;m<=84;m++) if(![1,3,6,8,10].includes(m%12)) whites.push(m);

    whites.forEach(m=>{
      const k=document.createElement("div");
      k.className="white";
      k.dataset.midi=m;
      if(m%12===0){
        const l=document.createElement("div");
        l.className="key-label";
        l.textContent="C"+(m/12-1);
        k.appendChild(l);
      }
      this.el.appendChild(k);
    });

    const pct=100/whites.length;
    for(let i=0;i<whites.length-1;i++){
      const a=whites[i],b=whites[i+1];
      if(b-a===2){
        const k=document.createElement("div");
        k.className="black";
        k.dataset.midi=a+1;
        k.style.left=`calc(${(i+.72)*pct}% - ${pct*.31}%)`;
        k.style.width=`${pct*.62}%`;
        this.el.appendChild(k);
      }
    }
  }

  clear(){
    this.el.querySelectorAll(".on").forEach(k=>k.classList.remove("on"));
  }

  showNotes(notes=[]){
    this.clear();
    notes.forEach(n=>{
      const midi=this.noteToMidi(n);
      this.el.querySelector(`[data-midi="${midi}"]`)?.classList.add("on");
    });
  }
};
