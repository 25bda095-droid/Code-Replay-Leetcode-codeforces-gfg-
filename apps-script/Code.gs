function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "Web app is live ✅" }))
    .setMimeType(ContentService.MimeType.JSON);
}

const SHEET_ID = "Paste Your Sheet Id Here";   // <-- put your sheet id
const SHEET_NAME = "Questions";

const HEADERS = [
  "Date Added",           // A
  "Platform",             // B
  "Title",                // C
  "URL",                  // D
  "Difficulty",           // E
  "Tags",                 // F
  "Pattern / Type",       // G
  "Status",               // H
  "Approach",             // I
  "Notes",                // J
  "Time",                 // K
  "Space",                // L
  "Revision Needed",      // M
  "Next Revision Dates",  // N (CSV of dates)
  "Last Updated"          // O
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);

  try {
    const body = parseBody_(e);
    const action = (body.action || "save").toString();

    if (action === "init") {
      initSheet_();
      return json_({ success: true, message: "Sheet initialized" });
    }

    if (action === "save") {
      initSheet_();
      const sheet = getSheet_();

      const now = new Date();

      // tags can be array OR string
      const tagsArr = Array.isArray(body.tags)
        ? body.tags
        : (typeof body.tags === "string" ? body.tags.split(",") : []);
      const tags = tagsArr.map(s => String(s).trim()).filter(Boolean).join(", ");

      // nextRevisionDates can be array OR string
      const nextDates = Array.isArray(body.nextRevisionDates)
        ? body.nextRevisionDates.map(String).map(s => s.trim()).filter(Boolean).join(",")
        : (body.nextRevisionDates ? String(body.nextRevisionDates).trim() : "");

      const row = [
        now,                              // Date Added
        body.platform || "",              // Platform
        body.title || "",                 // Title
        body.url || "",                   // URL
        body.difficulty || "",            // Difficulty
        tags,                             // Tags
        body.pattern || "",               // Pattern / Type
        body.status || "Attempted",       // Status
        body.approach || "",              // Approach
        body.notes || "",                 // Notes
        body.time || "",                  // Time
        body.space || "",                 // Space
        body.revision || "No",            // Revision Needed
        nextDates,                        // Next Revision Dates (CSV)
        now                               // Last Updated
      ];

      sheet.appendRow(row);
      return json_({ success: true, message: "Saved" });
    }

    if (action === "getDue") {
      initSheet_();
      const sheet = getSheet_();
      const values = sheet.getDataRange().getValues();
      if (values.length <= 1) return json_({ success: true, due: [] });

      const tz = Session.getScriptTimeZone();

      // If popup sends YYYY-MM-DD, parse it safely
      const target = body.dateISO ? new Date(String(body.dateISO)) : new Date();
      const targetKey = Utilities.formatDate(target, tz, "yyyy-MM-dd");

      const due = [];
      for (let i = 1; i < values.length; i++) {
        const row = values[i];

        const platform = row[1];
        const title = row[2];
        const url = row[3];

        const revisionNeeded = row[12];
        const nextRevisionDates = row[13] || "";

        if (!url) continue;
        if (revisionNeeded !== "Yes") continue;

        const dates = String(nextRevisionDates)
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);

        const isDue = dates.some(d => {
          // supports YYYY-MM-DD or full ISO
          const dt = new Date(d);
          if (isNaN(dt.getTime())) return false;
          const key = Utilities.formatDate(dt, tz, "yyyy-MM-dd");
          return key === targetKey;
        });

        if (isDue) due.push({ title, url, platform });
      }

      return json_({ success: true, due });
    }

    return json_({ success: false, error: "Unknown action: " + action });

  } catch (err) {
    return json_({ success: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function initSheet_() {
  if (!SHEET_ID || SHEET_ID.includes("PASTE_YOUR_SHEET_ID") || SHEET_ID === "id here") {
    throw new Error("Set SHEET_ID in Apps Script");
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  ensureHeaders_(sheet);

  // basic formatting
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#f3f4f6")
    .setWrap(true);

  // widths (tune as you like)
  sheet.setColumnWidth(3, 260);  // Title
  sheet.setColumnWidth(4, 330);  // URL
  sheet.setColumnWidth(9, 380);  // Approach
  sheet.setColumnWidth(10, 380); // Notes
}

function ensureHeaders_(sheet) {
  const range = sheet.getRange(1, 1, 1, HEADERS.length);
  const row = range.getValues()[0];

  const empty = row.every(x => x === "" || x === null);
  const mismatch = !empty && HEADERS.some((h, i) => String(row[i] || "").trim() !== h);

  if (empty || mismatch) {
    sheet.clear();
    range.setValues([HEADERS]);
  }
}

function getSheet_() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  const raw = e.postData.contents;

  try {
    return JSON.parse(raw);
  } catch (_) {}

  const obj = {};
  raw.split("&").forEach(pair => {
    const [k, v] = pair.split("=");
    if (!k) return;
    obj[decodeURIComponent(k.replace(/\+/g, " "))] =
      decodeURIComponent((v || "").replace(/\+/g, " "));
  });

  return obj;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
