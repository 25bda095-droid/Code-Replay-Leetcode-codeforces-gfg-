function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "Web app is live ✅" }))
    .setMimeType(ContentService.MimeType.JSON);
}
const SHEET_ID = "Enter-Your-google-sheet-id";
const SHEET_NAME = "Questions";

const HEADERS = [
  "Date Added",           // A
  "Platform",             // B
  "Title",                // C
  "URL",                  // D
  "Difficulty",           // E
  "Tags",                 // F
  "Pattern / Type",       // G
  "Status",               // H  Solved/Attempted
  "Approach",             // I
  "Notes",                // J
  "Time",                 // K
  "Space",                // L
  "Revision Needed",      // M  Yes/No
  "Next Revision Dates",  // N  CSV of ISO dates
  "Last Updated"          // O
];

function doPost(e) {
  try {
    const body = parseBody_(e);
    const action = body.action || "save";

    if (action === "init") {
      initSheet_();
      return json_({ success: true, message: "Sheet initialized" });
    }

    if (action === "save") {
      initSheet_();
      const sheet = getSheet_();

      const now = new Date();
      const nextDates = Array.isArray(body.nextRevisionDates)
        ? body.nextRevisionDates.join(",")
        : (body.nextRevisionDates || "");

      sheet.appendRow([
        now,
        body.platform || "",
        body.title || "",
        body.url || "",
        body.difficulty || "",
        (body.tags || []).join(", "),
        body.pattern || "",
        body.status || "Attempted",
        body.approach || "",
        body.notes || "",
        body.time || "",
        body.space || "",
        body.revision || "No",
        nextDates,
        now
      ]);

      return json_({ success: true, message: "Saved" });
    }

    // Return due revisions for a date (default today)
    if (action === "getDue") {
      initSheet_();
      const sheet = getSheet_();
      const values = sheet.getDataRange().getValues();
      if (values.length <= 1) return json_({ success: true, due: [] });

      const tz = Session.getScriptTimeZone();
      const target = body.dateISO
        ? new Date(body.dateISO)
        : new Date();

      // Compare by local date (yyyy-MM-dd)
      const targetKey = Utilities.formatDate(target, tz, "yyyy-MM-dd");
      const due = [];

      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const url = row[3];
        const title = row[2];
        const platform = row[1];
        const revisionNeeded = row[12];
        const nextRevisionDates = row[13] || "";

        if (!url) continue;
        if (revisionNeeded !== "Yes") continue;

        const dates = String(nextRevisionDates)
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);

        const isDue = dates.some(d => {
          const dt = new Date(d);
          if (isNaN(dt.getTime())) return false;
          const key = Utilities.formatDate(dt, tz, "yyyy-MM-dd");
          return key === targetKey;
        });

        if (isDue) {
          due.push({ title, url, platform });
        }
      }

      return json_({ success: true, due });
    }

    return json_({ success: false, error: "Unknown action: " + action });
  } catch (err) {
    return json_({ success: false, error: String(err) });
  }
}

function initSheet_() {
  if (!SHEET_ID || SHEET_ID.includes("PASTE_YOUR_SHEET_ID")) {
    throw new Error("Set SHEET_ID in Apps Script");
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const empty = firstRow.every(x => x === "" || x === null);

  if (empty) {
    sheet.clear();
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(3, 260);
    sheet.setColumnWidth(4, 330);
    sheet.setColumnWidth(9, 380);
    sheet.setColumnWidth(10, 380);
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
