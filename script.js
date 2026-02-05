(() => {
  const STORAGE_KEY = "letter_closed_v1";
  const NOT_FOUND_PAGE = "404.html";

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const rand = (min, max) => Math.random() * (max - min) + min;

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
    try { return localStorage.getItem(STORAGE_KEY) === "1"; }
    catch { return false; }
  }

  function markClosed() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
  }

  function go404() {
    const path = (location.pathname || "").toLowerCase();
    if (path.endsWith("/" + NOT_FOUND_PAGE.toLowerCase())) return;
    location.replace(NOT_FOUND_PAGE);
  }

  // -------------------- AUDIO --------------------
  function setupAudioAlwaysTry() {
    const bgm = document.getElementById("bgm");
    if (!bgm) return;

    bgm.loop = true;
    bgm.volume = 0.35;

    let started = false;
    const tryPlay = async () => {
      if (started) return true;
      try { await bgm.play(); started = true; return true; }
      catch { return false; }
    };

    tryPlay();

    let attempts = 0;
    const retry = setInterval(async () => {
      attempts++;
      const ok = await tryPlay();
      if (ok || attempts >= 8) clearInterval(retry);
    }, 500);

    const onAny = async () => {
      const ok = await tryPlay();
      if (ok) window.removeEventListener("click", onAny, true);
    };

    window.addEventListener("pointerdown", onAny, true);
    window.addEventListener("touchstart", onAny, true);
    window.addEventListener("keydown", onAny, true);
    window.addEventListener("wheel", onAny, true);
    window.addEventListener("click", onAny, true);
  }

  // -------------------- AURORA --------------------
  function setupAurora() {
    const a = document.getElementById("aurora");
    if (!a) return;

    let ax = 50, ay = 25;

    const apply = () => {
      a.style.setProperty("--ax", ax + "%");
      a.style.setProperty("--ay", ay + "%");
    };

    const move = (x, y) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      ax = clamp((x / w) * 100, 0, 100);
      ay = clamp((y / h) * 100, 0, 100);
      apply();
    };

    window.addEventListener("mousemove", (e) => move(e.clientX, e.clientY), { passive: true });
    window.addEventListener("touchmove", (e) => {
      const t = e.touches && e.touches[0];
      if (t) move(t.clientX, t.clientY);
    }, { passive: true });

    window.addEventListener("pointerdown", () => { a.style.opacity = "1"; }, { passive: true });
    apply();
  }

  // -------------------- STARS --------------------
  function setupStars() {
    const canvas = document.getElementById("stars");
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    let stars = [];
    let rafId = 0;

    function resize() {
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      w = Math.floor(window.innerWidth);
      h = Math.floor(window.innerHeight);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(Math.min(140, Math.max(60, (w * h) / 22000)));

      stars = new Array(count).fill(0).map(() => ({
        x: rand(0, w),
        y: rand(0, h),
        r: rand(0.6, 1.6),
        p: rand(0, Math.PI * 2),
        s: rand(0.004, 0.016),
        a: rand(0.06, 0.18),
      }));
    }

    function step() {
      ctx.clearRect(0, 0, w, h);

      for (const st of stars) {
        st.p += st.s;
        const tw = (Math.sin(st.p) + 1) / 2;
        const alpha = st.a + tw * st.a * 0.9;

        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();

        if (tw > 0.98 && st.r > 1.1) {
          ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.35})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(st.x - 3, st.y);
          ctx.lineTo(st.x + 3, st.y);
          ctx.moveTo(st.x, st.y - 3);
          ctx.lineTo(st.x, st.y + 3);
          ctx.stroke();
        }
      }

      rafId = requestAnimationFrame(step);
    }

    function onVisibility() {
      if (document.hidden) cancelAnimationFrame(rafId);
      else { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(step); }
    }

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    step();
  }

  // -------------------- SNOW (parıltılı) --------------------
  function setupSnow() {
    const canvas = document.getElementById("snow");
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    let layers = [];
    let rafId = 0;

    function createLayer(count, speedMin, speedMax, radiusMin, radiusMax, alpha) {
      return {
        alpha,
        flakes: new Array(count).fill(0).map(() => ({
          x: rand(0, w),
          y: rand(0, h),
          r: rand(radiusMin, radiusMax),
          vx: rand(-0.25, 0.25),
          vy: rand(speedMin, speedMax),
          wobble: rand(0, Math.PI * 2),
          wobbleSpeed: rand(0.006, 0.02),
          tw: rand(0, 1),
          tws: rand(0.006, 0.02),
        })),
      };
    }

    function resize() {
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      w = Math.floor(window.innerWidth);
      h = Math.floor(window.innerHeight);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const base = Math.round(Math.min(190, Math.max(95, (w * h) / 11500)));

      layers = [
        createLayer(Math.round(base * 0.35), 0.35, 0.9, 0.7, 1.8, 0.33),
        createLayer(Math.round(base * 0.40), 0.7,  1.5, 1.0, 2.4, 0.52),
        createLayer(Math.round(base * 0.25), 1.2,  2.2, 1.6, 3.2, 0.68),
      ];
    }

    function step() {
      ctx.clearRect(0, 0, w, h);

      for (const layer of layers) {
        for (const f of layer.flakes) {
          f.wobble += f.wobbleSpeed;
          const drift = Math.sin(f.wobble) * 0.7;

          f.x += f.vx + drift * 0.18;
          f.y += f.vy;

          f.tw += f.tws;
          const tw = (Math.sin(f.tw) + 1) / 2;
          const sparkle = 0.55 + tw * 0.55;
          const a = Math.min(1, layer.alpha * sparkle);

          ctx.fillStyle = `rgba(255,255,255,${a})`;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();

          if (tw > 0.92 && f.r > 1.2) {
            ctx.strokeStyle = `rgba(255,255,255,${a * 0.35})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r + 2.2, 0, Math.PI * 2);
            ctx.stroke();
          }

          if (f.y > h + 10) { f.y = -12; f.x = rand(0, w); }
          if (f.x < -12) f.x = w + 12;
          if (f.x > w + 12) f.x = -12;
        }
      }

      rafId = requestAnimationFrame(step);
    }

    function onVisibility() {
      if (document.hidden) cancelAnimationFrame(rafId);
      else { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(step); }
    }

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    step();
  }

  // -------------------- REVEAL --------------------
  function setupReveal() {
    const items = Array.from(document.querySelectorAll(".reveal"));
    if (!items.length) return;

    let i = 0;
    const tick = () => {
      if (i >= items.length) return;
      items[i].classList.add("show");
      i++;
      setTimeout(tick, 170);
    };
    setTimeout(tick, 340);
  }

  // -------------------- CLICK FX --------------------
  function setupClickFX() {
    const fx = document.createElement("div");
    fx.id = "fx";
    document.body.appendChild(fx);

    const palette = [
      "rgba(111,103,255,0.85)",
      "rgba(255,111,177,0.80)",
      "rgba(120,255,200,0.70)",
      "rgba(255,255,255,0.80)"
    ];

    function spawn(x, y) {
      const isHeart = Math.random() < 0.28;
      const count = isHeart ? 12 : 16;

      for (let i = 0; i < count; i++) {
        const el = document.createElement("div");
        const c = palette[Math.floor(Math.random() * palette.length)];

        el.className = "spark" + (isHeart ? " heart" : "");
        el.style.background = c;
        el.style.left = x + "px";
        el.style.top = y + "px";
        el.style.animation = "pop 520ms ease-out forwards";

        const angle = rand(0, Math.PI * 2);
        const dist = isHeart ? rand(20, 70) : rand(25, 85);
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;

        requestAnimationFrame(() => {
          el.style.transform =
            `translate(${dx}px, ${dy}px) translate(-50%,-50%) ${isHeart ? "rotate(45deg)" : ""}`;
          el.style.opacity = "0";
        });

        fx.appendChild(el);
        setTimeout(() => el.remove(), 650);
      }
    }

    window.addEventListener("pointerdown", (e) => spawn(e.clientX, e.clientY), { passive: true });
  }

  // -------------------- PARALLAX + SHEEN --------------------
  function setupParallax() {
    const paper = document.getElementById("paper");
    const sheen = document.getElementById("sheen");
    if (!paper) return;

    let ticking = false;

    const update = () => {
      ticking = false;

      const scrollY = window.scrollY || window.pageYOffset || 0;
      const max = 520;
      const t = clamp(scrollY / max, 0, 1);

      const translateY = -t * 12;
      const rotateX =  t * 2.6;
      const rotateY = -t * 1.4;

      paper.style.transform =
        `translateY(${translateY}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

      paper.style.boxShadow =
        `0 ${22 + t * 12}px ${70 + t * 34}px rgba(0,0,0,${0.14 + t * 0.06})`;

      if (sheen) {
        const sx = -35 + t * 85;
        const sy = -40 + t * 95;
        const so = 0.04 + t * 0.18;

        sheen.style.opacity = String(so);
        sheen.style.transform = `translate3d(${sx}%, ${sy}%, 0) rotate(12deg)`;
      }
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // -------------------- CLOSE (vanish) --------------------
  function setupClose() {
    const btn = document.getElementById("fadeButton");
    const paper = document.getElementById("paper");
    if (!btn) return;

    btn.addEventListener("click", () => {
      markClosed();

      if (paper) paper.classList.add("vanish");

      const aur = document.getElementById("aurora");
      if (aur) {
        aur.style.opacity = "1";
        aur.style.filter = "blur(26px) saturate(1.15)";
      }

      setTimeout(() => go404(), 720);
    });
  }

  function boot() {
    if (isClosed()) { go404(); return; }

    setToday();
    setupAudioAlwaysTry();
    setupAurora();
    setupStars();
    setupSnow();
    setupReveal();
    setupClickFX();
    setupParallax();
    setupClose();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
