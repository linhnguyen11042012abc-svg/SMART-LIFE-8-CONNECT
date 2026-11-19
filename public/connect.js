(() => {
  const config = window.SMART_LIFE_SUPABASE;

  if (!window.supabase || !config?.url || !config?.publishableKey) {
    console.error("SMART LIFE: Chưa tải được cấu hình Supabase.");
    return;
  }

  window.smartLifeSupabase = window.supabase.createClient(
    config.url,
    config.publishableKey
  );

  console.log("SMART LIFE: Đã khởi tạo kết nối Supabase.");
})();
