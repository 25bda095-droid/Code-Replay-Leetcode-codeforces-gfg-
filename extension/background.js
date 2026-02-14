async function postJSON(url, body) {
  let r;
  try {
    r = await fetch(url, {
      method: "POST",
      // IMPORTANT: Using application/json often triggers CORS preflight (OPTIONS) and fails on Apps Script.
      // text/plain avoids preflight and works reliably.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      redirect: "follow",
      cache: "no-store"
    });
  } catch (e) {
    return { success: false, error: "Network error: " + String(e) };
  }

  let txt = "";
  try {
    txt = await r.text();
  } catch (e) {
    return { success: false, error: "Failed reading response: " + String(e) };
  }

  // If Apps Script returns HTML (login/permission/drive error page), show snippet
  if (!r.ok) {
    return {
      success: false,
      error: `HTTP ${r.status} ${r.statusText}: ${txt.slice(0, 200)}`
    };
  }

  try {
    return JSON.parse(txt);
  } catch (e) {
    return {
      success: false,
      error: "Non-JSON response (maybe permission/redirect): " + txt.slice(0, 200)
    };
  }
}

function isAllowedWebApp(url) {
  try {
    const u = new URL(url);

    // Optional: normalize /u/1/ -> /u/0/ (prevents account-index issues)
    // NOTE: this does not change the request here, but you can normalize in popup.js too.
    return (
      u.hostname === "script.google.com" ||
      u.hostname === "script.googleusercontent.com"
    );
  } catch {
    return false;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // SAVE
  if (msg.type === "SAVE_TO_SHEET") {
    if (!isAllowedWebApp(msg.webapp)) {
      sendResponse({ success: false, error: "Invalid Web App URL" });
      return;
    }

    postJSON(msg.webapp, msg.payload)
      .then(async (data) => {
        // schedule reminders if save succeeded
        if (data.success && Array.isArray(msg.reminders) && msg.reminders.length > 0) {
          for (const d of msg.reminders) {
            const alarmName = `rev:${Date.now()}:${Math.random().toString(16).slice(2)}:${d}`;

            chrome.alarms.create(alarmName, { delayInMinutes: d * 24 * 60 });

            await chrome.storage.local.set({
              [alarmName]: { title: msg.title, url: msg.url, days: d }
            });
          }
        }
        sendResponse(data);
      })
      .catch(err => sendResponse({ success: false, error: String(err) }));

    return true;
  }

  // OPEN DUE TODAY
  if (msg.type === "GET_DUE_TODAY") {
    if (!isAllowedWebApp(msg.webapp)) {
      sendResponse({ success: false, error: "Invalid Web App URL" });
      return;
    }

    postJSON(msg.webapp, { action: "getDue" })
      .then(async (data) => {
        if (!data.success) {
          sendResponse(data);
          return;
        }

        const due = data.due || [];
        for (const item of due) {
          if (item.url) await chrome.tabs.create({ url: item.url, active: false });
        }

        sendResponse({ success: true, opened: due.length });
      })
      .catch(err => sendResponse({ success: false, error: String(err) }));

    return true;
  }
});

// Alarm notifications
chrome.alarms.onAlarm.addListener(async (alarm) => {
  const obj = await chrome.storage.local.get([alarm.name]);
  const data = obj[alarm.name];
  if (!data) return;

  chrome.notifications.create(alarm.name, {
    type: "basic",
    iconUrl: "icon.png",
    title: "Revision Reminder",
    message: `Revise (${data.days}d): ${data.title}`,
    priority: 2
  });

  await chrome.storage.local.remove([alarm.name]);
});
