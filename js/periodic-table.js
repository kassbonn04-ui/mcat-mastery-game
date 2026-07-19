/**
 * Chart of the Elements — thematic MCAT quick-reference overlay (not a page).
 * Data: window.ELEMENT_DATA (Z, symbol, name, standard atomic weight).
 * Exam-faithful: no radius / electronegativity / trend heatmaps or size cues.
 */
(function () {
  const HAND_SVG = `
    <svg class="elf-hand-svg" viewBox="0 0 120 140" aria-hidden="true">
      <ellipse class="elf-hand-palm" cx="52" cy="78" rx="28" ry="34" />
      <path class="elf-hand-thumb" d="M28 70 C12 58 10 42 22 36 C32 32 40 42 42 54" />
      <path class="elf-finger f1" d="M40 48 C38 28 42 14 48 10 C54 8 58 18 56 36" />
      <path class="elf-finger f2" d="M52 44 C54 22 58 8 64 6 C70 6 72 18 68 38" />
      <path class="elf-finger f3 snap-finger" d="M64 48 C70 30 78 16 86 14 C94 14 96 28 88 46" />
      <path class="elf-finger f4" d="M70 58 C80 48 92 44 98 50 C104 58 96 68 84 70" />
      <ellipse class="elf-cuff" cx="48" cy="118" rx="22" ry="12" />
    </svg>`;

  let root = null;
  let open = false;
  let animating = false;
  let selected = null;

  function elements() {
    const list = window.ELEMENT_DATA;
    if (!Array.isArray(list) || list.length < 118) {
      console.warn("ELEMENT_DATA missing or incomplete");
      return [];
    }
    return list;
  }

  function byZ(z) {
    return elements().find((e) => e.z === z) || null;
  }

  function ensureRoot() {
    if (root && document.body.contains(root)) return root;
    root = document.createElement("div");
    root.id = "periodic-letter-root";
    root.className = "periodic-letter-root";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="periodic-backdrop" data-pt-close></div>
      <div class="snap-stage" aria-hidden="true">
        <div class="elf-hand">${HAND_SVG}</div>
        <div class="snap-smoke"></div>
      </div>
      <aside class="periodic-panel" role="dialog" aria-modal="true" aria-labelledby="pt-letter-title">
        <header class="pt-panel-head">
          <div>
            <p class="eyebrow whimsy">Owl-post · exam reference</p>
            <h2 id="pt-letter-title">Chart of the Elements</h2>
            <p class="pt-panel-sub">Atomic number · symbol · standard atomic weight. No trend markings.</p>
          </div>
          <button type="button" class="btn ghost pt-close-btn" data-pt-close>Close</button>
        </header>
        <div class="pt-panel-body">
          <div class="pt-grid-wrap">
            <div class="pt-grid" data-pt-grid></div>
            <p class="pt-fnote">* Lanthanides &nbsp;&nbsp; ** Actinides</p>
          </div>
          <div class="pt-detail" data-pt-detail>
            <p class="pt-detail-hint">Tap an element for name &amp; mass.</p>
            <p class="pt-detail-fine">Same facts as a standard MCAT periodic table — use it, then close.</p>
          </div>
        </div>
        <footer class="pt-panel-foot">
          <p class="fine">Masses: conventional / IUPAC-aligned values (PubChem atomic weight fields). Synthetic elements show most-stable isotope mass number.</p>
        </footer>
      </aside>
    `;
    document.body.appendChild(root);

    const grid = root.querySelector("[data-pt-grid]");
    grid.innerHTML = buildGridHtml();

    root.querySelectorAll("[data-pt-close]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        close();
      });
    });
    grid.addEventListener("click", (e) => {
      const cell = e.target.closest("[data-z]");
      if (!cell) return;
      selectElement(Number(cell.dataset.z));
    });
    if (!ensureRoot._keys) {
      ensureRoot._keys = true;
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && open) close();
      });
    }
    return root;
  }

  function buildGridHtml() {
    const list = elements();
    const byXY = new Map();
    for (const e of list) {
      byXY.set(`${e.x}-${e.y}`, e);
    }
    // Main-table placeholders pointing to f-block rows (MCAT-style *)
    const placeholders = [
      { x: 3, y: 6, label: "*", title: "Lanthanides" },
      { x: 3, y: 7, label: "**", title: "Actinides" },
    ];

    const maxY = 10;
    const maxX = 18;
    const cells = [];

    for (let y = 1; y <= maxY; y++) {
      for (let x = 1; x <= maxX; x++) {
        const ph = placeholders.find((p) => p.x === x && p.y === y);
        if (ph) {
          cells.push(
            `<span class="pt-cell pt-placeholder" style="grid-column:${x};grid-row:${y}" title="${ph.title}">${ph.label}</span>`
          );
          continue;
        }
        const el = byXY.get(`${x}-${y}`);
        if (!el) {
          // Gap row between main table and f-block
          if (y === 8) {
            cells.push(
              `<span class="pt-cell spacer" style="grid-column:${x};grid-row:${y}"></span>`
            );
            continue;
          }
          if (y <= 7 || (y >= 9 && x >= 3)) {
            cells.push(
              `<span class="pt-cell empty" style="grid-column:${x};grid-row:${y}"></span>`
            );
          }
          continue;
        }
        cells.push(
          `<button type="button" class="pt-cell" data-z="${el.z}" style="grid-column:${x};grid-row:${y}" title="${el.name}">
            <span class="pt-z">${el.z}</span>
            <span class="pt-sym">${el.sym}</span>
            <span class="pt-mass">${el.mass}</span>
          </button>`
        );
      }
    }
    return cells.join("");
  }

  function selectElement(z) {
    const el = byZ(z);
    if (!el || !root) return;
    selected = el;
    root.querySelectorAll(".pt-cell.selected").forEach((c) => c.classList.remove("selected"));
    const cell = root.querySelector(`[data-z="${z}"]`);
    if (cell) cell.classList.add("selected");
    const detail = root.querySelector("[data-pt-detail]");
    detail.innerHTML = `
      <div class="pt-detail-card">
        <p class="pt-detail-z">Atomic number <strong>${el.z}</strong></p>
        <p class="pt-detail-sym">${el.sym}</p>
        <p class="pt-detail-name">${el.name}</p>
        <dl class="pt-detail-facts">
          <div><dt>Symbol</dt><dd>${el.sym}</dd></div>
          <div><dt>Atomic number (Z)</dt><dd>${el.z}</dd></div>
          <div><dt>Atomic weight</dt><dd>${el.mass}</dd></div>
        </dl>
      </div>
    `;
  }

  function playSnap(mode) {
    const stage = root.querySelector(".snap-stage");
    if (!stage) return Promise.resolve();
    stage.classList.remove("play-open", "play-close");
    void stage.offsetWidth;
    stage.classList.add(mode === "open" ? "play-open" : "play-close");
    if (window.GameMusic?.playUi) {
      window.GameMusic.playUi(mode === "open" ? "whoosh" : "cast");
    }
    return new Promise((resolve) => {
      setTimeout(resolve, mode === "open" ? 420 : 480);
    });
  }

  async function openOverlay() {
    if (open || animating) return;
    ensureRoot();
    animating = true;
    open = true;
    root.setAttribute("aria-hidden", "false");
    root.classList.add("is-visible");
    root.classList.remove("is-vanishing");
    // Force reflow so slide-in runs
    void root.offsetWidth;
    root.classList.add("is-open");
    selected = null;
    const detail = root.querySelector("[data-pt-detail]");
    if (detail) {
      detail.innerHTML = `
        <p class="pt-detail-hint">Tap an element for name &amp; mass.</p>
        <p class="pt-detail-fine">Same facts as a standard MCAT periodic table — use it, then close.</p>
      `;
    }
    root.querySelectorAll(".pt-cell.selected").forEach((c) => c.classList.remove("selected"));
    await playSnap("open");
    animating = false;
    const closeBtn = root.querySelector(".pt-close-btn");
    if (closeBtn) closeBtn.focus();
  }

  async function close() {
    if (!open || animating) return;
    animating = true;
    root.classList.add("is-vanishing");
    root.classList.remove("is-open");
    await playSnap("close");
    root.classList.remove("is-visible", "is-vanishing");
    root.setAttribute("aria-hidden", "true");
    open = false;
    animating = false;
  }

  function toggle() {
    if (open) close();
    else openOverlay();
  }

  function isOpen() {
    return open;
  }

  window.PeriodicTable = {
    open: openOverlay,
    close,
    toggle,
    isOpen,
  };
})();
