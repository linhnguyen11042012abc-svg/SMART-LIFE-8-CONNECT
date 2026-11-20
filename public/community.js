(() => {
  "use strict";

  const client = window.smartLifeSupabase;
  const form = document.querySelector("#postForm");
  const list = document.querySelector("#postList");
  if (!client || !form || !list) return;

  const notice = document.createElement("p");
  notice.className = "muted";
  list.before(notice);

  const adminPanel = document.createElement("section");
  adminPanel.className = "community-admin";
  adminPanel.hidden = true;
  adminPanel.innerHTML = `
    <h3>🛡️ Quản trị cộng đồng</h3>
    <p class="muted">Các bài viết đang chờ duyệt</p>
    <div class="post-list" id="adminPendingList"></div>
  `;
  list.before(adminPanel);

  const adminList = adminPanel.querySelector("#adminPendingList");
  let currentUser = null;
  let isAdmin = false;
  let loading = false;

  function message(text) {
    notice.textContent = text;
  }

  function parseContent(raw) {
    try {
      const value = JSON.parse(raw);
      if (value && typeof value === "object") return value;
    } catch (_) {}
    return {
      title: "Bài viết cộng đồng",
      category: "Chia sẻ",
      body: raw
    };
  }

  function makeArticle(post, showActions = false) {
    const data = parseContent(post.content);
    const article = document.createElement("article");
    article.className = "post-item";

    const category = document.createElement("span");
    category.className = "post-category";
    category.textContent = data.category || "Chia sẻ";

    const title = document.createElement("strong");
    title.textContent = data.title || "Bài viết cộng đồng";

    const body = document.createElement("p");
    body.textContent = data.body || post.content;

    const meta = document.createElement("span");
    meta.className = "note-meta";
    meta.textContent =
      new Date(post.created_at).toLocaleString("vi-VN") +
      (post.status === "pending" ? " · Đang chờ duyệt" : "");

    article.append(category, title, body, meta);

    if (showActions) {
      const actions = document.createElement("div");
      actions.className = "community-admin-actions";

      const approve = document.createElement("button");
      approve.type = "button";
      approve.className = "primary-btn";
      approve.textContent = "✓ Duyệt bài";
      approve.dataset.moderate = post.id;
      approve.dataset.status = "approved";

      const reject = document.createElement("button");
      reject.type = "button";
      reject.textContent = "Từ chối";
      reject.dataset.moderate = post.id;
      reject.dataset.status = "rejected";

      actions.append(approve, reject);
      article.append(actions);
    }

    return article;
  }

  function render(posts) {
    list.replaceChildren();

    const visiblePosts = posts.filter(post =>
      post.status === "approved" ||
      post.user_id === currentUser?.id
    );

    if (!visiblePosts.length) {
      message("Chưa có bài viết nào. Hãy chia sẻ ý tưởng tích cực nhé!");
    } else {
      message("Bài viết cộng đồng");
      visiblePosts.forEach(post => list.append(makeArticle(post)));
    }

    adminList.replaceChildren();

    const pending = isAdmin
      ? posts.filter(post => post.status === "pending")
      : [];

    if (isAdmin) {
      adminPanel.hidden = false;

      if (!pending.length) {
        const empty = document.createElement("p");
        empty.className = "muted";
        empty.textContent = "Hiện không có bài viết chờ duyệt.";
        adminList.append(empty);
      } else {
        pending.forEach(post => {
          adminList.append(makeArticle(post, true));
        });
      }
    } else {
      adminPanel.hidden = true;
    }
  }

  async function loadPosts() {
    if (loading) return;
    loading = true;

    try {
      const { data: authData, error: authError } =
        await client.auth.getUser();

      currentUser = authData?.user || null;
      isAdmin = false;

      if (authError || !currentUser) {
        list.replaceChildren();
        adminPanel.hidden = true;
        message("Đăng nhập để xem và tham gia cộng đồng nhé.");
        return;
      }

      const { data: adminResult, error: adminError } =
        await client.rpc("is_community_admin");

      if (!adminError) isAdmin = adminResult === true;

      message("Đang tải bài viết...");

      const { data, error } = await client
        .from("posts")
        .select("id,user_id,content,status,created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        message("Không tải được bài viết: " + error.message);
        return;
      }

      render(data || []);
    } catch (error) {
      message("Có lỗi khi tải cộng đồng: " + error.message);
    } finally {
      loading = false;
    }
  }

  adminPanel.addEventListener("click", async event => {
    const button = event.target.closest("[data-moderate]");
    if (!button || !isAdmin) return;

    const postId = button.dataset.moderate;
    const status = button.dataset.status;

    if (!postId || !["approved", "rejected"].includes(status)) return;

    button.disabled = true;
    message("Đang xử lý bài viết...");

    try {
      const { error } = await client.rpc("moderate_community_post", {
        p_post_id: postId,
        p_status: status
      });

      if (error) {
        message("Không xử lý được bài viết: " + error.message);
        button.disabled = false;
        return;
      }

      message(status === "approved"
        ? "Đã duyệt bài viết thành công!"
        : "Đã từ chối bài viết.");

      await loadPosts();
    } catch (error) {
      message("Có lỗi: " + error.message);
      button.disabled = false;
    }
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const { data: authData, error: authError } =
      await client.auth.getUser();

    const user = authData?.user;

    if (authError || !user) {
      message("Bạn cần đăng nhập trước khi đăng bài.");
      return;
    }

    const title = document.querySelector("#postTitle").value.trim();
    const category = document.querySelector("#postCategory").value;
    const body = document.querySelector("#postBody").value.trim();
    const submit = form.querySelector('[type="submit"]');

    if (title.length < 3 || body.length < 3) {
      message("Tiêu đề và nội dung cần có ít nhất 3 ký tự.");
      return;
    }

    const content = JSON.stringify({ title, category, body });

    submit.disabled = true;
    message("Đang gửi bài viết...");

    try {
      const { error } = await client.from("posts").insert({
        user_id: user.id,
        content,
        status: "pending"
      });

      if (error) {
        message("Chưa đăng được bài: " + error.message);
        return;
      }

      form.reset();
      message("Đã gửi bài! Bài viết đang chờ duyệt.");
      await loadPosts();
    } catch (error) {
      message("Có lỗi khi gửi bài: " + error.message);
    } finally {
      submit.disabled = false;
    }
  }, true);

  client.auth.onAuthStateChange(() => {
    loadPosts();
  });

  loadPosts();
})();
