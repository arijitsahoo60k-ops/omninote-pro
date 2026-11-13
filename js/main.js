(function () {
  "use strict";
  var cfg = window.OMNINOTE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Toast ---------- */
  var toastEl = $("#toast"), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 3600);
  }

  /* ---------- Mobile nav ---------- */
  var navToggle = $("#navToggle"), navLinks = $("#navLinks");
  navToggle.addEventListener("click", function () {
    var open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  $$("a", navLinks).forEach(function (a) {
    a.addEventListener("click", function () {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- Download + issue links ---------- */
  var vl = $("#versionLine");
  var ver = String(cfg.version || "4");
  if (vl) vl.textContent = "Version " + ver + " · Android";
  $$("[data-version]").forEach(function (el) { el.textContent = ver; });
  document.title = "OmniNote Pro v" + ver + " – Free note-taking app for Redmi Pad Pro 5G";
  $$("[data-download]").forEach(function (a) {
    var inPage = a.getAttribute("href") === "#download";
    if (cfg.apkUrl && !inPage) a.setAttribute("href", cfg.apkUrl);
    a.addEventListener("click", function (e) {
      if (a.getAttribute("href") === "#download") return;
      if (!cfg.apkUrl) { e.preventDefault(); toast("APK link not set yet. Add it in js/config.js"); }
    });
  });
  $$("[data-issues]").forEach(function (a) {
    if (cfg.issuesUrl) { a.setAttribute("href", cfg.issuesUrl); a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); }
    a.addEventListener("click", function (e) {
      if (!cfg.issuesUrl) { e.preventDefault(); toast("Issues link not set yet. Add it in js/config.js"); }
    });
  });

  /* ---------- Device checker ---------- */
  var checkBtn = $("#checkBtn"), checkResult = $("#checkResult");
  function showCheck(model) {
    var ua = navigator.userAgent || "";
    var android = /Android/i.test(ua);
    var phone = /Mobile/i.test(ua);
    var msg;
    if (!android) {
      msg = "This browser isn't reporting Android. Open this page in Chrome on your tablet (turn off 'Desktop site').";
    } else if (phone) {
      msg = "Android phone detected. OmniNote Pro is made for tablets, so the layout may not fit.";
    } else {
      msg = "Android tablet detected. If it's a Redmi Pad Pro 5G, you're all set. On any other tablet it's untested – install it and tell us how it goes.";
    }
    if (model) msg += " (Model reported by browser: " + model + ")";
    checkResult.textContent = msg;
  }
  checkBtn.addEventListener("click", function () {
    var uad = navigator.userAgentData;
    if (uad && uad.getHighEntropyValues) {
      uad.getHighEntropyValues(["model"]).then(function (v) { showCheck(v && v.model); }, function () { showCheck(""); });
    } else {
      showCheck("");
    }
  });

  /* ---------- Writing pad ---------- */
  var canvas = $("#pad"), ctx = canvas.getContext("2d");
  var hint = $("#padHint");
  var tools = {
    ink:    { color: "#2b2566", width: 2.6, alpha: 1 },
    violet: { color: "#7c5cff", width: 2.6, alpha: 1 },
    marker: { color: "#ffd84d", width: 16,  alpha: 0.45 }
  };
  var tool = "ink", strokes = [], current = null, dpr = 1, w = 0, h = 0;

  function resize() {
    var r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = window.devicePixelRatio || 1;
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    redraw();
  }

  function drawStroke(s) {
    var t = tools[s.tool];
    ctx.save();
    ctx.globalAlpha = t.alpha;
    ctx.strokeStyle = t.color;
    ctx.fillStyle = t.color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    var p = s.pts;
    if (p.length === 1) {
      ctx.beginPath();
      ctx.arc(p[0].x, p[0].y, p[0].w / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (s.tool === "marker") {
      ctx.lineWidth = t.width;
      ctx.beginPath();
      ctx.moveTo(p[0].x, p[0].y);
      for (var i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y);
      ctx.stroke();
    } else {
      for (var j = 1; j < p.length; j++) {
        ctx.lineWidth = (p[j - 1].w + p[j].w) / 2;
        ctx.beginPath();
        ctx.moveTo(p[j - 1].x, p[j - 1].y);
        ctx.lineTo(p[j].x, p[j].y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function redraw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    strokes.forEach(drawStroke);
    if (current) drawStroke(current);
  }

  function point(e) {
    var r = canvas.getBoundingClientRect();
    var base = tools[tool].width;
    var pressure = (e.pointerType === "pen" && e.pressure > 0) ? e.pressure : 0.5;
    var width = tool === "marker" ? base : base * (0.6 + pressure * 1.2);
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: width };
  }

  canvas.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    current = { tool: tool, pts: [point(e)], id: e.pointerId };
    hint.classList.add("hide");
    redraw();
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!current || e.pointerId !== current.id) return;
    var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    if (!evs.length) evs = [e];
    evs.forEach(function (ev) { current.pts.push(point(ev)); });
    redraw();
  });
  function end(e) {
    if (!current || (e && e.pointerId !== current.id)) return;
    strokes.push(current);
    current = null;
    redraw();
  }
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  $$(".tool").forEach(function (b) {
    b.addEventListener("click", function () {
      tool = b.getAttribute("data-tool");
      $$(".tool").forEach(function (x) { x.classList.toggle("is-active", x === b); });
    });
  });
  $("#undoBtn").addEventListener("click", function () { strokes.pop(); redraw(); });
  $("#clearBtn").addEventListener("click", function () {
    strokes = []; current = null; redraw(); hint.classList.remove("hide");
  });

  window.addEventListener("resize", resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  resize();
})();
