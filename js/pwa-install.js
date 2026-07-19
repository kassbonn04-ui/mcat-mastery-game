/**
 * Phone �Install app� / Add to Home Screen helper.
 * Android Chrome: native beforeinstallprompt.
 * iPhone Safari: show Share ? Add to Home Screen steps (no native prompt API).
 */
(function () {
  const DISMISS_KEY = "arcanum-pwa-install-dismissed";
  let deferredPrompt = null;

  function isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.includes("android-app://")
    );
  }

  function isIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function isAndroid() {
    return /android/i.test(navigator.userAgent);
  }

  function dismissed() {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    hideBanner();
  }

  function hideBanner() {
    document.getElementById("pwa-install-banner")?.remove();
  }

  function ensureBanner() {
    if (isStandalone() || dismissed()) return null;
    let el = document.getElementById("pwa-install-banner");
    if (el) return el;
    el = document.createElement("aside");
    el.id = "pwa-install-banner";
    el.className = "pwa-install-banner";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Install Arcanum as an app");
    document.body.appendChild(el);
    return el;
  }

  function paintBanner() {
    const el = ensureBanner();
    if (!el) return;

    if (isIos()) {
      el.innerHTML = `
        <div class="pwa-install-card">
          <p class="pwa-install-title">Add Arcanum to your Home Screen</p>
          <p class="pwa-install-body">
            In <strong>Safari</strong>: tap Share
            <span class="pwa-ios-share" aria-hidden="true">?</span>
            ? <strong>Add to Home Screen</strong> ? Add.
            Then open the Arcanum icon � it runs full-screen like an app.
          </p>
          <div class="pwa-install-actions">
            <button type="button" class="btn ghost" data-pwa-dismiss>Not now</button>
          </div>
        </div>`;
    } else if (deferredPrompt || isAndroid()) {
      el.innerHTML = `
        <div class="pwa-install-card">
          <p class="pwa-install-title">Install Arcanum on this phone</p>
          <p class="pwa-install-body">
            Install once from your Netlify HTTPS link. After that, open the home-screen icon �
            no browser bar, works offline for cached pages.
          </p>
          <div class="pwa-install-actions">
            <button type="button" class="btn primary" data-pwa-install>Install app</button>
            <button type="button" class="btn ghost" data-pwa-dismiss>Not now</button>
          </div>
        </div>`;
    } else {
      el.innerHTML = `
        <div class="pwa-install-card">
          <p class="pwa-install-title">Phone app install</p>
          <p class="pwa-install-body">
            Open your <strong>Netlify HTTPS</strong> URL on the phone (not localhost).
            Then use the browser menu ? <strong>Install app</strong> / <strong>Add to Home screen</strong>.
          </p>
          <div class="pwa-install-actions">
            <button type="button" class="btn ghost" data-pwa-dismiss>Got it</button>
          </div>
        </div>`;
    }

    el.querySelector("[data-pwa-dismiss]")?.addEventListener("click", dismiss);
    el.querySelector("[data-pwa-install]")?.addEventListener("click", async () => {
      if (!deferredPrompt) {
        alert(
          "Use Chrome menu ? Install app / Add to Home screen on your Netlify link."
        );
        return;
      }
      deferredPrompt.prompt();
      try {
        await deferredPrompt.userChoice;
      } catch {
        /* ignore */
      }
      deferredPrompt = null;
      dismiss();
    });
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    paintBanner();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    dismiss();
  });

  function showIfNeeded() {
    if (isStandalone()) return;
    // Delay so title UI paints first
    setTimeout(paintBanner, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showIfNeeded);
  } else {
    showIfNeeded();
  }

  window.ArcanumPwa = {
    isStandalone,
    showInstallHelp: paintBanner,
    dismiss,
  };
})();
