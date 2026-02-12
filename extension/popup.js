const statusText = document.getElementById("statusText");
const webappEl = document.getElementById("webapp");

async function loadConfig() {
  const { webapp } = await chrome.storage.sync.get(["webapp"]);
  if (webapp) webappEl.value = webapp;
}

async function saveConfig() {
  await chrome.storage.sync.set({ webapp: webappEl.value.trim() });
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getProblemFromPage() {
  const tab = await getActiveTab();
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id, { type: "GET_PROBLEM" }, resolve);
  });
}

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + Number(days));
  return d.toISOString();
}

function parseReminderDays(value) {
  if (!value || value === "none") return [];
  return value.split(",").map(x => Number(x.trim())).filter(x => Number.isFinite(x) && x > 0);
}

// Save
document.getElementById("saveBtn").addEventListener("click", async () => {
  statusText.textContent = "Working...";

  const webapp = webappEl.value.trim();
  if (!webapp) {
    statusText.textContent = "Paste your Web App URL first.";
    return;
  }
  await saveConfig();

  const p = await getProblemFromPage();
  if (!p || !p.url) {
    statusText.textContent = "Open a supported problem page (LeetCode/CF/GFG).";
    return;
  }

  // Auto-fill pattern suggestion if empty
  const patternEl = document.getElementById("pattern");
  if (!patternEl.value.trim() && p.patternSuggested) {
    patternEl.value = p.patternSuggested;
  }

  const revisionNeeded = document.getElementById("revisionNeeded").value;
  const reminderDays = parseReminderDays(document.getElementById("reminders").value);

  // Next revision dates stored in sheet as CSV
  const nextRevisionDates = (revisionNeeded === "Yes")
    ? reminderDays.map(addDaysISO)
    : [];

  const payload = {
    action: "save",
    platform: p.platform,
    title: p.title,
    url: p.url,
    difficulty: p.difficulty,
    tags: p.tags,

    pattern: patternEl.value.trim(),
    status: document.getElementById("status").value,
    approach: document.getElementById("approach").value.trim(),
    notes: document.getElementById("notes").value.trim(),
    time: document.getElementById("time").value.trim(),
    space: document.getElementById("space").value.trim(),
    revision: revisionNeeded,

    nextRevisionDates
  };

  chrome.runtime.sendMessage(
    { type: "SAVE_TO_SHEET", webapp, payload, reminders: reminderDays, title: p.title, url: p.url },
    (res) => {
      if (res?.success) statusText.textContent = "✅ Saved!";
      else statusText.textContent = "❌ Failed: " + (res?.error || "Unknown");
    }
  );
});

// Open due today
document.getElementById("openDueBtn").addEventListener("click", async () => {
  statusText.textContent = "Checking due revisions...";
  const webapp = webappEl.value.trim();
  if (!webapp) {
    statusText.textContent = "Paste your Web App URL first.";
    return;
  }
  await saveConfig();

  chrome.runtime.sendMessage(
    { type: "GET_DUE_TODAY", webapp },
    (res) => {
      if (!res?.success) {
        statusText.textContent = "❌ Failed: " + (res?.error || "Unknown");
        return;
      }
      const count = res.opened || 0;
      statusText.textContent = count ? `✅ Opened ${count} due problems` : "✅ No due revisions today";
    }
  );
});

loadConfig();
