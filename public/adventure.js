(() => {
  "use strict";
  const KEY = "smartLife_adventure_v2";
  const $ = s => document.querySelector(s);
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const shiftDate = (date, days) => {
    const d = new Date(`${date}T12:00:00`);
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const defaults = {
    xp: 0, coins: 0, claimedTasks: [], daily: { date: today(), quests: [], counts: {} },
    flashSeen: [], customCards: [], profile: { avatar: "🧙", name: "Nhà thám hiểm" },
    streak: 0, lastVisit: ""
  };
  let data;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    data = { ...defaults, ...saved };
    data.daily = { ...defaults.daily, ...(saved.daily || {}) };
    data.profile = { ...defaults.profile, ...(saved.profile || {}) };
  } catch { data = { ...defaults }; }
  if (!Array.isArray(data.claimedTasks)) data.claimedTasks = [];
  if (!Array.isArray(data.daily.quests)) data.daily.quests = [];
  if (!Array.isArray(data.flashSeen)) data.flashSeen = [];
  if (!Array.isArray(data.customCards)) data.customCards = [];
  if (!["🧙","🧑‍🚀","🦊","🐼","🐉","🧝"].includes(data.profile.avatar)) data.profile.avatar = "🧙";
  data.xp = Math.max(0, Number(data.xp) || 0);
  data.coins = Math.max(0, Number(data.coins) || 0);
  if (!data.daily.counts || typeof data.daily.counts !== "object") data.daily.counts = {};
  if (data.daily.date !== today()) data.daily = { date: today(), quests: [], counts: {}, xpEarned: 0 };
  if (data.lastVisit !== today()) {
    if (data.lastVisit === shiftDate(today(), -1)) data.streak = Number(data.streak || 0) + 1;
    else if (Array.isArray(data.inventory) && data.inventory.includes("shield") && Number(data.streak || 0) > 0) data.inventory.splice(data.inventory.indexOf("shield"), 1);
    else data.streak = 1;
    data.lastVisit = today();
  }
  const save = () => {
    let latest = {}; try { latest = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch {}
    const merged = { ...data, ...latest };
    merged.xp = Math.max(Number(data.xp)||0, Number(latest.xp)||0);
    merged.coins = Math.max(Number(data.coins)||0, Number(latest.coins)||0);
    merged.daily = { ...(data.daily||{}), ...(latest.daily||{}),
      quests: [...new Set([...(data.daily?.quests||[]), ...(latest.daily?.quests||[])])],
      counts: { ...(data.daily?.counts||{}), ...(latest.daily?.counts||{}) },
      xpEarned: Math.max(Number(data.daily?.xpEarned)||0, Number(latest.daily?.xpEarned)||0) };
    const history = [...(Array.isArray(latest.xpHistory) ? latest.xpHistory : []), ...(Array.isArray(data.xpHistory) ? data.xpHistory : [])];
    merged.xpHistory = history.filter((item, index) => history.findIndex(other => other.at === item.at && other.reason === item.reason && other.amount === item.amount) === index).slice(-200);
    localStorage.setItem(KEY, JSON.stringify(merged));
  };
  const level = () => Math.floor(Number(data.xp || 0) / 100) + 1;
  const inLevel = () => Number(data.xp || 0) % 100;
  const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[ch]));
  const questInfo = [
    { id:"task", icon:"🧭", title:"Nhà thám hiểm chăm chỉ", desc:"Hoàn thành ít nhất một việc trong kế hoạch học tập." },
    { id:"quiz", icon:"🧠", title:"Thử thách trí tuệ", desc:"Trả lời đúng một câu hỏi trắc nghiệm." },
    { id:"note", icon:"📚", title:"Người lưu giữ tri thức", desc:"Tạo một ghi chú kiến thức mới." }
  ];
  const builtInCards = [
    ["Quang hợp", "Quá trình cây xanh sử dụng ánh sáng để tạo chất hữu cơ từ nước và khí carbon dioxide."],
    ["Phân số", "Phân số biểu thị một hay nhiều phần bằng nhau của một đơn vị."],
    ["Từ vựng", "Học từ mới bằng cách đặt câu ví dụ và ôn tập cách quãng."],
    ["Sống xanh", "Tiết kiệm điện, nước và giảm rác thải là những hành động thiết thực."]
  ];
  const avatars = ["🧙","🧑‍🚀","🦊","🐼","🐉","🧝"];
  const achievements = () => [
    { icon:"🌟", title:"Bước chân đầu tiên", desc:"Tích lũy 5 XP", earned:data.xp >= 5 },
    { icon:"📖", title:"Người ham học", desc:"Đạt 100 XP", earned:data.xp >= 100 },
    { icon:"🗺️", title:"Nhà thám hiểm", desc:"Đạt 300 XP", earned:data.xp >= 300 },
    { icon:"🔥", title:"Chuỗi kiên trì", desc:"Duy trì 3 ngày liên tiếp", earned:data.streak >= 3 },
    { icon:"🃏", title:"Người tạo tri thức", desc:"Tạo 3 thẻ ghi nhớ", earned:data.customCards.length >= 3 },
    { icon:"💎", title:"Bậc thầy hành trình", desc:"Đạt 1.000 XP", earned:data.xp >= 1000 }
  ];
  function addXP(amount, reason) {
    try { const latest = JSON.parse(localStorage.getItem(KEY) || "{}"); data.xp = Math.max(data.xp, Number(latest.xp)||0); data.coins = Math.max(data.coins, Number(latest.coins)||0); data.daily.xpEarned = Math.max(Number(data.daily.xpEarned)||0, Number(latest.daily?.xpEarned)||0); } catch {}
    const cap = 100;
    const earned = Number(data.daily.xpEarned || 0);
    const granted = Math.max(0, Math.min(Number(amount) || 0, cap - earned));
    if (!granted) { if (window.toast) window.toast("Bạn đã đạt giới hạn 100 XP hôm nay. Ngày mai hãy tiếp tục nhé!"); return; }
    const coins = Math.max(1, Math.floor(granted / 5));
    data.xp += granted; data.coins += coins;
    data.daily.xpEarned = earned + granted;
    data.xpHistory = Array.isArray(data.xpHistory) ? data.xpHistory : [];
    data.xpHistory.unshift({date: today(), amount: granted, reason: String(reason || "Hoạt động học tập"), coins, at: new Date().toISOString()});
    data.xpHistory = data.xpHistory.slice(0, 150);
    save(); render();
    if (window.toast) window.toast(`+${granted} XP · +${coins} xu · ${reason}${granted < amount ? " (đã áp dụng giới hạn ngày)" : ""}`);
  }
  function markQuest(id) {
    if (data.daily.quests.includes(id)) return;
    data.daily.quests.push(id);
    addXP(10, "Hoàn thành nhiệm vụ ngày");
  }
  function countDaily(key, max) {
    const n = Number(data.daily.counts[key] || 0);
    if (n >= max) return false;
    data.daily.counts[key] = n + 1;
    save(); return true;
  }
  function render() {
    const hub = $("#adventureHub");
    if (!hub) return;
    const xp = inLevel();
    const worlds = [
      ["📖","Thư viện tri thức","Mở sẵn",true],
      ["🧪","Phòng thí nghiệm","Cần cấp 2",level() >= 2],
      ["🌳","Rừng khám phá","Cần cấp 3",level() >= 3],
      ["🏝️","Đảo sáng tạo","Cần cấp 4",level() >= 4],
      ["🏰","Lâu đài huyền thoại","Cần cấp 5",level() >= 5]
    ];
    const badgeHTML = achievements().map(b => `<div class="achievement-badge ${b.earned ? "earned" : "locked"}"><span>${b.icon}</span><strong>${b.title}</strong><small>${b.desc}</small><em>${b.earned ? "Đã đạt" : "Chưa mở khóa"}</em></div>`).join("");
    const avatarHTML = avatars.map(a => `<button type="button" class="avatar-choice ${data.profile.avatar === a ? "selected" : ""}" data-avatar="${a}" aria-label="Chọn nhân vật ${a}">${a}</button>`).join("");
    const cardHTML = builtInCards.map((c,i) => `<button type="button" class="flashcard" data-flash="${i}"><strong>${c[0]}</strong><span>Chạm để xem nội dung</span></button>`).join("") +
      data.customCards.map((c,i) => `<div class="custom-flash-wrap"><button type="button" class="flashcard custom-flash" data-custom-flash="${i}"><strong>${escapeHTML(c.front)}</strong><span>Thẻ của bạn · chạm để lật</span></button><button type="button" class="delete-flash" data-delete-flash="${i}" aria-label="Xóa thẻ">×</button></div>`).join("");
    hub.innerHTML = `
      <div class="game-profile-grid">
        <section class="adventure-card player-card">
          <span class="eyebrow">HỒ SƠ NHÀ THÁM HIỂM</span>
          <div class="player-identity"><div class="player-avatar">${data.profile.avatar}</div><div><h3>${escapeHTML(data.profile.name)}</h3><p>Cấp ${level()} · Người chơi SMART LIFE</p></div></div>
          <form id="playerNameForm" class="player-name-form"><input id="playerNameInput" maxlength="22" value="${escapeHTML(data.profile.name)}" aria-label="Tên nhân vật"/><button type="submit">Lưu tên</button></form>
          <div class="avatar-picker"><span>Chọn nhân vật</span><div>${avatarHTML}</div></div>
        </section>
        <div class="adventure-stats game-stat-grid">
          <div class="adventure-stat"><small>⭐ CẤP ĐỘ</small><strong>${level()}</strong></div>
          <div class="adventure-stat"><small>🏅 TỔNG XP</small><strong>${data.xp}</strong></div>
          <div class="adventure-stat"><small>🪙 XU</small><strong>${data.coins}</strong></div>
          <div class="adventure-stat"><small>🔥 CHUỖI NGÀY</small><strong>${data.streak}</strong></div>
        </div>
      </div>
      <div class="adventure-card xp-card">
        <div class="xp-line"><span>TIẾN ĐỘ CẤP ${level()}</span><span>${xp}/100 XP đến cấp tiếp theo</span></div>
        <div class="xp-track"><div class="xp-fill" style="width:${xp}%"></div></div>
        <p>Mỗi nhiệm vụ hoàn thành giúp bạn tích lũy kinh nghiệm và xu thưởng.</p>
      </div>
      <div class="adventure-section">
        <div class="adventure-section-head"><h3>🎯 Nhiệm vụ hôm nay</h3><span class="soft-tag">${data.daily.quests.length}/3 hoàn thành</span></div>
        <div class="quest-grid">${questInfo.map(q => {
          const done = data.daily.quests.includes(q.id);
          return `<div class="quest-card ${done ? "completed" : ""}"><span>${q.icon}</span><strong>${q.title}</strong><p>${q.desc}</p><button type="button" data-quest="${q.id}" ${done ? "disabled" : ""}>${done ? "✓ Đã hoàn thành" : "Nhận +10 XP"}</button></div>`;
        }).join("")}</div>
      </div>
      <div class="adventure-section">
        <div class="adventure-section-head"><h3>🗺️ Bản đồ thế giới</h3><span class="muted">Mở khóa bằng cấp độ</span></div>
        <div class="world-map game-world-map">${worlds.map(w => `<div class="world-tile ${w[3] ? "unlocked" : "locked"}"><span class="world-icon">${w[0]}</span><strong>${w[1]}</strong><small>${w[3] ? "✓ Đã mở khóa" : "🔒 " + w[2]}</small></div>`).join("")}</div>
      </div>
      <div class="adventure-section">
        <div class="adventure-section-head"><h3>🏆 Phòng thành tích</h3><span class="muted">${achievements().filter(b=>b.earned).length}/${achievements().length} huy hiệu</span></div>
        <div class="achievement-grid">${badgeHTML}</div>
      </div>
      <div class="adventure-section">
        <div class="adventure-section-head"><h3>🃏 Learning Studio · Thẻ ghi nhớ</h3><span class="muted">${builtInCards.length + data.customCards.length} thẻ</span></div>
        <div class="flashcard-row game-flashcards">${cardHTML}</div>
        <form id="customFlashcardForm" class="custom-card-form"><input id="flashFront" maxlength="70" placeholder="Mặt trước: Câu hỏi hoặc từ khóa" required/><textarea id="flashBack" rows="2" maxlength="300" placeholder="Mặt sau: Nội dung cần ghi nhớ" required></textarea><button type="submit">＋ Tạo thẻ mới</button></form>
        <p class="adventure-tip">Thẻ do bạn tạo được lưu trên thiết bị này. Hãy tự nhớ câu trả lời trước khi lật thẻ.</p>
      </div>`;
  }
  const hub = $("#adventureHub");
  if (hub) {
    hub.addEventListener("click", e => {
      const quest = e.target.closest("[data-quest]");
      if (quest) { markQuest(quest.dataset.quest); return; }
      const avatar = e.target.closest("[data-avatar]");
      if (avatar) { data.profile.avatar = avatar.dataset.avatar; save(); render(); return; }
      const remove = e.target.closest("[data-delete-flash]");
      if (remove) { data.customCards.splice(Number(remove.dataset.deleteFlash), 1); save(); render(); return; }
      const flash = e.target.closest("[data-flash]");
      if (flash) {
        const i = Number(flash.dataset.flash);
        const was = flash.classList.toggle("flipped");
        flash.querySelector("span").textContent = was ? builtInCards[i][1] : "Chạm để xem nội dung";
        return;
      }
      const custom = e.target.closest("[data-custom-flash]");
      if (custom) {
        const card = data.customCards[Number(custom.dataset.customFlash)];
        if (!card) return;
        const was = custom.classList.toggle("flipped");
        custom.querySelector("span").textContent = was ? card.back : "Thẻ của bạn · chạm để lật";
      }
    });
    hub.addEventListener("submit", e => {
      if (e.target.matches("#playerNameForm")) {
        e.preventDefault();
        const name = $("#playerNameInput").value.trim().slice(0,22);
        if (name) { data.profile.name = name; save(); render(); if (window.toast) window.toast("Đã lưu tên nhân vật."); }
      }
      if (e.target.matches("#customFlashcardForm")) {
        e.preventDefault();
        const front = $("#flashFront").value.trim();
        const back = $("#flashBack").value.trim();
        if (!front || !back) return;
        if (data.customCards.length >= 30) { if (window.toast) window.toast("Bộ thẻ đã đạt giới hạn 30 thẻ."); return; }
        data.customCards.push({front,back});
        e.target.reset(); save(); render();
        if (window.toast) window.toast("Đã tạo thẻ ghi nhớ mới!");
      }
    });
  }
  document.addEventListener("change", e => {
    if (e.target.matches("[data-task]") && e.target.checked) {
      const id = String(e.target.dataset.task);
      if (!data.claimedTasks.includes(id)) {
        data.claimedTasks.push(id);
        if (countDaily("taskXP", 5)) addXP(5, "Hoàn thành việc học");
        markQuest("task");
      }
    }
  });
  document.addEventListener("click", e => {
    if (e.target.matches("#quizArea [data-answer]")) {
      setTimeout(() => {
        const feedback = $("#quizFeedback");
        if (feedback && feedback.textContent.startsWith("Chính xác") && countDaily("quizXP", 5)) {
          addXP(5, "Trả lời đúng");
          markQuest("quiz");
        }
      }, 0);
    }
    const mission = e.target.closest("[data-community-mission]");
    if (mission) {
      const id = mission.dataset.communityMission;
      if (countDaily(`mission_${id}`, 1)) {
        addXP(5, "Hoàn thành nhiệm vụ cộng đồng");
        renderCommunityMissions();
      }
    }
  });
  document.addEventListener("submit", e => {
    if (e.target.matches("#noteForm")) {
      if (countDaily("noteXP", 2)) addXP(5, "Lưu ghi chú");
      markQuest("note");
    }
    if (e.target.matches("#postForm") && countDaily("communityXP", 1)) addXP(5, "Chia sẻ cộng đồng");
    if (e.target.matches("#reminderForm") && countDaily("reminderXP", 1)) addXP(5, "Tạo lời nhắc gia đình");
  });

  const communityMissions = [
    {id:"kindness",icon:"💛",title:"Lan tỏa lời tử tế",desc:"Gửi một lời động viên chân thành đến người thân hoặc bạn bè."},
    {id:"green",icon:"🌱",title:"Hành động xanh",desc:"Chăm sóc cây hoặc phân loại rác đúng cách."},
    {id:"knowledge",icon:"📚",title:"Chia sẻ tri thức",desc:"Chia sẻ một mẹo học tập hữu ích với bạn."}
  ];
  function renderCommunityMissions() {
    const board = $("#communityQuestBoard");
    if (!board) return;
    board.innerHTML = communityMissions.map(m => {
      const done = Number(data.daily.counts[`mission_${m.id}`] || 0) >= 1;
      return `<article class="community-quest ${done ? "completed" : ""}"><span>${m.icon}</span><strong>${m.title}</strong><p>${m.desc}</p><button type="button" data-community-mission="${m.id}" ${done ? "disabled" : ""}>${done ? "✓ Đã nhận +5 XP" : "Hoàn thành · +5 XP"}</button></article>`;
    }).join("");
  }

  let pomoMode = "focus";
  let pomoRemaining = 25 * 60;
  let pomoInterval = null;
  const pomoLength = () => pomoMode === "focus" ? 25 * 60 : 5 * 60;
  function renderPomo() {
    const clock = $("#pomodoroTime");
    if (!clock) return;
    const mm = String(Math.floor(pomoRemaining / 60)).padStart(2,"0");
    const ss = String(pomoRemaining % 60).padStart(2,"0");
    clock.textContent = `${mm}:${ss}`;
    const progress = $("#pomodoroProgress");
    if (progress) progress.style.width = `${100 * (1 - pomoRemaining / pomoLength())}%`;
    const status = $("#pomodoroStatus");
    if (status) status.textContent = pomoMode === "focus" ? "Tập trung vào một mục tiêu nhỏ nhé." : "Nghỉ ngắn, thư giãn mắt và vận động nhẹ.";
  }
  function stopPomo() { if (pomoInterval) clearInterval(pomoInterval); pomoInterval = null; }
  function startPomo() {
    if (pomoInterval) return;
    pomoInterval = setInterval(() => {
      pomoRemaining = Math.max(0, pomoRemaining - 1);
      renderPomo();
      if (pomoRemaining === 0) {
        stopPomo();
        if (pomoMode === "focus" && countDaily("pomoXP", 2)) addXP(10, "Hoàn thành phiên tập trung");
        if (window.toast) window.toast(pomoMode === "focus" ? "Hoàn thành phiên tập trung! Hãy nghỉ ngắn nhé." : "Đã hết giờ nghỉ. Sẵn sàng học tiếp!");
      }
    }, 1000);
  }
  $("#pomodoroStart")?.addEventListener("click", startPomo);
  $("#pomodoroPause")?.addEventListener("click", stopPomo);
  $("#pomodoroReset")?.addEventListener("click", () => { stopPomo(); pomoRemaining = pomoLength(); renderPomo(); });
  document.querySelectorAll("[data-pomo-mode]").forEach(btn => btn.addEventListener("click", () => {
    stopPomo(); pomoMode = btn.dataset.pomoMode; pomoRemaining = pomoLength();
    document.querySelectorAll("[data-pomo-mode]").forEach(b => b.classList.toggle("active", b === btn));
    renderPomo();
  }));

  document.body.classList.add("game-world");
  render(); renderCommunityMissions(); renderPomo(); save();
})();