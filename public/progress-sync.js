(() => {
  "use strict";

  const client = window.smartLifeSupabase;
  const TABLE = "user_game_state";
  const KEY = "smartLife_adventure_v2";

  let currentUserId = null;
  let ready = false;
  let saveTimer = null;

  const guestKey = KEY + "_guest";

  function accountKey(userId) {
    return KEY + "_user_" + userId;
  }

  function readLocal(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
      return {};
    }
  }

  function writeLocal(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function gameStateOnly(value) {
    const state = { ...value };
    delete state.xp;
    delete state.coins;
    return state;
  }

  async function loadAccount(userId) {
    const [gameResult, statsResult] = await Promise.all([
      client
        .from(TABLE)
        .select("state")
        .eq("user_id", userId)
        .maybeSingle(),

      client.rpc("get_my_learning_stats")
    ]);

    if (gameResult.error) throw gameResult.error;
    if (statsResult.error) throw statsResult.error;

    const cloudState = gameResult.data?.state || {};
    const localState = gameStateOnly(readLocal(accountKey(userId)));
    const stats = Array.isArray(statsResult.data)
      ? statsResult.data[0]
      : statsResult.data;

    const merged = {
      ...localState,
      ...cloudState,
      xp: Number(stats?.current_xp) || 0,
      coins: Number(stats?.current_coins) || 0
    };

    writeLocal(accountKey(userId), gameStateOnly(merged));
    writeLocal(KEY, merged);

    return merged;
  }

  async function saveAccount() {
   if (!client || !currentUserId || !ready) return false;

   const userId = currentUserId;
   const state = gameStateOnly(readLocal(KEY));

   const { error } = await client
     .from(TABLE)
     .upsert({
       user_id: userId,
       state,
       updated_at: new Date().toISOString()
     }, { onConflict: "user_id" });

   if (error) {
     console.error("SMART LIFE: Không thể đồng bộ tiến trình.", error);
     return false;
   }

   if (currentUserId !== userId) return false;
   writeLocal(accountKey(userId), state);
   return true;
 }

  function scheduleSave() {
    if (!currentUserId || !ready) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveAccount, 1200);
  }

  const originalSetItem = Storage.prototype.setItem;

  Storage.prototype.setItem = function(key, value) {
    originalSetItem.call(this, key, value);

    if (this === localStorage && key === KEY && ready) {
      if (currentUserId) {
        scheduleSave();
      } else {
        writeLocal(guestKey, readLocal(KEY));
      }
    }
  };

  async function switchAccount(userId) {
    ready = false;
    currentUserId = userId || null;
    clearTimeout(saveTimer);

    if (!userId) {
      writeLocal(KEY, readLocal(guestKey));
      ready = true;
      return;
    }

    try {
      await loadAccount(userId);
      ready = true;
    } catch (error) {
      currentUserId = null;
      console.error("SMART LIFE: Không tải được tiến trình tài khoản.", error);
      throw error;
    }
  }

  window.SMARTLIFEProgress = {
    get ready() {
      return ready;
    },
    get userId() {
      return currentUserId;
    },
    save: scheduleSave,
    syncNow: async () => {
      clearTimeout(saveTimer);
      return await saveAccount();
    },
    switchAccount
  };

  window.SMARTLIFEProgressReady = (async () => {
    if (!client) {
      ready = true;
      return;
    }

    if (localStorage.getItem(guestKey) === null) {
      writeLocal(guestKey, readLocal(KEY));
    }

    const { data, error } = await client.auth.getSession();
    if (error) throw error;

    await switchAccount(data.session?.user?.id || null);

    client.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;

      const nextId = session?.user?.id || null;
      if (nextId !== currentUserId) {
        window.location.reload();
      }
    });
  })();
})();
