/* ==========================================================
   Sürüm B (mobil uyumlu):
   - Butona basınca: localStorage işaretle + 404.html'e yönlendir
   - Sayfa açılışında: işaretliyse otomatik 404.html'e yönlendir
   - MP3: kontrol yok, loop; autoplay engellenirse ilk etkileşimde başlar
   ========================================================== */

(() => {
  const STORAGE_KEY = "letter_closed_v1";
  const NOT_FOUND_PAGE = "404.html";

  function setToday() {
    const el = document.getElementById("today");
    if (!el) return;
    const d = new Date();
    el.textContent = d.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function isClosed() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  }

  function markClosed() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
  }

  function go404() {
    const path = (location.pathname || "").toLowerCase();
    if (path.endsWith("/" + NOT_FOUND_PAGE.toLowerCase())) return;
    location.replace(NOT_FOUND_PAGE); // repo adıyla uyumlu göreli yönlendirme
  }

  function boot() {
    if (isClosed()) {
      go404();
      return;
    }

    setToday();

    // --- Arka plan müziği (kapatma yok) ---
    const bgm = document.getElementById("bgm");
    if (bgm) {
      bgm.volume = 0.35;

      const tryPlay = async () => {
        try { await bgm.play(); return true; }
        catch { return false; }
      };

      const armFirstInteraction = () => {
        const startOnce = async () => {
          const ok = await tryPlay();
          if (ok) cleanup();
        };

        const cleanup = () => {
          window.removeEventListener("pointerdown", startOnce, true);
          window.removeEventListener("keydown", startOnce, true);
          window.removeEventListener("wheel", startOnce, true);
          window.removeEventListener("touchstart", startOnce, true);
        };

        window.addEventListener("pointerdown", startOnce, true);
        window.addEventListener("keydown", startOnce, true);
        window.addEventListener("wheel", startOnce, true);
        window.addEventListener("touchstart", startOnce, true);
      };

      tryPlay().then((ok) => { if (!ok) armFirstInteraction(); });
    }

    // “Yok et” butonu
    const btn = document.getElementById("fadeButton");
    if (btn) {
      btn.addEventListener("click", () => {
        markClosed();
        go404();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
