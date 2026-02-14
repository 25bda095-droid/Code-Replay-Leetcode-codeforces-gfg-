// -------------------- DOM --------------------
const statusText = document.getElementById("statusText");
const webappEl = document.getElementById("webapp");

const patternEl = document.getElementById("pattern");
const statusEl = document.getElementById("status");
const revisionNeededEl = document.getElementById("revisionNeeded");
const remindersEl = document.getElementById("reminders");
const timeEl = document.getElementById("time");
const spaceEl = document.getElementById("space");
const approachEl = document.getElementById("approach");
const notesEl = document.getElementById("notes");

const saveBtn = document.getElementById("saveBtn");
const openDueBtn = document.getElementById("openDueBtn");

// UI extras (from popup.html)
const pill = document.getElementById("statusPill");
const pillText = document.getElementById("pillText");
const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");
const toastIcon = document.getElementById("toastIcon");

// -------------------- UI helpers (chips + toast) --------------------
let toastTimer = null;

function showToast(type, title, msg) {
  if (!toast || !toastText || !toastIcon) return;

  toast.classList.remove("ok", "err", "show");
  toastIcon.textContent = type === "err" ? "!" : "✓";
  toast.classList.add(type === "err" ? "err" : "ok");
  toastText.innerHTML = `<b>${title}</b> — ${msg}`;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
}

function setPill(raw) {
  if (!pill || !pillText) return;

  const t = (raw || "").toLowerCase();
  pill.classList.remove("ok", "warn", "err");

  if (!raw || raw === "—") {
    pillText.textContent = "Ready";
    return;
  }

  pillText.textContent = raw.length > 18 ? (raw.slice(0, 18) + "…") : raw;

  if (t.includes("saved") || t.includes("success")) pill.classList.add("ok");
  else if (t.includes("error") || t.includes("failed") || t.includes("invalid")) pill.classList.add("err");
  else pill.classList.add("warn");
}

function setStatus(msg) {
  const m = msg || "—";
  statusText.textContent = m;
  setPill(m);

  const lower = m.toLowerCase();
  if (lower.includes("saved") || lower.includes("success")) showToast("ok", "Saved", m);
  else if (lower.includes("error") || lower.includes("failed") || lower.includes("invalid")) showToast("err", "Error", m);
}

// Chips -> update selects (CSP-safe)
function wireChips() {
  document.querySelectorAll(".chip[data-set]").forEach(chip => {
    chip.addEventListener("click", () => {
      const id = chip.getAttribute("data-set");
      const val = chip.getAttribute("data-value");
      const el = document.getElementById(id);
      if (!el) return;
      el.value = val;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
}

// -------------------- helpers --------------------
function addDaysYMD(days) {
  const d = new Date();
  d.setDate(d.getDate() + Number(days));
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

function parseReminderDays(value) {
  if (!value || value === "none") return [];
  return value
    .split(",")
    .map(x => Number(x.trim()))
    .filter(x => Number.isFinite(x) && x > 0);
}

function supportedPlatformsText() {
  return "LeetCode / Codeforces / GeeksforGeeks / CodeChef / HackerRank / InterviewBit / AtCoder / CSES";
}

// -------------------- config --------------------
async function loadConfig() {
  const { webapp } = await chrome.storage.sync.get(["webapp"]);
  if (webapp) webappEl.value = webapp;
}

async function saveConfig() {
  await chrome.storage.sync.set({ webapp: webappEl.value.trim() });
}

// Save webapp automatically when user edits it
let saveTimer = null;
webappEl.addEventListener("input", () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveConfig().catch(() => {}), 350);
});

// -------------------- tab + extraction --------------------
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getProblemFromPage(timeoutMs = 1200) {
  const tab = await getActiveTab();
  if (!tab?.id) return null;

  return new Promise((resolve) => {
    let done = false;

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      resolve(null);
    }, timeoutMs);

    try {
      chrome.tabs.sendMessage(tab.id, { type: "GET_PROBLEM" }, (res) => {
        clearTimeout(timer);
        if (done) return;
        done = true;

        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        resolve(res || null);
      });
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
  });
}

function applyPatternSuggestion(p) {
  if (!patternEl.value.trim() && p?.patternSuggested) {
    patternEl.value = p.patternSuggested;
  }
}

// -------------------- actions --------------------
async function handleSave() {
  setStatus("Working...");

  const webapp = webappEl.value.trim();
  if (!webapp) {
    setStatus("Paste your Web App URL first.");
    webappEl.focus();
    return;
  }
  await saveConfig();

  const p = await getProblemFromPage();
  if (!p || !p.url) {
    setStatus(`Open a supported problem page: ${supportedPlatformsText()}`);
    return;
  }

  applyPatternSuggestion(p);

  const revisionNeeded = revisionNeededEl.value;
  const reminderDays = parseReminderDays(remindersEl.value);

  const nextRevisionDates = (revisionNeeded === "Yes")
    ? reminderDays.map(addDaysYMD)
    : [];

  const payload = {
    action: "save",
    platform: p.platform || "",
    title: p.title || "",
    url: p.url || "",
    difficulty: p.difficulty || "",
    tags: Array.isArray(p.tags) ? p.tags : [],

    pattern: patternEl.value.trim(),
    status: statusEl.value,
    approach: approachEl.value.trim(),
    notes: notesEl.value.trim(),
    time: timeEl.value.trim(),
    space: spaceEl.value.trim(),
    revision: revisionNeeded,

    nextRevisionDates
  };

  saveBtn.disabled = true;
  openDueBtn.disabled = true;

  chrome.runtime.sendMessage(
    {
      type: "SAVE_TO_SHEET",
      webapp,
      payload,
      reminders: reminderDays,
      title: p.title,
      url: p.url
    },
    (res) => {
      saveBtn.disabled = false;
      openDueBtn.disabled = false;

      if (res?.success) setStatus("✅ Saved!");
      else setStatus("❌ Failed: " + (res?.error || "Unknown"));
    }
  );
}

async function handleOpenDue() {
  setStatus("Checking due revisions...");

  const webapp = webappEl.value.trim();
  if (!webapp) {
    setStatus("Paste your Web App URL first.");
    webappEl.focus();
    return;
  }
  await saveConfig();

  openDueBtn.disabled = true;
  saveBtn.disabled = true;

  chrome.runtime.sendMessage({ type: "GET_DUE_TODAY", webapp }, (res) => {
    openDueBtn.disabled = false;
    saveBtn.disabled = false;

    if (!res?.success) {
      setStatus("❌ Failed: " + (res?.error || "Unknown"));
      return;
    }
    const count = res.opened || 0;
    setStatus(count ? `✅ Opened ${count} due problems` : "✅ No due revisions today");
  });
}

// -------------------- wiring --------------------
saveBtn.addEventListener("click", handleSave);
openDueBtn.addEventListener("click", handleOpenDue);

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.ctrlKey) {
    const tag = (document.activeElement?.tagName || "").toLowerCase();
    if (tag === "textarea") return;
    e.preventDefault();
    handleSave();
  }
  if (e.key === "Enter" && e.ctrlKey) {
    e.preventDefault();
    handleSave().finally(() => window.close());
  }
});

// -------------------- init --------------------
(async function init() {
  wireChips();
  await loadConfig();

  const p = await getProblemFromPage(700);
  if (p?.platform && p?.title) {
    applyPatternSuggestion(p);
    setStatus(`Ready • Detected: ${p.platform}`);
  } else {
    setStatus("Ready");
  }
})();
