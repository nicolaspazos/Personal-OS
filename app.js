/* ============================================================================
   NICOLAS OS · app.js
   Wires config.js -> the UI, and persists your live data to localStorage.
   No build step, no servers. Plain browser JavaScript.
   ============================================================================ */
(function () {
  "use strict";

  var CFG = window.CONFIG || {};
  var RM = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- tiny DOM helpers ---------- */
  function el(id) { return document.getElementById(id); }
  function qsa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function uid() { return "x" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  /* ---------- storage (with in-memory fallback for locked file:// origins) ---------- */
  var NS = "nicolas-os:", mem = {};
  function rawGet(k) { try { return localStorage.getItem(k); } catch (e) { return k in mem ? mem[k] : null; } }
  function rawSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } }
  function rawDel(k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } }
  function load(key, fb) { var r = rawGet(NS + key); if (r == null) return fb; try { return JSON.parse(r); } catch (e) { return fb; } }
  function save(key, val) { rawSet(NS + key, JSON.stringify(val)); }
  var STORE_KEYS = ["days", "tasks", "project", "clients", "goals", "reading", "reviews", "theme", "tab", "blockers"];

  /* ---------- date helpers ---------- */
  function dateKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  function shiftDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function dayOfYear(d) { return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000); }
  function mondayOf(d) { var x = new Date(d); var dow = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dow); x.setHours(0, 0, 0, 0); return x; }
  function isoWeek(d) {
    var x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var dn = (x.getUTCDay() + 6) % 7; x.setUTCDate(x.getUTCDate() - dn + 3);
    var first = new Date(Date.UTC(x.getUTCFullYear(), 0, 4));
    var wk = 1 + Math.round(((x - first) / 86400000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
    return x.getUTCFullYear() + "-W" + ("0" + wk).slice(-2);
  }
  var DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  var DOWL = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  var MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  function hm(str) { var p = String(str).split(":"); return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0); }

  /* ---------- per-day record (habits, focus, oneThing, health) ---------- */
  function getDays() { return load("days", {}); }
  function dayRec(k) { var d = getDays()[k || dateKey()]; return d || {}; }
  function writeDay(fn) {
    var days = getDays(), k = dateKey(), rec = days[k] || { habits: {}, health: {} };
    rec.habits = rec.habits || {}; rec.health = rec.health || {};
    fn(rec); days[k] = rec; save("days", days);
  }

  /* ---------- habit scoring + streak ---------- */
  function scoreOf(rec) {
    var hs = (CFG.habits || []), sum = 0, n = hs.length || 1;
    hs.forEach(function (h) {
      var v = rec.habits ? rec.habits[h.id] : undefined;
      if (h.type === "counter") sum += clamp((+v || 0) / (h.target || 1), 0, 1);
      else sum += v ? 1 : 0;
    });
    return sum / n;
  }
  function doneCount(rec) {
    var hs = (CFG.habits || []), c = 0;
    hs.forEach(function (h) {
      var v = rec.habits ? rec.habits[h.id] : undefined;
      if (h.type === "counter") { if ((+v || 0) >= (h.target || 1)) c++; }
      else if (v) c++;
    });
    return c;
  }
  function dayCounts(k) { var days = getDays(); return days[k] ? scoreOf(days[k]) >= (CFG.streakThreshold || 0.7) : false; }
  function currentStreak() {
    var n = 0, cur = new Date();
    if (!dayCounts(dateKey(cur))) cur = shiftDays(cur, -1); // today still in progress: count from yesterday
    for (var i = 0; i < 400; i++) { if (dayCounts(dateKey(cur))) { n++; cur = shiftDays(cur, -1); } else break; }
    return n;
  }
  function chainDots(containerId, days) {
    var c = el(containerId); if (!c) return;
    var html = "", base = new Date();
    for (var i = days - 1; i >= 0; i--) html += '<i class="' + (dayCounts(dateKey(shiftDays(base, -i))) ? "on" : "") + '"></i>';
    c.innerHTML = html;
  }

  /* ---------- rings ---------- */
  function setRing(node, pct) { if (node) node.setAttribute("stroke-dasharray", clamp(Math.round(pct), 0, 100) + " 100"); }

  /* ============================== RENDER: SESSION + CLOCK ============================== */
  var tzCity = (CFG.operator && CFG.operator.city) || (function () {
    try { var z = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; return z.split("/").pop().replace(/_/g, " "); } catch (e) { return "LOCAL"; }
  })();
  function utcLabel(d) { var o = -d.getTimezoneOffset() / 60; return "UTC" + (o >= 0 ? "+" : "") + o; }

  function tickClock() {
    var d = new Date();
    var hh = ("0" + d.getHours()).slice(-2), mm = ("0" + d.getMinutes()).slice(-2), ss = ("0" + d.getSeconds()).slice(-2);
    var part = d.getHours() < 12 ? "morning" : d.getHours() < 18 ? "afternoon" : "evening";
    var first = esc((CFG.operator && CFG.operator.name || "Operator").split(" ")[0]);
    if (el("greet")) el("greet").innerHTML = "Good " + part + ", <i>" + first + "</i>.";
    if (el("when")) el("when").textContent = DOWL[d.getDay()] + ", " + MON[d.getMonth()] + " " + d.getDate();
    if (el("clock")) el("clock").innerHTML = hh + ":" + mm + '<span class="sec">:' + ss + "</span>";
    if (el("clockMeta")) el("clockMeta").innerHTML = tzCity.toUpperCase() + " · " + utcLabel(d) + "<br>DAY " + dayOfYear(d) + " / 365";
    if (el("dayFill")) el("dayFill").style.width = (dayOfYear(d) / 365 * 100).toFixed(1) + "%";
    if (el("sysClock")) el("sysClock").textContent = hh + ":" + mm;
    if (el("sysDate")) el("sysDate").textContent = MON[d.getMonth()] + " " + d.getDate();
    if (el("sysLoc")) el("sysLoc").textContent = tzCity.toUpperCase() + " · " + utcLabel(d);
    renderCalendarNow(d);
  }

  /* ============================== RENDER: OPERATOR ============================== */
  function renderOperator() {
    var op = CFG.operator || {};
    if (el("opName")) el("opName").textContent = op.name || "Operator";
    if (el("opSub")) el("opSub").innerHTML = esc(op.role || "") + " · <b>" + esc(op.org || "") + "</b>";
    if (el("avatar")) el("avatar").textContent = op.initials || "OS";
    if (el("streakVal")) el("streakVal").textContent = currentStreak();
    // focus picker
    var rec = dayRec(), cur = rec.focus || op.defaultFocus || (op.focusStates || [])[0] || "FOCUS";
    var fp = el("focusPick");
    if (fp) {
      fp.innerHTML = (op.focusStates || []).map(function (f) {
        return '<button data-focus="' + esc(f) + '" class="' + (f === cur ? "on" : "") + '">' + esc(f) + "</button>";
      }).join("");
    }
    if (el("sessState")) el("sessState").textContent = cur;
    chainDots("chain", 14);
  }

  /* ============================== RENDER: HABITS ============================== */
  function renderHabits() {
    var rec = dayRec(), hs = CFG.habits || [];
    var box = el("habitList");
    if (box) {
      box.innerHTML = hs.map(function (h) {
        var v = rec.habits ? rec.habits[h.id] : undefined;
        var cat = '<span class="cat cat-' + esc(h.cat) + '">' + esc(h.cat) + "</span>";
        if (h.type === "counter") {
          var n = +v || 0, full = n >= (h.target || 1);
          return '<div class="habit' + (full ? " done" : "") + '">' +
            '<div class="box" style="visibility:hidden"></div>' +
            '<span class="lab">' + esc(h.label) + "</span>" + cat +
            '<div class="counter" data-h="' + h.id + '">' +
            '<button data-act="dec">−</button><span class="n"><b>' + n + "</b>/" + (h.target || 1) + "</span>" +
            '<button data-act="inc">+</button></div></div>';
        }
        return '<div class="habit' + (v ? " done" : "") + '" data-h="' + h.id + '" data-act="toggle">' +
          '<div class="box">✓</div><span class="lab">' + esc(h.label) + "</span>" + cat + "</div>";
      }).join("");
    }
    var pct = Math.round(scoreOf(rec) * 100), dc = doneCount(rec);
    setRing(el("habitRing"), pct);
    if (el("habitPct")) el("habitPct").textContent = pct + "%";
    if (el("habitStat")) el("habitStat").textContent = dc + "/" + hs.length + " · " + pct + "%";
    if (el("habitMsg")) el("habitMsg").textContent =
      pct >= 100 ? "Day complete. ▲" : pct >= 70 ? "Almost there." : pct >= 30 ? "Keep going." : "Start with one.";
    renderMomentum();
  }

  function renderMomentum() {
    // 7-day completion average
    var sum = 0, base = new Date();
    for (var i = 0; i < 7; i++) { var k = dateKey(shiftDays(base, -i)); var days = getDays(); sum += days[k] ? scoreOf(days[k]) : 0; }
    var pct = Math.round(sum / 7 * 100), st = currentStreak();
    setRing(el("momRing"), pct);
    if (el("momPct")) el("momPct").textContent = pct + "%";
    if (el("momStreak")) el("momStreak").textContent = st;
    if (el("momSub")) el("momSub").textContent = st === 0 ? "Win today to start the chain." : st < 3 ? "Chain started — protect it." : "Strong. Don't break it.";
    if (el("streakVal")) el("streakVal").textContent = st;
    chainDots("momChain", 14);
    chainDots("chain", 14);
  }

  /* ============================== RENDER: TASKS ============================== */
  var TIERS = [["today", "TODAY"], ["week", "THIS WEEK"], ["month", "THIS MONTH"], ["someday", "SOMEDAY"]];
  function getTasks() { return load("tasks", CFG.tasks || []); }
  function renderTasks() {
    var tasks = getTasks(), box = el("taskList"); if (!box) return;
    var open = tasks.filter(function (t) { return !t.done; }).length;
    if (el("taskStat")) el("taskStat").textContent = open + " open";
    var html = "";
    TIERS.forEach(function (tr) {
      var list = tasks.filter(function (t) { return t.urgency === tr[0]; });
      if (!list.length) return;
      list.sort(function (a, b) { return (a.done ? 1 : 0) - (b.done ? 1 : 0) || (b.key ? 1 : 0) - (a.key ? 1 : 0); });
      html += '<div class="tier"><div class="th"><span>' + tr[1] + "</span><span>" + list.length + "</span></div>";
      list.forEach(function (t) {
        html += '<div class="task' + (t.done ? " done" : "") + '">' +
          '<div class="box" data-id="' + t.id + '" data-act="task-toggle">✓</div>' +
          '<span class="t">' + esc(t.title) + "</span>" +
          (t.key ? '<span class="key">◆</span>' : "") +
          (t.est ? '<span class="est">' + t.est + "m</span>" : "") +
          '<button class="del" data-id="' + t.id + '" data-act="task-del" title="remove">✕</button></div>';
      });
      html += "</div>";
    });
    box.innerHTML = html || '<div class="creed">No tasks. Add your first above.</div>';
  }

  /* ============================== RENDER: CALENDAR ============================== */
  function renderWeekStrip() {
    var strip = el("weekStrip"); if (!strip) return;
    var mon = mondayOf(new Date()), tk = dateKey(new Date()), html = "";
    for (var i = 0; i < 7; i++) {
      var d = shiftDays(mon, i), isT = dateKey(d) === tk;
      html += '<div class="day' + (isT ? " today" : "") + '"><div class="dow">' + DOW[d.getDay()] + '</div><div class="dnum">' + ("0" + d.getDate()).slice(-2) + "</div></div>";
    }
    strip.innerHTML = html;
    if (el("calMonth")) el("calMonth").textContent = MON[new Date().getMonth()] + " " + new Date().getFullYear();
  }
  function renderCalendarNow(now) {
    var box = el("blocks"); if (!box) return;
    var cal = (CFG.calendar || []).slice().sort(function (a, b) { return hm(a.start) - hm(b.start); });
    var cur = now.getHours() * 60 + now.getMinutes();
    box.innerHTML = cal.map(function (b) {
      var s = hm(b.start), e = hm(b.end || b.start), isNow = cur >= s && cur < e, past = e <= cur;
      return '<div class="block' + (isNow ? " now" : past ? " past" : "") + '">' +
        '<div class="time">' + esc(b.start) + "<br>" + esc(b.end || "") + "</div>" +
        '<div class="ti">' + esc(b.title) + (b.sub ? "<span>" + esc(b.sub) + "</span>" : "") + "</div>" +
        (isNow ? '<span class="nowtag">NOW</span>' : '<span class="tag">' + esc(b.tag || "") + "</span>") + "</div>";
    }).join("");
  }

  /* ============================== RENDER: ACTIVE PROJECT ============================== */
  function getProject() { return load("project", CFG.activeProject || { name: "—", phase: "", due: "", checklist: [] }); }
  function renderProject() {
    var p = getProject(), cl = p.checklist || [];
    var done = cl.filter(function (c) { return c.done; }).length, pct = cl.length ? Math.round(done / cl.length * 100) : 0;
    qsa(".js-projName").forEach(function (n) { n.textContent = p.name; });
    qsa(".js-projMeta").forEach(function (n) { n.textContent = (p.phase || "") + (p.due ? " · due " + p.due : ""); });
    qsa(".js-projPct").forEach(function (n) { n.textContent = pct + "%"; });
    qsa(".js-projRing").forEach(function (n) { setRing(n, pct); });
    qsa(".js-projChecklist").forEach(function (box) {
      box.innerHTML = cl.map(function (c) {
        return '<div class="ck' + (c.done ? " done" : "") + '" data-id="' + c.id + '" data-act="proj-toggle"><div class="box">✓</div><span>' + esc(c.label) + "</span></div>";
      }).join("");
    });
  }

  /* ============================== RENDER: CRM (work) ============================== */
  var CTIERS = [["overdue", "OVERDUE"], ["today", "TODAY"], ["week", "THIS WEEK"], ["later", "LATER"]];
  var HEATS = ["COOL", "WARM", "HOT"];
  function getClients() { return load("clients", CFG.clients || []); }
  function renderCRM() {
    var cs = getClients(), box = el("crmCols"); if (!box) return;
    if (el("crmStat")) el("crmStat").textContent = cs.length + " open";
    box.innerHTML = CTIERS.map(function (tr) {
      var list = cs.filter(function (c) { return c.tier === tr[0]; });
      var cards = list.map(function (c) {
        return '<div class="lead"><div class="nm">' + esc(c.name) + "</div>" +
          '<div class="no">' + esc(c.note) + (c.stuck ? ' · stuck ' + c.stuck + "d" : "") + "</div>" +
          '<div class="ft"><span class="tag">' + esc(c.tag || "") + "</span>" +
          '<span><button class="heat ' + esc(c.heat) + '" data-id="' + c.id + '" data-act="crm-heat">' + esc(c.heat) + "</button> " +
          '<button class="del" style="opacity:.6" data-id="' + c.id + '" data-act="crm-prev" title="move back">‹</button>' +
          '<button class="del" style="opacity:.6" data-id="' + c.id + '" data-act="crm-next" title="move forward">›</button>' +
          '<button class="del" style="opacity:.6" data-id="' + c.id + '" data-act="crm-del" title="remove">✕</button></span></div></div>';
      }).join("");
      return '<div class="crm-col ' + tr[0] + '"><div class="ch"><span>' + tr[1] + "</span><span>" + list.length + "</span></div>" +
        cards + (tr[0] === "today" ? '<button class="btn ghost" data-act="crm-add" style="width:100%;margin-top:4px">+ ADD LEAD</button>' : "") + "</div>";
    }).join("");
  }

  /* ============================== RENDER: BLOCKERS ============================== */
  function renderBlockers() {
    var bs = load("blockers", CFG.blockers || []), box = el("blockerList"); if (!box) return;
    if (el("blockStat")) el("blockStat").textContent = bs.length + " active";
    box.innerHTML = bs.length ? bs.map(function (b) {
      return '<div class="lead"><div class="nm">' + esc(b.what) + "</div>" +
        '<div class="ft"><span class="tag">OWNER ' + esc(b.owner) + " · STUCK " + (b.stuck || 0) + "d</span>" +
        '<span class="heat ' + esc(b.heat) + '">' + esc(b.heat) + "</span></div></div>";
    }).join("") : '<div class="creed">No blockers. Clear runway. ✓</div>';
  }

  /* ============================== RENDER: GROWTH (reading/goals/health) ============================== */
  function renderReading() {
    var r = load("reading", CFG.reading || { current: {}, next: {} });
    var c = r.current || {}, n = r.next || {};
    if (el("readTitle")) el("readTitle").textContent = c.title || "—";
    if (el("readAuthor")) el("readAuthor").textContent = c.author || "";
    if (el("readBar")) el("readBar").style.width = clamp(c.progress || 0, 0, 100) + "%";
    if (el("readPctStat")) el("readPctStat").textContent = (c.progress || 0) + "%";
    if (el("readNext")) el("readNext").textContent = (n.title || "—") + (n.author ? " · " + n.author : "");
  }
  function getGoals() { return load("goals", CFG.goals || { week: [], month: [] }); }
  function renderGoals() {
    var g = getGoals();
    [["week", "goalsWeek", "gwStat"], ["month", "goalsMonth", "gmStat"]].forEach(function (s) {
      var list = g[s[0]] || [], box = el(s[1]); if (!box) return;
      var done = list.filter(function (i) { return i.done; }).length;
      if (el(s[2])) el(s[2]).textContent = done + "/" + list.length;
      box.innerHTML = list.map(function (i) {
        return '<div class="goal' + (i.done ? " done" : "") + '" data-scope="' + s[0] + '" data-id="' + i.id + '" data-act="goal-toggle">' +
          '<div class="box">✓</div><span>' + esc(i.label) + "</span>" +
          '<button class="del" data-scope="' + s[0] + '" data-id="' + i.id + '" data-act="goal-del">✕</button></div>';
      }).join("");
    });
  }
  function renderHealth() {
    var rec = dayRec(), h = rec.health || {}, g = CFG.health || {};
    if (el("hWater")) el("hWater").textContent = h.water || 0;
    if (el("hSteps")) el("hSteps").textContent = (h.steps || 0) + "k";
    if (el("hSleep")) el("hSleep").textContent = (h.sleep || 0) + "h";
    if (el("hWaterGoal")) el("hWaterGoal").textContent = "WATER /" + (g.waterGoal || 8);
    if (el("hStepsGoal")) el("hStepsGoal").textContent = "STEPS /" + Math.round((g.stepsGoal || 8000) / 1000) + "k";
    if (el("hSleepGoal")) el("hSleepGoal").textContent = "SLEEP /" + (g.sleepGoalH || 8);
  }

  /* ============================== RENDER: REVIEW ============================== */
  function renderReview() {
    var grid = el("reviewGrid"); if (!grid) return;
    var wk = isoWeek(new Date()), reviews = load("reviews", {}), data = reviews[wk] || {};
    var mon = mondayOf(new Date()), sun = shiftDays(mon, 6);
    if (el("reviewWeek")) el("reviewWeek").textContent = wk.split("-")[1];
    if (el("reviewRange")) el("reviewRange").textContent =
      MON[mon.getMonth()] + " " + mon.getDate() + " → " + MON[sun.getMonth()] + " " + sun.getDate();
    grid.innerHTML = (CFG.reviewSections || []).map(function (s) {
      return '<div class="rsec"><label>' + esc(s.label) + "</label>" +
        '<textarea data-rev="' + esc(s.id) + '" placeholder="…">' + esc(data[s.id] || "") + "</textarea></div>";
    }).join("");
  }

  /* ============================== FULL RENDER ============================== */
  function renderAll() {
    renderOperator(); renderHabits(); renderTasks(); renderWeekStrip(); renderCalendarNow(new Date());
    renderProject(); renderCRM(); renderBlockers(); renderReading(); renderGoals(); renderHealth(); renderReview();
    // session one-thing + creed
    if (el("oneThing")) el("oneThing").value = dayRec().oneThing || "";
    if (el("creed")) el("creed").textContent = CFG.creed || "";
    if (el("osName")) el("osName").innerHTML = esc((CFG.system && CFG.system.osName || "NICOLAS OS").replace(/\s*OS$/, "")) + " <b>OS</b>";
    if (el("osVer")) el("osVer").textContent = "// " + ((CFG.system && CFG.system.version) || "V1.0");
  }

  /* ============================== EVENTS ============================== */
  // delegated clicks
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act]"); if (!t) return;
    var act = t.getAttribute("data-act"), id = t.getAttribute("data-id"), scope = t.getAttribute("data-scope");

    if (act === "toggle") {                                   // habit toggle
      var hid = t.getAttribute("data-h");
      writeDay(function (r) { r.habits[hid] = !r.habits[hid]; });
      renderHabits();
    } else if (act === "inc" || act === "dec") {               // habit counter
      var cwrap = t.closest("[data-h]"), cid = cwrap.getAttribute("data-h");
      var hcfg = (CFG.habits || []).filter(function (h) { return h.id === cid; })[0] || { target: 99 };
      writeDay(function (r) { r.habits[cid] = clamp((+r.habits[cid] || 0) + (act === "inc" ? 1 : -1), 0, hcfg.target); });
      renderHabits();
    } else if (act === "task-toggle") {
      var ts = getTasks(); ts.forEach(function (x) { if (x.id === id) x.done = !x.done; }); save("tasks", ts); renderTasks();
    } else if (act === "task-del") {
      save("tasks", getTasks().filter(function (x) { return x.id !== id; })); renderTasks();
    } else if (act === "proj-toggle") {
      var p = getProject(); (p.checklist || []).forEach(function (c) { if (c.id === id) c.done = !c.done; }); save("project", p); renderProject();
    } else if (act === "goal-toggle") {
      var g = getGoals(); (g[scope] || []).forEach(function (i) { if (i.id === id) i.done = !i.done; }); save("goals", g); renderGoals();
    } else if (act === "goal-del") {
      var g2 = getGoals(); g2[scope] = (g2[scope] || []).filter(function (i) { return i.id !== id; }); save("goals", g2); renderGoals();
    } else if (act && act.indexOf("crm-") === 0) {
      handleCRM(act, id);
    } else if (t.hasAttribute("data-focus")) { /* handled below */ }
  });

  // focus picker
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-focus]"); if (!b) return;
    var f = b.getAttribute("data-focus");
    writeDay(function (r) { r.focus = f; }); renderOperator();
  });

  function handleCRM(act, id) {
    var cs = getClients();
    if (act === "crm-add") {
      var name = prompt("New lead / client name:"); if (!name) return;
      cs.unshift({ id: uid(), name: name, note: "New — set next step", tag: "new", tier: "today", heat: "WARM", stuck: 0 });
    } else if (act === "crm-del") {
      cs = cs.filter(function (c) { return c.id !== id; });
    } else {
      var order = ["overdue", "today", "week", "later"];
      cs.forEach(function (c) {
        if (c.id !== id) return;
        if (act === "crm-heat") c.heat = HEATS[(HEATS.indexOf(c.heat) + 1) % 3];
        if (act === "crm-next") c.tier = order[clamp(order.indexOf(c.tier) + 1, 0, 3)];
        if (act === "crm-prev") c.tier = order[clamp(order.indexOf(c.tier) - 1, 0, 3)];
      });
    }
    save("clients", cs); renderCRM();
  }

  // forms
  function bindAdd(formId, inputId, fn) {
    var f = el(formId); if (!f) return;
    f.addEventListener("submit", function (e) { e.preventDefault(); var v = el(inputId).value.trim(); if (!v) return; fn(v); el(inputId).value = ""; });
  }
  bindAdd("taskForm", "taskAdd", function (v) {
    var ts = getTasks(); ts.unshift({ id: uid(), title: v, urgency: "today", key: false, est: 0, cat: "WORK", done: false }); save("tasks", ts); renderTasks();
    toast("Task added");
  });
  bindAdd("gwForm", "gwAdd", function (v) { var g = getGoals(); (g.week = g.week || []).unshift({ id: uid(), label: v, done: false }); save("goals", g); renderGoals(); });
  bindAdd("gmForm", "gmAdd", function (v) { var g = getGoals(); (g.month = g.month || []).unshift({ id: uid(), label: v, done: false }); save("goals", g); renderGoals(); });
  bindAdd("oneThingForm", "oneThing", function (v) { writeDay(function (r) { r.oneThing = v; }); toast("Locked in: " + v); });

  // reading buttons
  function bumpRead(delta) {
    var r = load("reading", CFG.reading || { current: {}, next: {} });
    r.current = r.current || {}; r.current.progress = clamp((r.current.progress || 0) + delta, 0, 100);
    save("reading", r); renderReading();
    if (r.current.progress >= 100) toast("Book finished. ▲ Queue the next one.");
  }
  if (el("readPlus")) el("readPlus").addEventListener("click", function () { bumpRead(5); });
  if (el("readMinus")) el("readMinus").addEventListener("click", function () { bumpRead(-5); });

  // health +/- buttons
  qsa("[data-h][data-d]").forEach(function (b) {
    b.addEventListener("click", function () {
      var key = b.getAttribute("data-h"), d = parseInt(b.getAttribute("data-d"), 10);
      writeDay(function (r) { r.health[key] = clamp((+r.health[key] || 0) + d, 0, 999); });
      renderHealth();
    });
  });

  // review autosave
  document.addEventListener("input", function (e) {
    var ta = e.target.closest("[data-rev]"); if (!ta) return;
    var wk = isoWeek(new Date()), reviews = load("reviews", {}); reviews[wk] = reviews[wk] || {};
    reviews[wk][ta.getAttribute("data-rev")] = ta.value; save("reviews", reviews);
    flashSaved();
  });
  var savedT;
  function flashSaved() { var s = el("reviewSaved"); if (!s) return; s.textContent = "SAVING…"; clearTimeout(savedT); savedT = setTimeout(function () { s.textContent = "AUTO-SAVED"; }, 600); }
  if (el("sealBtn")) el("sealBtn").addEventListener("click", function () { toast("Week sealed ✓ — fresh start unlocked."); });

  /* ============================== TABS ============================== */
  function showView(name) {
    qsa(".view").forEach(function (v) { v.classList.toggle("active", v.id === "view-" + name); });
    qsa(".nav button").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-view") === name); });
    save("tab", name);
  }
  qsa(".nav button").forEach(function (b) { b.addEventListener("click", function () { showView(b.getAttribute("data-view")); }); });

  /* ============================== THEME + MATRIX RAIN ============================== */
  var THEMES = ["jarvis", "batman", "matrix"];
  function applyTheme(th) {
    if (THEMES.indexOf(th) < 0) th = "jarvis";
    document.documentElement.setAttribute("data-theme", th);
    if (el("themeBtn")) el("themeBtn").textContent = "◑ " + th.toUpperCase();
    save("theme", th);
    if (th === "matrix") startRain(); else stopRain();
  }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute("data-theme") || "jarvis";
    applyTheme(THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length]);
  }
  if (el("themeBtn")) el("themeBtn").addEventListener("click", toggleTheme);
  if (el("themeBtn2")) el("themeBtn2").addEventListener("click", toggleTheme);

  // ---- digital rain (Matrix theme only) ----
  var RAIN = { cv: null, ctx: null, raf: 0, drops: null, on: false, fs: 15, bound: false };
  var GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎ0123456789Z:=*+-<>|".split("");
  function rainResize() {
    if (!RAIN.cv) return;
    RAIN.cv.width = window.innerWidth; RAIN.cv.height = window.innerHeight;
    var cols = Math.ceil(RAIN.cv.width / RAIN.fs);
    RAIN.drops = []; for (var i = 0; i < cols; i++) RAIN.drops[i] = Math.random() * -100;
  }
  function rainStep() {
    var c = RAIN.ctx, w = RAIN.cv.width, h = RAIN.cv.height, fs = RAIN.fs;
    c.fillStyle = "rgba(0, 8, 2, 0.07)"; c.fillRect(0, 0, w, h);
    c.font = fs + "px ui-monospace, monospace";
    for (var i = 0; i < RAIN.drops.length; i++) {
      var ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      var x = i * fs, y = RAIN.drops[i] * fs;
      c.fillStyle = Math.random() > 0.975 ? "#d9ffe2" : "rgba(0, 255, 65, 0.85)";
      c.fillText(ch, x, y);
      if (y > h && Math.random() > 0.975) RAIN.drops[i] = 0;
      RAIN.drops[i] += 0.5;
    }
    RAIN.raf = requestAnimationFrame(rainStep);
  }
  function startRain() {
    if (RM || RAIN.on) return;
    RAIN.cv = document.getElementById("rain"); if (!RAIN.cv) return;
    RAIN.ctx = RAIN.cv.getContext("2d");
    RAIN.cv.style.opacity = "0.58";
    rainResize(); RAIN.on = true;
    if (!RAIN.bound) { window.addEventListener("resize", rainResize); RAIN.bound = true; }
    rainStep();
  }
  function stopRain() {
    if (RAIN.raf) cancelAnimationFrame(RAIN.raf);
    RAIN.raf = 0; RAIN.on = false;
    if (RAIN.cv) { RAIN.cv.style.opacity = "0"; if (RAIN.ctx) RAIN.ctx.clearRect(0, 0, RAIN.cv.width, RAIN.cv.height); }
  }

  /* ============================== SETTINGS DRAWER ============================== */
  function drawer(open) { el("drawer").classList.toggle("open", open); el("drawerBg").classList.toggle("open", open); }
  if (el("settingsBtn")) el("settingsBtn").addEventListener("click", function () { drawer(true); });
  if (el("drawerBg")) el("drawerBg").addEventListener("click", function () { drawer(false); });

  if (el("exportBtn")) el("exportBtn").addEventListener("click", function () {
    var dump = {}; STORE_KEYS.forEach(function (k) { var v = rawGet(NS + k); if (v != null) dump[k] = JSON.parse(v); });
    var blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "nicolas-os-backup-" + dateKey() + ".json"; a.click(); toast("Backup downloaded");
  });
  if (el("importBtn")) el("importBtn").addEventListener("click", function () { el("importFile").click(); });
  if (el("importFile")) el("importFile").addEventListener("change", function (e) {
    var f = e.target.files[0]; if (!f) return; var rd = new FileReader();
    rd.onload = function () { try { var data = JSON.parse(rd.result); Object.keys(data).forEach(function (k) { save(k, data[k]); }); location.reload(); } catch (err) { toast("Import failed — bad file"); } };
    rd.readAsText(f);
  });
  if (el("resetBtn")) el("resetBtn").addEventListener("click", function () {
    var days = getDays(); delete days[dateKey()]; save("days", days); renderAll(); drawer(false); toast("Today reset");
  });
  if (el("wipeBtn")) el("wipeBtn").addEventListener("click", function () {
    if (!confirm("Wipe ALL local data and restore defaults? This cannot be undone.")) return;
    STORE_KEYS.forEach(function (k) { rawDel(NS + k); }); location.reload();
  });
  if (el("bootBtn")) el("bootBtn").addEventListener("click", function () { drawer(false); runBoot(true); });

  /* ============================== TOAST ============================== */
  var toastT;
  function toast(msg) { var n = el("toast"); if (!n) return; n.textContent = msg; n.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { n.classList.remove("show"); }, 2200); }

  /* ============================== BOOT SEQUENCE ============================== */
  function runBoot(force) {
    var boot = el("boot"); if (!boot) return;
    boot.classList.remove("hide"); boot.style.visibility = "visible"; boot.style.opacity = "1";
    var lines = (CFG.system && CFG.system.bootLines) || ["INITIALIZING…", "ALL SYSTEMS NOMINAL"];
    var box = el("bootLines"), bar = el("bootBar"); box.innerHTML = ""; if (bar) bar.style.width = "0%";
    function finish() { boot.classList.add("hide"); setTimeout(function () { boot.style.visibility = "hidden"; }, 500); }
    if (RM) { box.innerHTML = lines.map(function (l, i) { return "<div class='in'>" + (i === lines.length - 1 ? "<b>" + esc(l) + "</b>" : esc(l)) + "</div>"; }).join(""); if (bar) bar.style.width = "100%"; setTimeout(finish, 350); return; }
    lines.forEach(function (l, i) {
      var div = document.createElement("div"); div.innerHTML = (i === lines.length - 1 ? "<b>" + esc(l) + "</b>" : esc(l)); box.appendChild(div);
      setTimeout(function () { div.classList.add("in"); if (bar) bar.style.width = Math.round((i + 1) / lines.length * 100) + "%"; }, 260 * i + 120);
    });
    setTimeout(finish, 260 * lines.length + 520);
  }
  if (el("boot")) el("boot").addEventListener("click", function () { el("boot").classList.add("hide"); setTimeout(function () { el("boot").style.visibility = "hidden"; }, 400); });

  /* ============================== INIT ============================== */
  applyTheme(load("theme", (CFG.system && CFG.system.defaultTheme) || "jarvis"));
  showView(load("tab", "home"));
  renderAll();
  tickClock();
  setInterval(tickClock, 1000);
  runBoot(false);

})();
