async function postJSON(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return await r.json();
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // SAVE
  if (msg.type === "SAVE_TO_SHEET") {
    postJSON(msg.webapp, msg.payload)
      .then(async (data) => {
        // schedule reminders if save succeeded
        if (data.success && Array.isArray(msg.reminders) && msg.reminders.length > 0) {
          for (const d of msg.reminders) {
            const alarmName = `rev:${Date.now()}:${d}`;
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
