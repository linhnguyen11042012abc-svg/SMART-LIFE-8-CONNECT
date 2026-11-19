(() => {
  "use strict";
  const api = window.SMART_LIFE_6;
  const study = document.querySelector("#page-study");
  if (!study || !api) return;
  const STORE = "smartLife_infiniteWorld_v7";
  const maps = [
    {id:1,name:"Khu rừng tri thức",subtitle:"Khởi hành qua những lối mòn liên môn",emoji:"🌲",theme:"forest"},
    {id:2,name:"Đảo bay kỳ bí",subtitle:"Khám phá những hòn đảo trên tầng mây",emoji:"☁️",theme:"sky"},
    {id:3,name:"Vương quốc đại dương",subtitle:"Giải mã bí mật dưới lòng biển",emoji:"🐚",theme:"ocean"},
    {id:4,name:"Sa mạc cổ đại",subtitle:"Tìm dấu tích của nền văn minh xưa",emoji:"🏜️",theme:"desert"},
    {id:5,name:"Thành trì huyền thoại",subtitle:"Thử thách cuối cùng của nhà thám hiểm",emoji:"🏰",theme:"castle"}
  ];
  const stages = [
    {id:"flash",name:"Lật thẻ bí mật",kind:"flash",icon:"🃏",desc:"Lật thẻ để khám phá câu hỏi và lời giải"},
    {id:"fill",name:"Mật mã còn thiếu",kind:"fill",icon:"✍️",desc:"Tự điền đáp án còn thiếu"},
    {id:"match",name:"Trạm ghép đôi",kind:"match",icon:"🧩",desc:"Ghép câu hỏi với đáp án chính xác"},
    {id:"quiz",name:"Thử thách liên môn",kind:"quiz",icon:"🎯",desc:"Trắc nghiệm nhiều môn học"}
  ];
  const outfits = [
    {id:"traveler",name:"Áo nhà thám hiểm",slot:"outfit",price:0,color:"#2f8f72"},
    {id:"royal",name:"Áo choàng hoàng gia",slot:"outfit",price:90,color:"#7756b8"},
    {id:"ocean",name:"Giáp đại dương",slot:"outfit",price:110,color:"#2586ad"},
    {id:"sun",name:"Áo choàng sa mạc",slot:"outfit",price:120,color:"#c27a36"}
  ];
  const hats = [
    {id:"cap",name:"Mũ phiêu lưu",slot:"hat",price:35,emoji:"🧢"},
    {id:"wizard",name:"Mũ pháp sư",slot:"hat",price:65,emoji:"🎩"},
    {id:"crown",name:"Vương miện",slot:"hat",price:100,emoji:"👑"}
  ];
  const hands = [
    {id:"book",name:"Sách tri thức",slot:"hand",price:40,emoji:"📘"},
    {id:"wand",name:"Trượng ánh sáng",slot:"hand",price:75,emoji:"🪄"},
    {id:"lantern",name:"Đèn khám phá",slot:"hand",price:60,emoji:"🏮"},
    {id:"flag",name:"Cờ hành trình",slot:"hand",price:45,emoji:"🚩"}
  ];
  const allItems = [...outfits,...hats,...hands];
  const read = () => { try { return JSON.parse(localStorage.getItem(STORE)||"{}"); } catch { return {}; } };
  const state = Object.assign({unlocked:1,completed:{},bosses:[],history:[],owned:["traveler"],equipped:{outfit:"traveler",hat:"",hand:""},name:"Nhà thám hiểm"},read());
  state.unlocked=Math.max(1,Math.min(5,Number(state.unlocked)||1));
  state.completed=state.completed||{};state.bosses=state.bosses||[];state.history=state.history||[];
  state.owned=Array.isArray(state.owned)?state.owned:["traveler"];
  state.equipped=Object.assign({outfit:"traveler",hat:"",hand:""},state.equipped||{});
  const save=()=>localStorage.setItem(STORE,JSON.stringify(state));
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
  const norm=s=>String(s||"").toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/[^a-z0-9]/g,"");
  let currentMap=1,currentStage=null,session=[],cursor=0,score=0,revealed=false,selected=null,modalScreen="maps";
  const bank=Array.isArray(api.questionBank)?api.questionBank:[];
  // Audio is generated locally with Web Audio; no external files or network calls.
  let audioCtx=null,musicTimer=null,musicOn=false,musicStep=0;
  const musicNotes=[196,246.94,293.66,369.99,293.66,246.94,220,293.66];
  function getAudio(){
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return null;
    if(!audioCtx)audioCtx=new Ctx();
    if(audioCtx.state==='suspended')audioCtx.resume();
    return audioCtx;
  }
  function tone(freq,duration=.22,volume=.045,wave='sine'){
    const ctx=getAudio();if(!ctx)return;
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type=wave;osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume,ctx.currentTime+.025);
    gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);
    osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+duration+.03);
  }
  function correctChime(){if(window.SMARTLIFEAudio){window.SMARTLIFEAudio.correct();return;}tone(659.25,.16,.055);setTimeout(()=>tone(880,.24,.045),95);}
  function musicBeat(){const n=musicNotes[musicStep++%musicNotes.length];tone(n,1.05,.012,'sine');if(musicStep%2===0)setTimeout(()=>tone(n/2,.9,.008,'triangle'),100);}
  function setMusic(on){
    musicOn=!!on;
    if(window.SMARTLIFEAudio)window.SMARTLIFEAudio.setMusic(musicOn);
    else{localStorage.setItem('smartLife_v7_music',musicOn?'1':'0');if(musicTimer){clearInterval(musicTimer);musicTimer=null;}if(musicOn){getAudio();musicBeat();musicTimer=setInterval(musicBeat,1250);}}
    const b=modal.querySelector('[data-v7-sound]');if(b)b.textContent=musicOn?'🔊 Tắt nhạc':'🎵 Bật nhạc';
  }
  const root=document.createElement("div");root.id="v7WorldRoot";
  const hub=$("#adventureHub");
  let matchSelectedQ=null,matchMatched=[],matchMessage="";
  const modal=document.createElement("div");modal.className="v7-modal";modal.hidden=true;
  modal.innerHTML='<div class="v7-window"><header class="v7-top"><div><span class="v7-kicker">SMART LIFE 7.0</span><h2>INFINITE ADVENTURE</h2></div><div class="v7-head-actions"><button class="v7-sound-toggle" type="button" data-v7-sound>🎵 Bật nhạc</button><button class="v7-close" type="button" aria-label="Đóng">×</button></div></header><div class="v7-body" id="v7Body"></div></div>';
  document.body.append(modal);
  const body=$("#v7Body");
  function avatarSVG(){
    const outfit=outfits.find(x=>x.id===state.equipped.outfit)||outfits[0],hat=state.equipped.hat,hand=state.equipped.hand;
    const hatSVG=hat==="cap"?'<path d="M67 54 Q100 25 133 54 L142 62 L58 62 Z" fill="#e0a33a"/><path d="M70 60 Q100 72 143 61" stroke="#8c5524" stroke-width="7" fill="none"/>':hat==="wizard"?'<path d="M72 56 L100 12 L128 56 Z" fill="#6848a7"/><ellipse cx="100" cy="57" rx="43" ry="9" fill="#3f2c70"/>':hat==="crown"?'<path d="M65 57 L72 28 L91 47 L101 19 L113 47 L132 28 L138 58 Z" fill="#e7b934" stroke="#9b6b11" stroke-width="4"/>':"";
    const handSVG=hand==="book"?'<g transform="rotate(-15 148 155)"><rect x="137" y="126" width="27" height="38" rx="3" fill="#f3e4b9" stroke="#704b2c" stroke-width="3"/><path d="M150 127 V163" stroke="#704b2c" stroke-width="2"/></g>':hand==="wand"?'<path d="M143 166 L168 115" stroke="#754b2c" stroke-width="7" stroke-linecap="round"/><path d="M168 110 L173 99 L178 110 L189 114 L178 119 L173 131 L168 119 L157 114 Z" fill="#ffe27a"/>':hand==="lantern"?'<g><path d="M147 125 Q160 106 173 125" fill="none" stroke="#754b2c" stroke-width="4"/><rect x="145" y="126" width="30" height="38" rx="7" fill="#f4c85b" stroke="#754b2c" stroke-width="4"/><path d="M160 132 V158" stroke="#fff3bf" stroke-width="4"/></g>':hand==="flag"?'<path d="M150 176 L150 103" stroke="#754b2c" stroke-width="5"/><path d="M153 106 L190 117 L153 130 Z" fill="#e55c5c"/>':"";
    return `<svg viewBox="0 0 210 230" role="img" aria-label="Nhân vật với trang bị đã chọn"><ellipse cx="103" cy="215" rx="54" ry="9" fill="#17233d" opacity=".16"/><path d="M83 158 L78 205 L98 205 L105 164 M117 158 L124 205 L144 205 L137 153" fill="#344b69" stroke="#1e3048" stroke-width="5" stroke-linejoin="round"/><path d="M69 92 Q52 104 57 153 L77 163 L91 130 M132 92 Q151 104 149 150 L132 162 L119 128" fill="${outfit.color}" stroke="#24354b" stroke-width="5" stroke-linejoin="round"/><path d="M70 93 Q100 75 132 93 L143 158 Q104 181 60 158 Z" fill="${outfit.color}" stroke="#24354b" stroke-width="5"/><path d="M84 102 L100 119 L117 102" fill="none" stroke="#f7e6c6" stroke-width="5"/><circle cx="101" cy="68" r="34" fill="#efc39d" stroke="#815c4a" stroke-width="4"/><path d="M75 65 Q80 29 108 34 Q133 36 135 64 Q116 49 98 52 Q85 54 75 65" fill="#49372f"/><circle cx="89" cy="70" r="3.5" fill="#28364a"/><circle cx="113" cy="70" r="3.5" fill="#28364a"/><path d="M91 84 Q101 92 112 84" fill="none" stroke="#9b554b" stroke-width="3" stroke-linecap="round"/>${hatSVG}<path d="M57 118 Q42 133 52 151" stroke="#efc39d" stroke-width="12" stroke-linecap="round" fill="none"/><path d="M146 118 Q160 130 153 151" stroke="#efc39d" stroke-width="12" stroke-linecap="round" fill="none"/>${handSVG}<path d="M69 204 L99 204 M124 204 L146 204" stroke="#263b59" stroke-width="9" stroke-linecap="round"/></svg>`;
  }
  function showMaps(){
    modalScreen="maps";
    body.innerHTML=`<div class="v7-toolbar"><p>Hoàn thành 4 màn chơi liên môn để mở trận Boss. Chiến thắng Boss sẽ mở bản đồ tiếp theo.</p><button data-v7="character">🧍 Nhân vật</button><button data-v7="shop">🛍️ Cửa hàng</button></div><div class="v7-mapgrid">${maps.map(m=>{const open=m.id<=state.unlocked,done=state.bosses.includes(m.id);return `<button class="v7-map v7-${m.theme} ${open?"":"locked"}" data-map="${m.id}" ${open?"":"disabled"}><span class="v7-map-emoji">${m.emoji}</span><b>BẢN ĐỒ ${m.id}</b><strong>${m.name}</strong><small>${done?"👑 Đã đánh bại Boss":open?m.subtitle:"🔒 Chưa mở khóa"}</small><i>${Object.keys(state.completed[m.id]||{}).length}/4 màn</i></button>`;}).join("")}</div><p class="v7-footnote">Các môn học được trộn trong cùng một hành trình: Toán · Ngữ văn · Tiếng Anh · Khoa học · Lịch sử · Địa lí.</p>`;
  }
  function showStages(id){
    currentMap=id;modalScreen="stages";const m=maps[id-1],done=state.completed[id]||{};
    body.innerHTML=`<div class="v7-world-banner v7-${m.theme}"><span>${m.emoji}</span><div><small>BẢN ĐỒ ${id}</small><h3>${m.name}</h3><p>${m.subtitle}</p></div></div><div class="v7-stagegrid">${stages.map((s,i)=>`<button type="button" class="v7-stage ${done[s.id]?"done":""}" data-stage="${s.id}"><span>${s.icon}</span><b>Màn ${i+1}: ${s.name}</b><small>${s.desc}</small><em>${done[s.id]?"✓ Đã hoàn thành":"+5 XP · +5 xu"}</em></button>`).join("")}</div><div class="v7-boss ${state.bosses.includes(id)?"done":""}"><div><span>👑</span><div><b>Boss bản đồ ${id}</b><small>${Object.keys(done).length===4?"Đã sẵn sàng đối đầu":"Hoàn thành 4 màn trước để mở khóa"}</small></div></div><button data-stage="boss" ${Object.keys(done).length<4?"disabled":""}>${state.bosses.includes(id)?"Đánh lại Boss":"Thách đấu Boss"}</button></div><button class="v7-back" data-v7="maps">← Trở về bản đồ</button>`;
  }
  function pickQuestions(count){
    let pool=bank.filter(q=>!state.history.includes(q.id));
    if(pool.length<count){state.history=[];pool=[...bank];}
    const selected=shuffle(pool).slice(0,count);selected.forEach(q=>state.history.push(q.id));state.history=state.history.slice(-420);save();return selected;
  }
  function beginStage(stageId){
    const valid=stageId==="boss"||stages.some(s=>s.id===stageId);
    if(!valid){alert("Màn chơi này chưa sẵn sàng. Hãy chọn lại một màn nhé!");return;}
    if(stageId==="boss"&&Object.keys(state.completed[currentMap]||{}).length<4){alert("Bạn cần hoàn thành đủ 4 màn trước khi đấu Boss.");return;}
    if(!bank.length){body.innerHTML='<div class="v7-result"><h3>Chưa tải được ngân hàng câu hỏi</h3><p>Hãy tải lại ứng dụng và thử lại.</p><button class="v7-back" data-v7="stages">Quay lại</button></div>';return;}
    currentStage=stageId;cursor=0;score=0;revealed=false;selected=null;matchSelectedQ=null;matchMatched=[];matchMessage="";
    const count=stageId==="boss"?10:stageId==="match"?4:5;session=pickQuestions(count);
    if(session.length<count){body.innerHTML='<div class="v7-result"><h3>Chưa đủ câu hỏi</h3><p>Ngân hàng câu hỏi hiện chưa đủ cho màn này.</p><button class="v7-back" data-v7="stages">Quay lại</button></div>';return;}
    modalScreen="play";renderQuestion();
  }
  function renderQuestion(){
    const q=session[cursor],boss=currentStage==="boss",type=boss?"quiz":stages.find(s=>s.id===currentStage).kind;
    let task="";
    if(type==="flash"){
      task=`<div class="v7-flashcard"><small>${esc(q.subjectName)} · Thẻ ${cursor+1}/${session.length}</small><h3>${esc(q.q)}</h3>${revealed?`<div class="v7-answer">${esc(q.answer)}<p>${esc(q.explain)}</p></div><div class="v7-flash-actions"><button data-action="flash-remember">Mình đã nhớ ✓</button><button data-action="next">Cần ôn lại · Thẻ tiếp theo</button></div>`:`<button data-action="reveal">Lật thẻ xem đáp án</button>`}</div>`;
    } else if(type==="fill"){
      task=`<div class="v7-question"><small>${esc(q.subjectName)} · ${cursor+1}/${session.length}</small><h3>${esc(q.q)}</h3><form id="v7FillForm"><input id="v7FillAnswer" autocomplete="off" placeholder="Nhập câu trả lời..." required/><button class="v7-primary">Kiểm tra</button></form><div id="v7Feedback"></div></div>`;
    } else {
      const opts=shuffle([q.answer,...q.options.filter(x=>x!==q.answer).slice(0,3)]);
      if(type==="match"){
        const answers=shuffle(session);
        task=`<div class="v7-question v7-match-game"><small>Ghép đôi kiến thức · ${matchMatched.length}/${session.length} cặp đúng</small><p class="v7-match-label">Chọn một câu hỏi bên trái, sau đó chọn đáp án tương ứng bên phải.</p><div class="v7-pair-columns"><div><b class="v7-column-title">CÂU HỎI</b>${session.map((item,i)=>`<button class="v7-pair-card ${matchMatched.includes(item.id)?"matched":""} ${matchSelectedQ===item.id?"selected":""}" data-match-left="${esc(item.id)}" ${matchMatched.includes(item.id)?"disabled":""}>${i+1}. ${esc(item.q)}</button>`).join("")}</div><div><b class="v7-column-title">ĐÁP ÁN</b>${answers.map((item,i)=>`<button class="v7-pair-card answer ${matchMatched.includes(item.id)?"matched":""}" data-match-right="${esc(item.id)}" ${matchMatched.includes(item.id)?"disabled":""}>${String.fromCharCode(65+i)}. ${esc(item.answer)}</button>`).join("")}</div></div><div class="v7-match-status">${matchMessage||"Mỗi cặp đúng sẽ được đánh dấu hoàn thành."}</div>${matchMatched.length===session.length?`<button class="v7-primary" data-action="finish-match">Hoàn thành màn ghép đôi →</button>`:""}</div>`;
      }else{
        task=`<div class="v7-question"><small>${esc(q.subjectName)} · ${cursor+1}/${session.length}</small><h3>${esc(q.q)}</h3><div class="v7-options">${opts.map((a,i)=>`<button data-option="${esc(a)}">${String.fromCharCode(65+i)}. ${esc(a)}</button>`).join("")}</div><div id="v7Feedback"></div></div>`;
      }
    }
    body.innerHTML=`<div class="v7-playhead"><button data-v7="stages">← Thoát màn</button><b>${boss?"👑 BOSS CHALLENGE":stages.find(s=>s.id===currentStage).name}</b><span>${cursor+1}/${session.length} · Đúng ${score}</span></div><div class="v7-progress"><i style="width:${cursor/session.length*100}%"></i></div>${task}<p class="v7-tip">Mỗi màn có câu hỏi liên môn được chọn ngẫu nhiên. Hãy đọc kỹ câu hỏi trước khi trả lời.</p>`;
  }
  function feedback(correct,detail){
    const el=$("#v7Feedback");if(el)el.innerHTML=`<div class="v7-feedback ${correct?"good":"bad"}"><b>${correct?"✓ Chính xác!":"Chưa chính xác."}</b><p>${esc(detail)}</p><button data-action="next">Câu tiếp theo →</button></div>`;
  }
  function finishStage(){
    const boss=currentStage==="boss",passed=score/session.length>=.7;
    if(boss){
      if(passed){
        if(!state.bosses.includes(currentMap)){state.bosses.push(currentMap);api.awardXP(25,`Chiến thắng Boss bản đồ ${currentMap}`,30);}
        state.unlocked=Math.max(state.unlocked,Math.min(5,currentMap+1));
        const bonus=shuffle(allItems.filter(x=>!state.owned.includes(x.id)))[0];
        if(bonus){state.owned.push(bonus.id);state.lastDrop=bonus.name;}
        save();
        body.innerHTML=`<div class="v7-result win"><div>🏆</div><h3>ĐÁNH BẠI BOSS!</h3><p>${score}/${session.length} câu đúng. Bản đồ tiếp theo đã được mở khóa!</p><strong>+25 XP · +30 xu${bonus?` · Vật phẩm: ${esc(bonus.name)}`:""}</strong><button class="v7-primary" data-v7="maps">Tiếp tục hành trình</button></div>`;
      }else{
        api.awardXP(5,"Nỗ lực thách đấu Boss",2);
        body.innerHTML=`<div class="v7-result"><div>🛡️</div><h3>Boss vẫn còn thử thách!</h3><p>Bạn đạt ${score}/${session.length}. Cần ít nhất 70% câu đúng để chiến thắng. Hãy ôn tập rồi thử lại nhé.</p><button class="v7-primary" data-stage="boss">Thử thách lại</button><button class="v7-back" data-v7="stages">Quay lại các màn chơi</button></div>`;
      }
      return;
    }
    const wasDone=!!(state.completed[currentMap]&&state.completed[currentMap][currentStage]);
    state.completed[currentMap]=state.completed[currentMap]||{};
    state.completed[currentMap][currentStage]=true;save();
    if(!wasDone)api.awardXP(5,`Hoàn thành ${stages.find(s=>s.id===currentStage).name}`,5);
    body.innerHTML=`<div class="v7-result win"><div>✨</div><h3>Hoàn thành màn chơi!</h3><p>Bạn trả lời đúng ${score}/${session.length} câu.</p><strong>${wasDone?"Màn đã hoàn thành trước đó":"+5 XP · +5 xu"}</strong><button class="v7-primary" data-v7="stages">Về bản đồ</button></div>`;
  }
  function showCharacter(){
    modalScreen="character";
    const equipped=state.equipped;
    body.innerHTML=`<div class="v7-toolbar"><button data-v7="maps">← Bản đồ</button><button data-v7="shop">🛍️ Cửa hàng</button></div><div class="v7-character-layout"><div class="v7-character-card"><div class="v7-avatar-stage">${avatarSVG()}</div><h3>${esc(state.name)}</h3><p>Trang bị hiện tại</p><small>Áo: ${esc((allItems.find(x=>x.id===equipped.outfit)||outfits[0]).name)} · Mũ: ${esc((allItems.find(x=>x.id===equipped.hat)||{}).name||"Chưa đội")} · Tay: ${esc((allItems.find(x=>x.id===equipped.hand)||{}).name||"Tay trống")}</small></div><div class="v7-equipment"><h3>🎒 Túi đồ</h3>${allItems.filter(x=>state.owned.includes(x.id)).map(x=>`<div class="v7-item"><span>${x.emoji||"👕"}</span><b>${esc(x.name)}</b><button data-equip="${x.id}">${equipped[x.slot]===x.id?"Đang dùng":"Trang bị"}</button></div>`).join("")||"<p>Chưa có vật phẩm.</p>"}</div></div>`;
  }
  function showShop(){
    modalScreen="shop";
    body.innerHTML=`<div class="v7-toolbar"><button data-v7="maps">← Bản đồ</button><button data-v7="character">🧍 Nhân vật</button><b>🪙 Xu hiện có: ${api.getCoins()}</b></div><div class="v7-shopgrid">${allItems.map(x=>`<article class="v7-shopitem"><span>${x.emoji||"👕"}</span><b>${esc(x.name)}</b><small>${x.slot==="outfit"?"Trang phục":x.slot==="hat"?"Mũ đội đầu":"Vật phẩm cầm tay"}</small><button data-buy="${x.id}" ${state.owned.includes(x.id)?"disabled":""}>${state.owned.includes(x.id)?"Đã sở hữu":`Mua · ${x.price} xu`}</button></article>`).join("")}</div><p class="v7-footnote">Vật phẩm mua bằng xu trong trò chơi; một số món còn có thể nhận khi chiến thắng Boss.</p>`;
  }
  hub?.addEventListener("click",e=>{if(e.target.closest("#v7Launch")){modal.hidden=false;showMaps();}});
  modal.querySelector(".v7-close").addEventListener("click",()=>modal.hidden=true);
  modal.querySelector('[data-v7-sound]').addEventListener('click',()=>setMusic(!(window.SMARTLIFEAudio?.isMusicOn?.()??musicOn)));
  if(localStorage.getItem('smartLife_v7_music')==='1'){
    // Respect browser autoplay rules: show the enabled preference but wait for a tap to resume audio.
    musicOn=false;
  }
  modal.addEventListener("click",e=>{
    const map=e.target.closest("[data-map]");if(map){if(!map.disabled)showStages(Number(map.dataset.map));return;}
    const stage=e.target.closest("[data-stage]");if(stage){if(!stage.disabled)beginStage(stage.dataset.stage);return;}
    const nav=e.target.closest("[data-v7]");if(nav){if(nav.dataset.v7==="maps")showMaps();else if(nav.dataset.v7==="stages")showStages(currentMap);else if(nav.dataset.v7==="character")showCharacter();else if(nav.dataset.v7==="shop")showShop();return;}
    const matchLeft=e.target.closest("[data-match-left]");if(matchLeft){if(!matchMatched.includes(matchLeft.dataset.matchLeft)){matchSelectedQ=matchLeft.dataset.matchLeft;matchMessage="Đã chọn câu hỏi. Hãy chọn đáp án tương ứng.";renderQuestion();}return;}
    const matchRight=e.target.closest("[data-match-right]");if(matchRight){if(!matchSelectedQ){matchMessage="Hãy chọn một câu hỏi trước nhé.";renderQuestion();return;}if(matchSelectedQ===matchRight.dataset.matchRight){matchMatched.push(matchSelectedQ);score++;matchSelectedQ=null;matchMessage="✓ Ghép chính xác! Tiếp tục tìm các cặp còn lại.";correctChime();}else{matchMessage="Chưa khớp rồi. Hãy thử một đáp án khác nhé.";window.SMARTLIFEAudio?.wrong();}renderQuestion();return;}
    const finishMatch=e.target.closest('[data-action="finish-match"]');if(finishMatch){finishStage();return;}
    const reveal=e.target.closest('[data-action="reveal"]');if(reveal){revealed=true;renderQuestion();return;}
    const remember=e.target.closest('[data-action="flash-remember"]');if(remember){score++;correctChime();cursor++;revealed=false;if(cursor>=session.length)finishStage();else renderQuestion();return;}
    const next=e.target.closest('[data-action="next"]');if(next){cursor++;revealed=false;if(cursor>=session.length)finishStage();else renderQuestion();return;}
    const option=e.target.closest("[data-option]");if(option){const q=session[cursor],correct=option.dataset.option===q.answer;if(correct){score++;correctChime();}else{window.SMARTLIFEAudio?.wrong();}modal.querySelectorAll("[data-option]").forEach(b=>b.disabled=true);feedback(correct,`${q.answer} — ${q.explain}`);return;}
    const equip=e.target.closest("[data-equip]");if(equip){const item=allItems.find(x=>x.id===equip.dataset.equip);if(item&&state.owned.includes(item.id)){state.equipped[item.slot]=item.id;save();showCharacter();}return;}
    const buy=e.target.closest("[data-buy]");if(buy){const item=allItems.find(x=>x.id===buy.dataset.buy);if(!item||state.owned.includes(item.id))return;buy.disabled=true;(async()=>{const ok=await api.spendCoins(item.price);if(!ok){buy.disabled=false;alert("Không thể thanh toán. Hãy kiểm tra số dư và kết nối tài khoản nhé!");return;}state.owned.push(item.id);save();showShop();})();return;}
  },true);
  modal.addEventListener("submit",e=>{
    if(e.target.id!=="v7FillForm")return;
    e.preventDefault();const q=session[cursor],value=$("#v7FillAnswer").value.trim(),correct=norm(value)===norm(q.answer);
    if(correct){score++;correctChime();}else{window.SMARTLIFEAudio?.wrong();}
    feedback(correct,`${q.answer} — ${q.explain}`);
  });
  // Flashcards now include explicit self-assessment controls in their own markup.
  save();
})();