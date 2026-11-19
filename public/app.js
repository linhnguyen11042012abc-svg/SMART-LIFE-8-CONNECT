const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const STORE = "smartLife_v1";
const state = {
  tasks: [], notes: [], reminders: [], usage: [], posts: [],
  chat: [], quizIndex: 0, quizAnswered: false
};
const starterTasks = [
  { id: 1, text: "Ôn lại bài học hôm nay", done: false },
  { id: 2, text: "Chuẩn bị sách vở cho ngày mai", done: false }
];
const quiz = [
  { q: "Cây xanh hấp thụ khí nào trong quá trình quang hợp?", a: ["Oxygen (O₂)", "Carbon dioxide (CO₂)", "Nitrogen (N₂)", "Hydrogen (H₂)"], correct: 1, explain: "Cây xanh hấp thụ carbon dioxide và nước, sử dụng năng lượng ánh sáng để tạo chất hữu cơ." },
  { q: "Hành động nào giúp tiết kiệm điện trong gia đình?", a: ["Bật đèn ở phòng trống", "Để thiết bị chạy cả ngày", "Tắt thiết bị khi không sử dụng", "Mở tủ lạnh liên tục"], correct: 2, explain: "Tắt thiết bị khi không sử dụng giúp hạn chế điện năng tiêu thụ." },
  { q: "Khi chia sẻ hoạt động cộng đồng trên mạng, điều nào nên làm?", a: ["Đăng thông tin riêng tư của người khác", "Kiểm tra thông tin và tôn trọng mọi người", "Chia sẻ tin chưa xác minh", "Dùng lời lẽ xúc phạm"], correct: 1, explain: "Kiểm tra thông tin và tôn trọng quyền riêng tư giúp xây dựng cộng đồng an toàn." }
];

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "{}");
    for (const key of Object.keys(state)) {
      if (Array.isArray(saved[key])) state[key] = saved[key];
    }
  } catch { /* Bỏ qua dữ liệu hỏng và dùng dữ liệu mặc định. */ }
  if (!state.tasks.length) state.tasks = starterTasks;
  saveData();
}
function saveData() {
  localStorage.setItem(STORE, JSON.stringify({
    tasks: state.tasks, notes: state.notes, reminders: state.reminders,
    usage: state.usage, posts: state.posts, chat: state.chat
  }));
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[ch]));
}
let toastTimer;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
}
const pageNames = {home:"Tổng quan",study:"Góc học tập",family:"Trợ lý gia đình",community:"Kết nối cộng đồng",ai:"AI hỗ trợ thông minh"};
function navigate(page) {
  if (!pageNames[page]) return;
  $$(".page").forEach(el => el.classList.toggle("active", el.id === `page-${page}`));
  $$(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.page === page));
  $("#currentCrumb").textContent = pageNames[page];
  $("#sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
}
$$("[data-page]").forEach(btn => btn.addEventListener("click", e => {
  e.preventDefault(); navigate(btn.dataset.page);
}));
$$("[data-go]").forEach(btn => btn.addEventListener("click", () => navigate(btn.dataset.go)));
$("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

function renderTasks() {
  const html = state.tasks.map(task => `
    <label class="task-row ${task.done ? "done" : ""}">
      <input type="checkbox" data-task="${task.id}" ${task.done ? "checked" : ""}/>
      <span class="task-text">${escapeHTML(task.text)}</span>
      <button type="button" class="delete-btn" data-delete-task="${task.id}">Xóa</button>
    </label>`).join("") || `<div class="empty-state">Chưa có công việc nào.</div>`;
  $("#taskList").innerHTML = html;
  $("#homeTasks").innerHTML = html;
}
document.addEventListener("change", e => {
  if (e.target.matches("[data-task]")) {
    const task = state.tasks.find(t => t.id === Number(e.target.dataset.task));
    if (task) task.done = e.target.checked;
    saveData(); renderTasks();
  }
});
document.addEventListener("click", e => {
  const id = e.target.dataset.deleteTask;
  if (id) {
    state.tasks = state.tasks.filter(t => t.id !== Number(id));
    saveData(); renderTasks();
  }
});
$("#taskForm").addEventListener("submit", e => {
  e.preventDefault();
  const text = $("#taskInput").value.trim();
  if (!text) return;
  state.tasks.unshift({id:Date.now(),text,done:false});
  $("#taskInput").value = ""; saveData(); renderTasks(); toast("Đã thêm công việc.");
});

function renderNotes() {
  $("#noteList").innerHTML = state.notes.map(note => `
    <div class="note-item"><div style="display:flex;align-items:center"><strong>${escapeHTML(note.title)}</strong><button class="delete-btn" data-delete-note="${note.id}">Xóa</button></div>
    <p>${escapeHTML(note.body)}</p><span class="note-meta">${escapeHTML(note.date)}</span></div>`).join("") || `<div class="empty-state">Ghi chú đã lưu sẽ xuất hiện tại đây.</div>`;
}
$("#noteForm").addEventListener("submit", e => {
  e.preventDefault();
  state.notes.unshift({id:Date.now(),title:$("#noteTitle").value.trim(),body:$("#noteBody").value.trim(),date:new Date().toLocaleDateString("vi-VN")});
  $("#noteForm").reset(); saveData(); renderNotes(); toast("Đã lưu ghi chú.");
});
document.addEventListener("click", e => {
  const id = e.target.dataset.deleteNote;
  if (id) { state.notes = state.notes.filter(n => n.id !== Number(id)); saveData(); renderNotes(); }
});

function renderQuiz() {
  const item = quiz[state.quizIndex % quiz.length];
  $("#quizArea").innerHTML = `<div class="quiz-question">${state.quizIndex + 1}. ${item.q}</div>
    <div class="quiz-options">${item.a.map((answer,i)=>`<button class="quiz-option" data-answer="${i}" ${state.quizAnswered?"disabled":""}>${String.fromCharCode(65+i)}. ${answer}</button>`).join("")}</div>
    <div id="quizFeedback" class="quiz-feedback">${state.quizAnswered ? item.explain : ""}</div>
    <button class="text-btn" id="nextQuiz" style="margin-top:12px">${state.quizAnswered ? "Câu tiếp theo →" : "Bỏ qua câu này →"}</button>`;
  $$("#quizArea [data-answer]").forEach(btn => btn.addEventListener("click", () => {
    if (state.quizAnswered) return;
    state.quizAnswered = true;
    const correct = Number(btn.dataset.answer) === item.correct;
    $$("#quizArea [data-answer]").forEach((option,i) => {
      option.style.borderColor = i === item.correct ? "#6bb48c" : "";
      option.style.background = i === item.correct ? "#edf8f1" : "";
    });
    $("#quizFeedback").textContent = (correct ? "Chính xác! " : "Chưa đúng. ") + item.explain;
    state.quizAnswered = true;
    $("#nextQuiz").textContent = "Câu tiếp theo →";
  }));
  $("#nextQuiz").addEventListener("click", () => { state.quizIndex++; state.quizAnswered=false; renderQuiz(); });
}

function renderReminders() {
  $("#reminderList").innerHTML = state.reminders.map(r=>`<div class="task-row"><span>◷</span><span class="task-text">${escapeHTML(r.text)} <small style="color:#96a4b1">• ${escapeHTML(r.date)}</small></span><button class="delete-btn" data-delete-reminder="${r.id}">Xóa</button></div>`).join("") || `<div class="empty-state">Chưa có lời nhắc nào.</div>`;
}
$("#reminderForm").addEventListener("submit", e => {
  e.preventDefault();
  state.reminders.unshift({id:Date.now(),text:$("#reminderText").value.trim(),date:$("#reminderDate").value});
  $("#reminderForm").reset(); saveData(); renderReminders(); toast("Đã tạo lời nhắc.");
});
document.addEventListener("click", e => {
  const id = e.target.dataset.deleteReminder;
  if (id) { state.reminders=state.reminders.filter(r=>r.id!==Number(id)); saveData(); renderReminders(); }
});

function renderUsage() {
  const electric = state.usage.filter(x=>x.type==="Điện").reduce((s,x)=>s+x.value,0);
  const water = state.usage.filter(x=>x.type==="Nước").reduce((s,x)=>s+x.value,0);
  $("#usageSummary").innerHTML = `<div class="usage-chip"><small>Tổng điện đã ghi</small><strong>${electric.toLocaleString("vi-VN")} <small>kWh</small></strong></div><div class="usage-chip"><small>Tổng nước đã ghi</small><strong>${water.toLocaleString("vi-VN")} <small>m³</small></strong></div>`;
}
$("#usageForm").addEventListener("submit", e => {
  e.preventDefault();
  const value = Number($("#usageValue").value);
  if (!Number.isFinite(value) || value < 0) return toast("Vui lòng nhập số liệu hợp lệ.");
  state.usage.push({type:$("#usageType").value,value});
  $("#usageValue").value=""; saveData(); renderUsage(); toast("Đã lưu số liệu.");
});

function renderPosts() {
  $("#postList").innerHTML = state.posts.map(p=>`<article class="post-item"><span class="post-category">${escapeHTML(p.category)}</span><div style="display:flex;align-items:center"><strong>${escapeHTML(p.title)}</strong><button class="delete-btn" data-delete-post="${p.id}">Xóa</button></div><p>${escapeHTML(p.body)}</p><span class="note-meta">${escapeHTML(p.date)}</span></article>`).join("") || `<div class="empty-state">Chưa có hoạt động nào. Hãy chia sẻ ý tưởng tích cực đầu tiên!</div>`;
}
$("#postForm").addEventListener("submit", e => {
  e.preventDefault();
  state.posts.unshift({id:Date.now(),title:$("#postTitle").value.trim(),category:$("#postCategory").value,body:$("#postBody").value.trim(),date:new Date().toLocaleDateString("vi-VN")});
  $("#postForm").reset(); saveData(); renderPosts(); toast("Đã đăng lên bảng hoạt động trên thiết bị này.");
});
document.addEventListener("click", e => {
  const id = e.target.dataset.deletePost;
  if (id) { state.posts=state.posts.filter(p=>p.id!==Number(id)); saveData(); renderPosts(); }
});

function addMessage(role, content) {
  state.chat.push({role,content});
  const el = document.createElement("div");
  el.className = `message ${role}`;
  const avatar = document.createElement("div"); avatar.className="message-avatar"; avatar.textContent=role==="user"?"●":"✦";
  const bubble = document.createElement("div"); bubble.className="bubble"; bubble.textContent=content;
  el.append(avatar,bubble); $("#chatMessages").append(el);
  $("#chatMessages").scrollTop = $("#chatMessages").scrollHeight;
  saveData();
}
function renderChat() {
  const box=$("#chatMessages");
  box.innerHTML="";
  const initial = document.createElement("div");
  initial.className="message assistant";
  initial.innerHTML='<div class="message-avatar">✦</div><div class="bubble"><strong>Xin chào! Mình là SMART AI.</strong><br/>Bạn có thể hỏi mình về bài học, nhờ giải thích một kiến thức hoặc tìm ý tưởng sống xanh. Hôm nay mình có thể giúp gì cho bạn?</div>';
  box.append(initial);
  state.chat.forEach(m=>addMessageToDOM(m.role,m.content));
}
function addMessageToDOM(role,content) {
  const el=document.createElement("div");el.className=`message ${role}`;
  const avatar=document.createElement("div");avatar.className="message-avatar";avatar.textContent=role==="user"?"●":"✦";
  const bubble=document.createElement("div");bubble.className="bubble";bubble.textContent=content;
  el.append(avatar,bubble);$("#chatMessages").append(el);
}
function localAIFallback(question){
  const q=String(question||"").toLocaleLowerCase("vi-VN");
  if(/chào|xin chào|hello|hi/.test(q))return "Xin chào! Mình là SMART AI. Bạn muốn học tập, lập kế hoạch hay tìm ý tưởng cho hoạt động gia đình và cộng đồng?";
  if(/kế hoạch|ôn tập|thời khóa biểu|lịch học/.test(q))return "Bạn hãy chia mục tiêu thành các việc nhỏ, ưu tiên nội dung khó, học theo phiên 25 phút và nghỉ ngắn 5 phút. Cuối ngày hãy đánh dấu phần đã hoàn thành.";
  if(/toán|phương trình|bài tập/.test(q))return "Bạn hãy gửi đầy đủ đề bài và lớp học. Mình sẽ cố gắng hướng dẫn từng bước theo nội dung mẫu ngoại tuyến.";
  if(/tiếng anh|english|ngữ pháp|từ vựng/.test(q))return "Bạn có thể luyện tiếng Anh theo 4 kỹ năng: Nghe, Đọc, Viết và Nói trong English Skill Tree ở Góc học tập.";
  if(/gia đình|việc nhà|tiết kiệm điện|tiết kiệm nước/.test(q))return "Hãy lập danh sách công việc, thống nhất người phụ trách và thời hạn; đồng thời tắt thiết bị khi không dùng và khóa vòi nước sau khi sử dụng.";
  if(/môi trường|sống xanh|rác thải/.test(q))return "Bạn có thể bắt đầu bằng việc mang bình nước cá nhân, phân loại rác theo hướng dẫn, tiết kiệm điện nước và chăm sóc cây xanh.";
  return "Mình đã nhận được câu hỏi. SMART AI hoạt động ngoại tuyến bằng bộ quy tắc và nội dung mẫu, nên chưa hiểu được mọi chủ đề. Bạn hãy thử hỏi về kế hoạch học tập, kiến thức phổ thông, tiếng Anh, gia đình hoặc sống xanh nhé.";
}
async function sendChat(question) {
  addMessage("user",question);
  const pending=document.createElement("div");pending.className="message assistant";pending.id="pendingReply";
  pending.innerHTML='<div class="message-avatar">✦</div><div class="bubble">SMART AI đang xử lý...</div>';
  $("#chatMessages").append(pending);$("#chatMessages").scrollTop=$("#chatMessages").scrollHeight;
  const sendButton=$("#chatForm .send-btn");if(sendButton)sendButton.disabled=true;
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
  try {
    const history=state.chat.slice(-9,-1);
    const response=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question,history}),signal:controller.signal});
    const data=await response.json();
    if(!response.ok) throw new Error(data.error||"Máy chủ chưa nhận được câu hỏi.");
    pending.remove();addMessage("assistant",data.answer||localAIFallback(question));
  } catch(error) {
    pending.remove();addMessage("assistant",localAIFallback(question)+"\n\n(Lưu ý: máy chủ AI chưa phản hồi; đây là câu trả lời dự phòng chạy ngay trên thiết bị.)");
  } finally {clearTimeout(timeout);if(sendButton)sendButton.disabled=false;}
}
$("#chatForm").addEventListener("submit",e=>{
  e.preventDefault();const input=$("#chatInput");const value=input.value.trim();if(!value)return;
  input.value="";sendChat(value);
});
$("#chatInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#chatForm").requestSubmit();}});
$$("[data-prompt]").forEach(btn=>btn.addEventListener("click",()=>{ $("#chatInput").value=btn.dataset.prompt;$("#chatInput").focus(); }));
$("#clearChat").addEventListener("click",()=>{state.chat=[];saveData();renderChat();toast("Đã xóa hội thoại trên thiết bị.");});

async function checkAIStatus() {
  try {
    const response=await fetch("/api/status");const data=await response.json();
    const status=$(".status-text");
    if(status) status.textContent=data.aiConfigured?"AI đã cấu hình":"Bản thử nghiệm";
  } catch {}
}

loadData();
renderTasks();renderNotes();renderQuiz();renderReminders();renderUsage();renderPosts();renderChat();checkAIStatus();
