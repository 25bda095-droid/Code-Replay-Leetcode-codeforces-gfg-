Code Replay

A browser extension to track coding problems from LeetCode, Codeforces, and GeeksforGeeks directly in Google Sheets with revision reminders.

Features

Save problem title and URL

Track difficulty and tags

Solved / Attempted status

Personal notes and approach

Time and space complexity tracking

Spaced revision reminders

Open due revisions instantly

Setup Guide
Step 1 – Create Google Sheet

Go to Google Sheets

Create a new sheet

Copy the Sheet ID from the URL

Example:

https://docs.google.com/spreadsheets/d/SHEET_ID/edit

Step 2 – Add Apps Script

Open:

Extensions → Apps Script


Replace existing code with:
👉 Click here to copy Code.gs

Set your Sheet ID in this line:

const SHEET_ID = "PASTE_YOUR_SHEET_ID_HERE";

Step 3 – Deploy Web App

Deploy → New Deployment

Type: Web App

Execute as: Me

Access: Anyone

Copy the /exec URL

Step 4 – Connect Extension

Paste the /exec URL into the extension popup.

Done.

Privacy

This extension does not collect or store personal data.
All data is stored in the user’s own Google Sheets.
