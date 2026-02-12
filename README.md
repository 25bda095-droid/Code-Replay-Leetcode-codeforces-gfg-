# 🚀 Code Replay

**Track. Solve. Revise. Repeat.**

Code Replay is a browser extension that helps competitive programmers and interview aspirants track coding problems from **LeetCode, Codeforces, and GeeksforGeeks** directly into their own **Google Sheets** — with structured notes and intelligent revision tracking.

<p align="center">
  <a href="https://microsoftedge.microsoft.com/addons/detail/code-replaylccfgfg/akpopmljgbamkfcjojgmfmfmpcehpkdn">
    <img src="https://img.shields.io/badge/Get%20it%20on-Microsoft%20Edge-blue?logo=microsoftedge&logoColor=white" />
  </a>
  <img src="https://img.shields.io/badge/Manifest-V3-0ea5e9" />
  <img src="https://img.shields.io/badge/Platforms-LeetCode%20%7C%20Codeforces%20%7C%20GFG-22c55e" />
  <img src="https://img.shields.io/badge/Open%20Source-Yes-brightgreen" />
</p>

---

## ✨ Why Code Replay?

Most developers solve problems daily — but rarely revise them properly.

Code Replay helps you:

- Organize problems by **difficulty** and **topic**
- Record your **approach** and **mistakes**
- Track **time** and **space** complexity
- Schedule **spaced revision** reminders
- Revisit problems exactly when needed

**Build consistency. Improve retention. Grow smarter.**

---

## 🔥 Features

- ✅ Automatic problem detection  
- 📌 Save problem title + direct link  
- 📊 Difficulty tracking (Easy / Medium / Hard)  
- 🏷 Pattern & tag organization  
- 📝 Personal approach & mistake notes  
- ⏱ Time & space complexity logging  
- 🔁 Spaced revision reminders (1d / 3d / 7d / 14d)  
- 🚀 One-click “Open Due Revisions”  

---

## 🖼 Screenshots

### 🔹 Extension Popup

<p align="center">
  <img src="screenshots/popup.png" width="420"/>
  <img src="screenshots/popup1.png" width="420"/>
</p>

<p align="center">
  <img src="screenshots/popup2.png" width="420"/>
  <img src="screenshots/popup3.png" width="420"/>
</p>

### 📊 Google Sheet Output

<p align="center">
  <img src="screenshots/sheet.png" width="900"/>
</p>

---

## ⚙️ Complete Setup Guide (Step-by-Step)

Setup takes **3–5 minutes**.

### Step 1 – Create Google Sheet
1. Go to https://sheets.google.com  
2. Click **Blank**  
3. Rename it: `Code Replay Tracker`  
4. Create a sheet tab named: `Questions`  
   > Important: It must be named exactly **Questions**

---

### Step 2 – Get Your Sheet ID

Your sheet URL looks like:

```txt
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=0
Copy the part between /d/ and /edit.
That long string is your SHEET_ID.

Step 3 – Add Google Apps Script
Inside your Google Sheet:
Extensions → Apps Script

Delete all existing code in Code.gs

Open this file from this repository:
👉 apps-script/Code.gs

Click GitHub Copy button and paste it inside Apps Script

Step 4 – Paste Your Sheet ID
Find this line:

const SHEET_ID = "PASTE_YOUR_SHEET_ID_HERE";
Replace it with your real Sheet ID:

const SHEET_ID = "your_real_sheet_id_here";
Click Save ✅

Step 5 – Deploy as Web App
Click Deploy → New deployment

Choose Web App

Configure:

Execute as: Me

Who has access: Anyone

Click Deploy

Authorize permissions

Copy the Web App URL (must end with /exec)

Example:

https://script.google.com/macros/s/XXXXXXX/exec
⚠ Do NOT copy the /dev link.

Step 6 – Connect the Extension
Open the Code Replay extension

Paste the /exec URL into the popup

Click Save

Open any coding problem page

Click Save in the extension

🎉 Your problem will now appear in your Google Sheet.

🔐 Privacy
✅ Code Replay does not collect personal information

✅ It does not store user data on external servers

✅ All data stays in the user’s own Google Sheets

🛠 Tech Stack
Browser Extension (Manifest V3)

Content Scripts

Background Service Worker

Google Apps Script (Web App)

Google Sheets API

📁 Project Structure
extension/
  manifest.json
  popup.html
  popup.js
  background.js
  content.js
  icon.png

apps-script/
  Code.gs
🚀 Future Improvements
Automatic tag enhancement

Dashboard analytics

## 🤝 Contributing

Contributions are welcome!

Please read the contribution guidelines here:

👉 [View Contribution Guide](CONTRIBUTING.md)


More platform support

UI refinements

⭐ If this helps you, consider starring the repository!
