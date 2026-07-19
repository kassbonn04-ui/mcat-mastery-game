/**
 * Supabase cloud save — syncs game state across devices when signed in.
 * Falls back to localStorage-only when config/auth is missing.
 */
(function () {
  const SAVE_DEBOUNCE_MS = 900;
  let client = null;
  let user = null;
  let saveTimer = null;
  let lastRemoteAt = null;
  let syncStatus = "offline"; // offline | ready | syncing | error | local-only
  let listeners = [];

  function cfg() {
    return window.ARCANUM_CONFIG || {};
  }

  function configured() {
    const c = cfg();
    return Boolean(c.supabaseUrl && c.supabaseAnonKey && window.supabase?.createClient);
  }

  function emit() {
    const snap = status();
    listeners.forEach((fn) => {
      try {
        fn(snap);
      } catch (_) {}
    });
  }

  function status() {
    return {
      configured: configured(),
      syncStatus,
      user,
      email: user?.email || null,
      lastRemoteAt,
    };
  }

  function onChange(fn) {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((x) => x !== fn);
    };
  }

  function init() {
    if (!configured()) {
      syncStatus = "local-only";
      emit();
      return null;
    }
    if (client) return client;
    const c = cfg();
    client = window.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    client.auth.getSession().then(({ data }) => {
      user = data.session?.user || null;
      syncStatus = user ? "ready" : "ready";
      emit();
    });

    client.auth.onAuthStateChange((_event, session) => {
      user = session?.user || null;
      syncStatus = "ready";
      emit();
    });

    return client;
  }

  async function signUp(email, password, displayName) {
    init();
    if (!client) throw new Error("Cloud not configured yet.");
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName || email.split("@")[0] },
        emailRedirectTo: window.location.origin + window.location.pathname,
      },
    });
    if (error) throw error;
    user = data.user;
    emit();
    return data;
  }

  async function signIn(email, password) {
    init();
    if (!client) throw new Error("Cloud not configured yet.");
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    user = data.user;
    syncStatus = "ready";
    emit();
    return data;
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
    user = null;
    emit();
  }

  async function pullSave() {
    init();
    if (!client || !user) return null;
    syncStatus = "syncing";
    emit();
    const { data, error } = await client
      .from("game_saves")
      .select("save_data, updated_at, display_name")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      syncStatus = "error";
      emit();
      throw error;
    }
    syncStatus = "ready";
    lastRemoteAt = data?.updated_at || null;
    emit();
    if (!data?.save_data || !Object.keys(data.save_data).length) return null;
    return data.save_data;
  }

  async function pushSave(state) {
    init();
    if (!client || !user || !state) return false;
    syncStatus = "syncing";
    emit();
    const payload = {
      user_id: user.id,
      display_name: state.playerName || user.email?.split("@")[0] || "Scholar",
      save_data: state,
      updated_at: new Date().toISOString(),
    };
    const { error } = await client.from("game_saves").upsert(payload, {
      onConflict: "user_id",
    });
    if (error) {
      syncStatus = "error";
      emit();
      console.warn("[Arcanum cloud] save failed", error);
      return false;
    }
    lastRemoteAt = payload.updated_at;
    syncStatus = "ready";
    emit();
    return true;
  }

  function queueSave(state) {
    if (!user || !configured()) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      pushSave(state).catch((e) => console.warn(e));
    }, SAVE_DEBOUNCE_MS);
  }

  /**
   * After login: merge cloud vs local by updated timestamps / campaign progress.
   */
  function mergeSaves(localState, remoteState) {
    if (!remoteState) return localState;
    if (!localState) return remoteState;
    const localScore =
      (localState.stats?.answered || 0) +
      (localState.clearedLevels?.length || 0) * 10;
    const remoteScore =
      (remoteState.stats?.answered || 0) +
      (remoteState.clearedLevels?.length || 0) * 10;
    return remoteScore >= localScore ? remoteState : localState;
  }

  window.GameCloud = {
    init,
    configured,
    status,
    onChange,
    signUp,
    signIn,
    signOut,
    pullSave,
    pushSave,
    queueSave,
    mergeSaves,
    getUser: () => user,
  };
})();
