(() => {
  const community = document.querySelector("#page-community");
  if (!community || document.querySelector("#connectAccount")) return;

  const panel = document.createElement("section");
  panel.id = "connectAccount";
  panel.className = "panel connect-account";

  panel.innerHTML = `
    <div class="panel-title">
      <div>
        <span class="eyebrow">SMART LIFE 8.0 CONNECT</span>
        <h3>🌐 Tài khoản học sinh</h3>
        <p class="muted">Kết nối cộng đồng học tập toàn hệ thống.</p>
      </div>
      <span class="soft-tag">ONLINE</span>
    </div>

    <div id="connectAuth">
      <div class="connect-tabs">
        <button type="button" id="connectLoginTab" class="primary-btn">Đăng nhập</button>
        <button type="button" id="connectRegisterTab" class="secondary-btn">Đăng ký</button>
      </div>

      <form id="connectAuthForm" class="stack-form">
        <label id="connectNameLabel" hidden>Tên hiển thị
          <input id="connectName" maxlength="24" placeholder="Tên học tập của bạn">
        </label>
        <label>Email
          <input id="connectEmail" type="email" autocomplete="email" required maxlength="254">
        </label>
        <label>Mật khẩu
          <input id="connectPassword" type="password" autocomplete="current-password" minlength="8" required>
        </label>
        <button class="primary-btn" type="submit" id="connectSubmit">Đăng nhập</button>
        <p id="connectMessage" class="muted" role="status"></p>
      </form>
    </div>

    <div id="connectProfile" hidden>
      <h3>Chào mừng bạn đến SMART LIFE!</h3>
      <p id="connectProfileName"></p>
      <p class="muted">Tài khoản đã kết nối. Hồ sơ và bảng tin trực tuyến sẽ được bổ sung ở bước tiếp theo.</p>
      <button type="button" class="secondary-btn" id="connectLogout">Đăng xuất</button>
    </div>

    <p class="muted">Chỉ sử dụng tên hiển thị. Không đăng thông tin cá nhân, địa chỉ hoặc số điện thoại lên cộng đồng.</p>
  `;

  const banner = community.querySelector(".community-banner");
  banner.insertAdjacentElement("afterend", panel);

  let mode = "login";

  const $ = id => document.getElementById(id);
  const message = text => $("connectMessage").textContent = text;

  function setMode(next) {
    mode = next;
    $("connectNameLabel").hidden = mode !== "register";
    $("connectLoginTab").className = mode === "login" ? "primary-btn" : "secondary-btn";
    $("connectRegisterTab").className = mode === "register" ? "primary-btn" : "secondary-btn";
    $("connectSubmit").textContent = mode === "login" ? "Đăng nhập" : "Tạo tài khoản";
    $("connectPassword").autocomplete = mode === "login" ? "current-password" : "new-password";
    message("");
  }

  $("connectLoginTab").addEventListener("click", () => setMode("login"));
  $("connectRegisterTab").addEventListener("click", () => setMode("register"));

  async function refreshSession() {
    const client = window.smartLifeSupabase;
    if (!client) {
      message("Chưa kết nối được Supabase. Hãy kiểm tra mạng và cấu hình.");
      return;
    }

    const { data, error } = await client.auth.getSession();
    if (error) return message("Không thể kiểm tra phiên đăng nhập.");

    const user = data.session?.user;
    $("connectAuth").hidden = !!user;
    $("connectProfile").hidden = !user;

    if (user) {
      $("connectProfileName").textContent =
        "Tài khoản: " + (user.user_metadata?.display_name || "Học viên");
    }
  }

  $("connectAuthForm").addEventListener("submit", async event => {
    event.preventDefault();

    const client = window.smartLifeSupabase;
    if (!client) return message("Chưa kết nối được máy chủ. Hãy kiểm tra cấu hình.");

    const email = $("connectEmail").value.trim();
    const password = $("connectPassword").value;
    const name = $("connectName").value.trim();

    $("connectSubmit").disabled = true;
    message("Đang xử lý...");

    try {
      let result;

      if (mode === "register") {
        if (name.length < 2) {
          message("Tên hiển thị cần ít nhất 2 ký tự.");
          return;
        }

        result = await client.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name }
          }
        });

        if (!result.error) {
          message("Đã gửi yêu cầu đăng ký. Hãy kiểm tra email để xác nhận tài khoản.");
        }
      } else {
        result = await client.auth.signInWithPassword({ email, password });
      }

      if (result.error) {
        message("Không thành công: " + result.error.message);
      } else if (mode === "login") {
        await refreshSession();
      }
    } catch (error) {
      message("Có lỗi kết nối. Vui lòng thử lại.");
    } finally {
      $("connectSubmit").disabled = false;
    }
  });

  $("connectLogout").addEventListener("click", async () => {
    const client = window.smartLifeSupabase;
    if (!client) return;

    const progress = window.SMARTLIFEProgress;
    if (progress?.userId) {
      const synced = await progress.syncNow();
      if (synced !== true) {
        return message("Chưa đồng bộ được tiến trình. Hãy kiểm tra mạng rồi thử lại.");
      }
    }

    const { error } = await client.auth.signOut();
    if (error) return message("Chưa thể đăng xuất. Hãy thử lại.");
    await refreshSession();
    setMode("login");
  });
  if (window.smartLifeSupabase) {
    window.smartLifeSupabase.auth.onAuthStateChange(() => {
      refreshSession();
    });
    refreshSession();
  } else {
    message("Chưa tải được kết nối Supabase.");
  }
})();
