(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const STORE = "smartLife_superWorld_v5";
  const safe = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));
  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORE) || "{}");
      return {
        best: Number(value.best) || 0,
        answered: Number(value.answered) || 0,
        correct: Number(value.correct) || 0,
        familyTasks: Array.isArray(value.familyTasks) ? value.familyTasks : [],
        communityDone: Array.isArray(value.communityDone) ? value.communityDone : []
      };
    } catch {
      return {best:0,answered:0,correct:0,familyTasks:[],communityDone:[]};
    }
  };
  const data = read();
  const save = () => localStorage.setItem(STORE, JSON.stringify(data));
  const bank = [
    {s:"Toán",q:"Giá trị của biểu thức 2² + 3² là:",a:["10","13","25","9"],c:1,e:"2² = 4 và 3² = 9, tổng là 13."},
    {s:"Toán",q:"Nếu 3x = 18 thì x bằng:",a:["3","6","9","15"],c:1,e:"Chia hai vế cho 3, ta được x = 6."},
    {s:"Toán",q:"Tam giác có ba góc lần lượt 50°, 60° và góc còn lại là:",a:["60°","70°","80°","90°"],c:1,e:"Tổng ba góc trong tam giác bằng 180°, nên góc còn lại là 70°."},
    {s:"Ngữ văn",q:"Biện pháp tu từ so sánh thường có tác dụng chính nào?",a:["Làm nổi bật đặc điểm bằng cách đối chiếu","Liệt kê sự vật","Lặp âm cuối","Nêu số liệu"],c:0,e:"So sánh đối chiếu sự vật, sự việc này với sự vật, sự việc khác có nét tương đồng để tăng sức gợi hình, gợi cảm."},
    {s:"Ngữ văn",q:"Trong văn nghị luận, luận điểm là gì?",a:["Một chi tiết trang trí","Ý kiến thể hiện tư tưởng cần làm sáng tỏ","Tên tác giả","Một câu hỏi tu từ"],c:1,e:"Luận điểm là ý kiến, quan điểm chính mà người viết dùng lí lẽ và bằng chứng để làm sáng tỏ."},
    {s:"Ngữ văn",q:"Từ nào dưới đây là từ láy?",a:["Học sinh","Long lanh","Bàn ghế","Đất nước"],c:1,e:"Long lanh là từ láy, có sự lặp lại âm đầu."},
    {s:"Tiếng Anh",q:"Choose the correct form: She ___ to school every day.",a:["go","goes","going","gone"],c:1,e:"Với chủ ngữ ngôi thứ ba số ít ở hiện tại đơn, động từ thường thêm -s hoặc -es."},
    {s:"Tiếng Anh",q:"What is the past form of 'buy'?",a:["buyed","bought","buys","buying"],c:1,e:"Buy là động từ bất quy tắc; dạng quá khứ là bought."},
    {s:"Tiếng Anh",q:"Choose the correct word: I have lived here ___ 2020.",a:["for","since","at","during"],c:1,e:"Since đi với mốc thời gian; for đi với khoảng thời gian."},
    {s:"Khoa học",q:"Quá trình quang hợp ở cây xanh cần nguồn năng lượng nào?",a:["Âm thanh","Ánh sáng","Gió","Từ trường"],c:1,e:"Diệp lục hấp thụ năng lượng ánh sáng để diễn ra quá trình quang hợp."},
    {s:"Khoa học",q:"Đơn vị đo cường độ dòng điện là:",a:["Vôn","Oát","Ampe","Jun"],c:2,e:"Cường độ dòng điện được đo bằng ampe (A)."},
    {s:"Khoa học",q:"Nước tinh khiết ở áp suất khí quyển tiêu chuẩn sôi gần mức:",a:["0°C","50°C","100°C","150°C"],c:2,e:"Nước tinh khiết sôi ở khoảng 100°C tại áp suất khí quyển tiêu chuẩn."},
    {s:"Lịch sử",q:"Chiến thắng Điện Biên Phủ diễn ra vào năm nào?",a:["1945","1954","1968","1975"],c:1,e:"Chiến thắng Điện Biên Phủ diễn ra ngày 7/5/1954."},
    {s:"Lịch sử",q:"Cách mạng tháng Tám ở Việt Nam thành công vào năm nào?",a:["1930","1945","1954","1975"],c:1,e:"Tổng khởi nghĩa tháng Tám giành thắng lợi năm 1945."},
    {s:"Lịch sử",q:"Ngày Quốc khánh Việt Nam là:",a:["30/4","1/5","2/9","20/11"],c:2,e:"Ngày 2/9/1945, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập."},
    {s:"Địa lí",q:"Việt Nam nằm ở khu vực nào của châu Á?",a:["Đông Á","Đông Nam Á","Nam Á","Tây Á"],c:1,e:"Việt Nam nằm ở phía đông bán đảo Đông Dương, thuộc khu vực Đông Nam Á."},
    {s:"Địa lí",q:"Đồng bằng lớn nhất nước ta là:",a:["Đồng bằng sông Hồng","Đồng bằng duyên hải miền Trung","Đồng bằng sông Cửu Long","Đồng bằng Thanh-Nghệ-Tĩnh"],c:2,e:"Đồng bằng sông Cửu Long là đồng bằng lớn nhất nước ta."},
    {s:"Địa lí",q:"Loại gió hoạt động phổ biến vào mùa đông ở miền Bắc nước ta là:",a:["Gió mùa Đông Bắc","Gió phơn Tây Nam","Gió tín phong Nam bán cầu","Gió biển"],c:0,e:"Miền Bắc chịu ảnh hưởng rõ của gió mùa Đông Bắc vào mùa đông."}
  ];
  let session = [], index = 0, points = 0, locked = false;
  function renderAchievements() {
    const el = $("#superStudyAchievements");
    if (!el) return;
    const items = [
      ["🌱","Khởi động","Trả lời 1 câu hỏi",data.answered >= 1],
      ["📘","Ham học","Trả lời đúng 5 câu",data.correct >= 5],
      ["🏅","Chinh phục tri thức","Trả lời đúng 15 câu",data.correct >= 15],
      ["⭐","Điểm sáng","Đạt 5 câu đúng trong một lượt",data.best >= 5]
    ];
    el.innerHTML = `<h4>🏆 Huy hiệu học tập</h4><div class="super-badge-grid">${items.map(x=>`<div class="super-badge ${x[3]?"earned":""}"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small><em>${x[3]?"Đã mở khóa":"Chưa mở khóa"}</em></div>`).join("")}</div>`;
  }
  function renderQuestion() {
    const card = $("#superQuizCard");
    const progress = $("#superQuizProgress");
    if (!card || !progress) return;
    if (!session.length) return;
    if (index >= session.length) {
      data.best = Math.max(data.best, points);
      save(); renderAchievements();
      progress.textContent = `Hoàn thành ${session.length} câu · ${points}/${session.length} câu đúng`;
      card.innerHTML = `<div class="super-result"><div>🎉</div><h4>${points >= Math.ceil(session.length*.7) ? "Tuyệt vời! Bạn đã hoàn thành thử thách." : "Bạn đã hoàn thành lượt luyện tập!"}</h4><p>Kết quả: <strong>${points}/${session.length}</strong> câu đúng. ${points >= Math.ceil(session.length*.7) ? "Hãy tiếp tục khám phá nhé!" : "Xem lại phần giải thích rồi thử lại nhé."}</p><button type="button" class="primary-btn" id="retrySuperQuiz">Luyện tập lượt mới</button></div>`;
      $("#retrySuperQuiz").addEventListener("click", startQuiz);
      return;
    }
    const item = session[index];
    progress.textContent = `Câu ${index+1}/${session.length} · ${item.s} · Đúng ${points}`;
    card.innerHTML = `<div class="super-question"><span class="soft-tag">${safe(item.s)}</span><h4>${safe(item.q)}</h4><div class="super-options">${item.a.map((answer,i)=>`<button type="button" data-super-answer="${i}">${String.fromCharCode(65+i)}. ${safe(answer)}</button>`).join("")}</div><div class="super-feedback" id="superFeedback"></div><button type="button" class="secondary-btn" id="superNext" disabled>${index===session.length-1?"Xem kết quả":"Câu tiếp theo →"}</button></div>`;
    card.querySelectorAll("[data-super-answer]").forEach(btn => btn.addEventListener("click", () => {
      if (locked) return;
      locked = true;
      const chosen = Number(btn.dataset.superAnswer);
      const correct = chosen === item.c;
      data.answered += 1;
      if (correct) { points += 1; data.correct += 1; }
      save();
      card.querySelectorAll("[data-super-answer]").forEach((option,i) => {
        option.disabled = true;
        if (i === item.c) option.classList.add("is-correct");
        else if (i === chosen) option.classList.add("is-wrong");
      });
      $("#superFeedback").textContent = `${correct ? "Chính xác! " : "Chưa đúng. "}${item.e}`;
      $("#superNext").disabled = false;
      $("#superNext").addEventListener("click", () => { index += 1; locked = false; renderQuestion(); }, {once:true});
      renderAchievements();
    }));
  }
  function startQuiz() {
    const subject = $("#superSubject")?.value || "all";
    const pool = subject === "all" ? [...bank] : bank.filter(q => q.s === subject);
    session = pool.sort(() => Math.random() - .5).slice(0, Math.min(5,pool.length));
    index = 0; points = 0; locked = false; renderQuestion();
  }
  $("#startSuperQuiz")?.addEventListener("click", startQuiz);
  renderAchievements();

  const familyBoard = $("#familyTaskBoard");
  function renderFamily() {
    if (!familyBoard) return;
    familyBoard.innerHTML = data.familyTasks.length ? data.familyTasks.map(task=>`<div class="super-task ${task.done?"done":""}"><label><input type="checkbox" data-family-done="${task.id}" ${task.done?"checked":""}><span><b>${safe(task.name)}</b><small>${safe(task.person)} · ${safe(task.date || "Chưa chọn ngày")}</small></span></label><button type="button" data-family-delete="${task.id}" aria-label="Xóa nhiệm vụ">×</button></div>`).join("") : `<div class="super-empty">Chưa có nhiệm vụ chung. Hãy thêm một việc nhỏ nhé!</div>`;
  }
  $("#familyTaskForm")?.addEventListener("submit", e => {
    e.preventDefault();
    const name = $("#familyTaskName").value.trim();
    if (!name) return;
    data.familyTasks.unshift({id:Date.now(),name,person:$("#familyTaskPerson").value,date:$("#familyTaskDate").value,done:false});
    save(); renderFamily(); e.target.reset();
    if (window.toast) window.toast("Đã thêm nhiệm vụ gia đình.");
  });
  familyBoard?.addEventListener("change", e => {
    const id = Number(e.target.dataset.familyDone);
    const task = data.familyTasks.find(t=>t.id===id);
    if (task) { task.done = e.target.checked; save(); renderFamily(); }
  });
  familyBoard?.addEventListener("click", e => {
    const id = Number(e.target.dataset.familyDelete);
    if (id) { data.familyTasks = data.familyTasks.filter(t=>t.id!==id); save(); renderFamily(); }
  });
  renderFamily();

  const challenges = [
    ["kind","💛","Lời tử tế","Gửi lời cảm ơn hoặc động viên chân thành đến người thân."],
    ["green","🌱","Góc xanh","Chăm sóc cây hoặc giữ sạch góc học tập."],
    ["book","📚","Chia sẻ tri thức","Giới thiệu một mẹo học tập hữu ích cho bạn."],
    ["reuse","♻️","Tái sử dụng","Tận dụng giấy một mặt để ghi nháp hoặc vẽ."],
    ["help","🤝","Cùng tiến bộ","Hỗ trợ bạn học hiểu một nội dung mình đã nắm vững."],
    ["clean","🧹","Không gian gọn gàng","Cùng người thân sắp xếp một khu vực chung."]
  ];
  function renderCommunity() {
    const board = $("#superCommunityBoard");
    if (!board) return;
    const score = data.communityDone.length * 10;
    $("#communityScore").textContent = score;
    board.innerHTML = challenges.map(item=>{
      const done = data.communityDone.includes(item[0]);
      return `<article class="super-challenge ${done?"done":""}"><span>${item[1]}</span><div><b>${item[2]}</b><p>${item[3]}</p></div><button type="button" data-community-done="${item[0]}" ${done?"disabled":""}>${done?"✓ Đã hoàn thành":"+10 điểm"}</button></article>`;
    }).join("");
  }
  $("#superCommunityBoard")?.addEventListener("click", e => {
    const id = e.target.dataset.communityDone;
    if (!id || data.communityDone.includes(id)) return;
    data.communityDone.push(id); save(); renderCommunity();
    if (window.toast) window.toast("Đã ghi nhận 10 điểm đóng góp!");
  });
  renderCommunity();

  // SMART AI mô phỏng: chạy tại trình duyệt, không gửi câu hỏi ra máy chủ hay dịch vụ bên ngoài.
  const responses = [
    {keys:["xin chào","chào","hello","hi"],answer:"Xin chào! Mình là SMART AI 5.0 🤖\n\nMình có thể đồng hành cùng bạn ở 4 khu vực: học tập, gia đình, cộng đồng và sáng tạo. Bạn có thể yêu cầu giải thích kiến thức, tạo câu hỏi, lập kế hoạch, gợi ý hoạt động hoặc tóm tắt văn bản."},
    {keys:["kế hoạch","ôn tập","thời khóa biểu"],answer:"📅 KẾ HOẠCH ÔN TẬP GỢI Ý\n\n1. Chọn 2 môn cần ưu tiên trong ngày.\n2. Mỗi phiên tập trung 20–25 phút cho một mục tiêu nhỏ.\n3. Nghỉ ngắn giữa các phiên.\n4. Cuối buổi, tự trả lời 3 câu hỏi để kiểm tra mức độ hiểu.\n5. Ghi lại phần chưa rõ để hỏi thầy cô hoặc bạn học.\n\nBạn hãy điều chỉnh thời lượng theo lịch học và sức khỏe của mình nhé."},
    {keys:["quang hợp","cây xanh"],answer:"🌿 GIẢI THÍCH QUANG HỢP\n\nQuang hợp là quá trình cây xanh sử dụng năng lượng ánh sáng, chủ yếu nhờ diệp lục, để tạo chất hữu cơ từ nước và khí carbon dioxide; đồng thời giải phóng oxygen.\n\nCó thể nhớ ngắn gọn: ánh sáng + nước + carbon dioxide → chất hữu cơ + oxygen.\n\nMẹo nhớ: cây hấp thụ CO₂, không phải hấp thụ O₂ để quang hợp."},
    {keys:["phân số"],answer:"📘 PHÂN SỐ\n\nPhân số có dạng a/b, trong đó a là tử số, b là mẫu số và b khác 0. Tử số cho biết số phần được lấy; mẫu số cho biết đơn vị được chia thành bao nhiêu phần bằng nhau.\n\nVí dụ: 3/4 nghĩa là lấy 3 trong 4 phần bằng nhau."},
    {keys:["tam giác","định lý pytago","pythagore"],answer:"📐 GỢI Ý HỌC HÌNH HỌC\n\nVới tam giác, tổng ba góc trong luôn bằng 180°. Với tam giác vuông có hai cạnh góc vuông a, b và cạnh huyền c, định lý Pythagore là a² + b² = c².\n\nHãy xác định đúng loại tam giác trước khi chọn công thức."},
    {keys:["tiếng anh","hiện tại đơn","present simple"],answer:"🇬🇧 ÔN TẬP THÌ HIỆN TẠI ĐƠN\n\n• I/You/We/They + động từ nguyên mẫu.\n• He/She/It + động từ thêm s/es.\n• Phủ định: do not / does not + động từ nguyên mẫu.\n• Câu hỏi: Do / Does + chủ ngữ + động từ nguyên mẫu?\n\nDấu hiệu thường gặp: always, usually, often, sometimes, every day."},
    {keys:["lịch sử","điện biên phủ"],answer:"🏛️ GỢI Ý HỌC LỊCH SỬ\n\nKhi học một sự kiện lịch sử, hãy ghi nhớ theo 5 ý: thời gian, địa điểm, bối cảnh, diễn biến chính và ý nghĩa. Với Chiến thắng Điện Biên Phủ, mốc quan trọng là ngày 7/5/1954. Hãy đối chiếu nội dung chi tiết với sách giáo khoa đang học."},
    {keys:["địa lí","địa lý","đồng bằng sông cửu long"],answer:"🌏 CÁCH ÔN ĐỊA LÍ\n\nHãy học theo sơ đồ: vị trí → đặc điểm tự nhiên → dân cư → kinh tế → vấn đề môi trường. Khi nhận xét biểu đồ, nêu xu hướng chung, số liệu nổi bật và so sánh các đối tượng; không chỉ đọc lại từng con số."},
    {keys:["gia đình","việc nhà","tiết kiệm điện","tiết kiệm nước"],answer:"🏡 GỢI Ý CHO GIA ĐÌNH\n\n• Cùng thống nhất lịch việc nhà đơn giản và phù hợp.\n• Chia việc công bằng, không giao nhiệm vụ nguy hiểm hoặc vượt khả năng.\n• Tắt thiết bị khi không sử dụng và khóa vòi nước sau khi dùng.\n• Ghi nhận sự cố điện, nước để báo người lớn xử lý; không tự sửa hệ thống."},
    {keys:["cộng đồng","tình nguyện","môi trường","sống xanh"],answer:"🌱 Ý TƯỞNG CỘNG ĐỒNG\n\nBạn có thể bắt đầu bằng việc giữ vệ sinh lớp học, chăm sóc cây, chia sẻ sách, hỗ trợ bạn học hoặc lan tỏa thông tin đã kiểm chứng. Với hoạt động ngoài đời, hãy tham gia cùng lớp, gia đình hoặc người lớn đáng tin cậy."},
    {keys:["tạo câu hỏi","câu hỏi trắc nghiệm","quiz","kiểm tra kiến thức"],answer:"🧠 BỘ CÂU HỎI LUYỆN TẬP NHANH\n\n1. Cây xanh hấp thụ khí nào trong quang hợp?\nA. Oxygen  B. Carbon dioxide  C. Nitrogen\n2. Tổng ba góc trong tam giác bằng bao nhiêu?\nA. 90°  B. 180°  C. 360°\n3. 'Bought' là dạng quá khứ của từ nào?\nA. Bring  B. Buy  C. Build\n\nĐáp án: 1B, 2B, 3B. Bạn có thể vào Đấu trường tri thức để làm bài theo từng môn."},
    {keys:["tóm tắt","tóm gọn"],answer:"📝 MÌNH CÓ THỂ GIÚP TÓM TẮT\n\nBạn hãy dán đoạn văn cần tóm tắt sau dấu hai chấm. Mình sẽ rút ra ý chính, giữ lại các thông tin quan trọng và trình bày ngắn gọn. Vì đây là mô phỏng ngoại tuyến, với văn bản quá dài bạn nên chia thành từng phần."},
    {keys:["ý tưởng","sáng tạo","dự án"],answer:"💡 5 Ý TƯỞNG DỰ ÁN NHỎ\n\n1. Sổ tay học tập có mã màu theo môn.\n2. Góc trao đổi sách trong lớp.\n3. Bảng nhắc tiết kiệm điện và nước.\n4. Bộ thẻ từ vựng do nhóm tự tạo.\n5. Nhật ký hành động xanh mỗi tuần.\n\nChọn ý tưởng vừa sức, xác định mục tiêu, người cùng thực hiện và cách đánh giá kết quả."},
    {keys:["động viên","mệt","khó khăn","không hiểu"],answer:"💛 HỌC TẬP TỪNG BƯỚC\n\nKhông cần hiểu mọi thứ ngay lập tức. Hãy chia bài thành phần nhỏ, bắt đầu từ ví dụ dễ, ghi lại đúng chỗ đang vướng và hỏi người có thể hướng dẫn. Nghỉ ngơi hợp lý cũng là một phần của việc học hiệu quả."}
  ];
  function simulateAI(question) {
    const q = question.toLocaleLowerCase("vi");
    if (q.includes("tóm tắt") || q.includes("tóm gọn")) {
      const raw = question.split(/tóm tắt|tóm gọn/i).slice(1).join("").replace(/^[:\s]+/,"").trim();
      if (raw.length > 35) {
        const sentences = raw.split(/(?<=[.!?])\s+/).filter(Boolean);
        const summary = sentences.length > 2 ? [sentences[0],sentences[Math.floor(sentences.length/2)],sentences[sentences.length-1]].join(" ") : raw.slice(0,420);
        return `📝 TÓM TẮT MÔ PHỎNG\n\n${summary}\n\nLưu ý: Đây là cách rút gọn theo câu, bạn hãy kiểm tra lại để bảo đảm không mất ý quan trọng.`;
      }
    }
    if (q.includes("giải thích") || q.includes("là gì") || q.includes("khái niệm")) {
      const topic = question.replace(/hãy|giải thích|cho mình biết|là gì\??/gi,"").trim();
      return `📚 CÁCH TÌM HIỂU: ${topic || "Chủ đề của bạn"}\n\n1. Xác định khái niệm hoặc từ khóa chính.\n2. Tìm định nghĩa trong sách giáo khoa.\n3. Xem một ví dụ cụ thể.\n4. Tự diễn đạt lại bằng lời của mình.\n\nMình là AI mô phỏng nên chưa thể tra cứu mọi chủ đề. Nếu bạn gửi đoạn kiến thức hoặc ảnh/nội dung bài học dưới dạng văn bản, mình có thể giúp phân tích cấu trúc và giải thích dựa trên phần bạn cung cấp.`;
    }
    const match = responses.find(item => item.keys.some(key=>q.includes(key)));
    if (match) return match.answer;
    if (q.includes("môn") || q.includes("bài") || q.includes("học")) {
      return "📖 CHẾ ĐỘ GIA SƯ\n\nMình có thể hỗ trợ theo 4 bước: (1) xác định phần kiến thức, (2) giải thích khái niệm, (3) đưa ví dụ minh họa, (4) tạo câu hỏi tự luyện. Hãy ghi rõ môn học và tên bài, ví dụ: “Địa lí 9 – vùng Đồng bằng sông Cửu Long”.\n\nLưu ý: câu trả lời được tạo từ quy tắc và nội dung mẫu có sẵn, không phải suy luận của mô hình AI trực tuyến.";
    }
    return "🤖 SMART AI 5.0 – MÌNH ĐÃ NHẬN ĐƯỢC CÂU HỎI\n\nMình đang chạy ở chế độ mô phỏng ngoại tuyến. Bạn có thể thử các yêu cầu như:\n• Giải thích quang hợp hoặc kiến thức Toán, Văn, Anh.\n• Tạo câu hỏi trắc nghiệm và kiểm tra kiến thức.\n• Lập kế hoạch ôn tập.\n• Gợi ý việc nhà, tiết kiệm tài nguyên.\n• Đề xuất hoạt động cộng đồng, sống xanh.\n• Tóm tắt đoạn văn bạn dán vào.\n\nVới câu hỏi ngoài kho nội dung, mình sẽ đưa ra khung hướng dẫn thay vì giả vờ biết câu trả lời chính xác.";
  }
  // SMART AI submit is handled only by app.js to avoid competing listeners.
  document.body.dataset.smartLifeVersion = "7.0";
})();
