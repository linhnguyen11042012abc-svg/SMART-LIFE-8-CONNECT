(() => {
  "use strict";

  const KEY = "smartLife_v7_audio_settings";
  let settings = {music:false,effects:true,musicVolume:0.7,voiceVolume:1};

  try {
    settings = {...settings,...JSON.parse(localStorage.getItem(KEY)||"{}")};
  } catch {}

  settings.musicVolume = Math.max(0,Math.min(1,Number(settings.musicVolume)||0));
  settings.voiceVolume = Math.max(0,Math.min(1,Number(settings.voiceVolume)||0));

  let ctx = null, master = null, timer = null, step = 0;

  const melody = [523,659,784,1047,784,659,587,698,880,1047,880,698,784,659,523,659];
  const chords = [[261,329,392],[220,261,329],[174,220,261],[196,247,294]];

  function audio() {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    if (!ctx) {
      ctx = new C();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq,duration,volume,wave="sine",music=false) {
    const c = audio();
    if (!c || !master) return;

    const osc = c.createOscillator();
    const gain = c.createGain();
    const vol = music
      ? volume * Math.sqrt(settings.musicVolume)
      : volume;

    osc.type = wave;
    osc.frequency.setValueAtTime(freq,c.currentTime);
    gain.gain.setValueAtTime(0.001,c.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001,vol),c.currentTime+0.025);
    gain.gain.exponentialRampToValueAtTime(0.001,c.currentTime+duration);

    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(c.currentTime+duration+0.04);
  }

  function correct() {
    if (!settings.effects) return;
    tone(659,.18,.24,"triangle");
    setTimeout(()=>tone(880,.25,.23,"triangle"),110);
    setTimeout(()=>tone(1047,.3,.19,"sine"),220);
  }

  function wrong() {
    if (!settings.effects) return;
    tone(220,.25,.2,"triangle");
  }

  function beat() {
    const chord = chords[Math.floor(step/4)%4];
    const note = melody[step%melody.length];

    tone(note,.22,.14,"triangle",true);
    tone(note*2,.12,.035,"sine",true);

    if (step%4===0) {
      chord.forEach((f,i)=>tone(f,.85,.035,"sawtooth",true));
      tone(chord[0]/2,.42,.13,"triangle",true);
      tone(95,.12,.12,"sine",true);
    }

    if (step%2===1) tone(chord[1]*2,.1,.045,"square",true);
    if (step%4===2) tone(145,.08,.055,"triangle",true);

    step++;
  }

  function save() {
    try { localStorage.setItem(KEY,JSON.stringify(settings)); } catch {}
  }

  function update() {
    const b = document.getElementById("globalSoundToggle");
    if (b) {
      b.textContent = settings.music ? "🔊 Tắt nhạc" : "🎵 Bật nhạc";
      b.setAttribute("aria-pressed",String(settings.music));
    }

    const modalButton = document.querySelector("[data-v7-sound]");
    if (modalButton) modalButton.textContent = settings.music ? "🔊 Tắt nhạc" : "🎵 Bật nhạc";

    const ms = document.getElementById("musicVolume");
    const vs = document.getElementById("voiceVolume");
    if (ms) ms.value = String(Math.round(settings.musicVolume*100));
    if (vs) vs.value = String(Math.round(settings.voiceVolume*100));

    const ml = document.getElementById("musicVolumeValue");
    const vl = document.getElementById("voiceVolumeValue");
    if (ml) ml.textContent = Math.round(settings.musicVolume*100)+"%";
    if (vl) vl.textContent = Math.round(settings.voiceVolume*100)+"%";
  }

  function setMusic(on) {
    settings.music = !!on;
    if (timer) clearInterval(timer);
    timer = null;

    if (settings.music) {
      step = 0;
      audio();
      beat();
      timer = setInterval(beat,267);
    }

    save();
    update();
  }

  function toggleMusic() {
    setMusic(!settings.music);
  }

  function setMusicVolume(value) {
    settings.musicVolume = Math.max(0,Math.min(1,Number(value)/100));
    save();
    update();
  }

  function setVoiceVolume(value) {
    settings.voiceVolume = Math.max(0,Math.min(1,Number(value)/100));
    save();
    update();
  }

  document.addEventListener("click",e=>{
    if (e.target.closest("#globalSoundToggle")) toggleMusic();
  });

  document.addEventListener("input",e=>{
    if (e.target.id==="musicVolume") setMusicVolume(e.target.value);
    if (e.target.id==="voiceVolume") setVoiceVolume(e.target.value);
  });

  window.SMARTLIFEAudio = {
    correct,wrong,setMusic,toggleMusic,
    isMusicOn:()=>settings.music,
    setMusicVolume,getMusicVolume:()=>settings.musicVolume,
    setVoiceVolume,getVoiceVolume:()=>settings.voiceVolume,
    setEffects(on) {
      settings.effects = !!on;
      save();
    }
  };

  update();
})();
