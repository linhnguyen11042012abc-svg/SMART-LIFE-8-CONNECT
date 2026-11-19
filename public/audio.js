(() => {
  "use strict";
  const KEY="smartLife_v7_audio_settings";
  let settings={music:false,effects:true};
  try{settings={...settings,...JSON.parse(localStorage.getItem(KEY)||"{}")};}catch{}
  let ctx=null,timer=null,step=0;
  const notes=[196,246.94,293.66,369.99,329.63,293.66,246.94,220];
  function audio(){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;if(!ctx)ctx=new C();if(ctx.state==="suspended")ctx.resume();return ctx;}
  function tone(freq,duration=.2,volume=.025,wave="sine"){
    const c=audio();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=wave;o.frequency.value=freq;g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),c.currentTime+.025);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+duration+.04);
  }
  function correct(){if(!settings.effects)return;tone(659.25,.13,.05,"triangle");setTimeout(()=>tone(880,.2,.045,"triangle"),95);}
  function wrong(){if(!settings.effects)return;tone(220,.16,.022,"sine");}
  function beat(){const n=notes[step++%notes.length];tone(n,.9,.009,"sine");if(step%4===0)setTimeout(()=>tone(n/2,.75,.006,"triangle"),90);}
  function save(){localStorage.setItem(KEY,JSON.stringify(settings));}
  function update(){const b=document.getElementById("globalSoundToggle");if(b){b.textContent=settings.music?"🔊 Tắt nhạc":"🎵 Bật nhạc";b.setAttribute("aria-pressed",String(settings.music));}const modalButton=document.querySelector("[data-v7-sound]");if(modalButton)modalButton.textContent=settings.music?"🔊 Tắt nhạc":"🎵 Bật nhạc";}
  function setMusic(on){settings.music=!!on;if(timer){clearInterval(timer);timer=null;}if(settings.music){audio();beat();timer=setInterval(beat,1250);}save();update();}
  function toggleMusic(){setMusic(!settings.music);}
  document.addEventListener("click",e=>{if(e.target.closest("#globalSoundToggle")){toggleMusic();}});
  window.SMARTLIFEAudio={correct,wrong,setMusic,toggleMusic,isMusicOn:()=>settings.music,setEffects(on){settings.effects=!!on;save();}};
  update();
})();
