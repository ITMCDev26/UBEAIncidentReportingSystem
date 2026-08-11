# Unified Command Center (UBCC)

A no-budget, no-server incident reporting system. The website is static
(HTML/CSS/JS only, hosted free on GitHub Pages) and the "backend" is a
Google Apps Script Web App that reads and writes directly to your Google
Sheet and posts every submission to Telegram. There is no separate database —
**the Google Sheet is the database.**

```
Browser (GitHub Pages) --fetch()--> Apps Script Web App --> Google Sheet
                                                          --> Telegram Bot API
```

## What's included
- Login screen that checks credentials against a `Users` tab in the Sheet
- Operator dashboard: live stats, report history, filters, per-township breakdown (admin),
  built on **Bootstrap 5** so it lays out correctly on phones, tablets, and desktop
- **New Report page** now shows both **Initial Report** and **Information Report** as tabs
  right at the top — Progress reports are still only reached via "Start Progress Report"
  on an existing Initial record, since a progress update always has to be linked to one
- Initial / Progress / Information report forms, built from one shared schema
  (`js/formSchemas.js`) so editing a field list edits all three forms at once
- Incident-code generation exactly as specified:
  - Initial: `UBEA-IR_001`, `UBEA-IR_002` …
  - First Progress report on that incident reuses the number: `UBEA-PR_001`.
    Further updates on the same still-open incident: `UBEA-PR_001-2`, `-3` …
  - Information report (outside-township, supported case) always carries a
    series suffix: `UBEA-IP_001-1`, follow-up threads `-2`, `-3` …, and a
    new information incident becomes `UBEA-IP_002-1`
- Autofill: clicking "Start Progress Report" on an Initial record carries
  its fields into the Progress form; follow-up threads carry forward from
  the previous entry in the series
- Resolved lock: once a Progress/Information report is marked **Resolved =
  Yes**, that entire incident thread (including the Initial record) becomes
  read-only everywhere in the app
- **Print / Save-as-PDF immediately after submitting** — the success dialog
  shown right after you submit a report has a "Print / Save as PDF" button,
  plus the same option is available anytime from Report History
- **12-hour open-case email escalation** — any Initial report still not
  marked Resolved 12 hours after filing triggers one email to
  `megar.global@megaworldcorp.com`, and is flagged with an "⚠ 12h+" badge
  in the dashboard/history for as long as it stays open
- 6:00 PM open-case reminder — an in-app banner **and** a Telegram message
  sent by a time-driven Apps Script trigger, so it fires even if nobody has
  the site open
- Dark / light mode toggle (persisted per browser)
- Township "swipe" carousel with a logo badge per township
- Alert Level / Weather as icon-choice boxes — resilient to a Config sheet
  category being temporarily empty (falls back to the built-in defaults
  instead of rendering an empty, unclickable group)
- Super Admin: manage OPCEN accounts per township, and edit the dropdown
  content (Type of Incident, Classification, Weather) live, no code changes
- Blue-accented visual theme throughout, matching an operations-console look

## 1. Set up the Google Sheet + backend
1. Create a new Google Sheet (this will be your database).
2. Open **Extensions > Apps Script**, delete the default code, and paste in
   the contents of `apps-script/Code.gs`.
3. In the Apps Script editor: **Project Settings (gear icon) > Script
   Properties**, add:
   | Property | Value |
   |---|---|
   | `SPREADSHEET_ID` | the ID from your sheet's URL (`.../d/<THIS PART>/edit`) |
   | `TOKEN_SECRET` | any long random string, e.g. generate one at random.org |
   | `TELEGRAM_BOT_TOKEN` | from [@BotFather](https://t.me/BotFather) after `/newbot` |
   | `TELEGRAM_CHAT_ID` | your group's chat id (add the bot to the group, then check `https://api.telegram.org/bot<token>/getUpdates` after sending a message) |
4. Back in the editor, select the function dropdown at the top, choose
   `setupSheets`, and click **Run**. Approve the permission prompts. This
   creates the `Users`, `Config`, `Initial`, `Progress`, `Information` tabs
   with headers and one default admin account:
   - username: `admin`  password: `ChangeMe123!` — **change this immediately**
   via the Super Admin page after your first login.
5. Select `createDailyReminderTrigger` and click **Run** once — this installs
   the 6:00 PM daily Telegram reminder.
6. Select `createOverdueEmailTrigger` and click **Run** once — this installs
   the hourly check that emails **megar.global@megaworldcorp.com** the first
   time any Initial report has been open 12+ hours without being resolved.
   To send to a different address instead, either edit `DEFAULT_ADMIN_EMAIL`
   at the top of `Code.gs`, or add an `ADMIN_EMAIL` script property (Step 3)
   — the property takes priority if both are set.
   > Note: `MailApp.sendEmail` uses your own Google account's daily email
   > quota (100/day on a personal Gmail account, much higher on Workspace).
   > That's normally more than enough for incident escalation emails.
7. **Deploy > New deployment > Web app**
   - Execute as: **Me**
   - Who has access: **Anyone with the link**
   - Click Deploy, copy the `/exec` URL.

## 2. Point the site at your backend
Open `js/config.js` and set:
```js
API_URL: "https://script.google.com/macros/s/XXXXXXXX/exec"
```

## 3. Add your OPCEN operator accounts
Log in as `admin`, go to **Admin > OPCEN Accounts**, and add one account per
township (username, password, township, role = Operator). Or add rows
directly to the `Users` tab — columns are `Username | Password | FullName |
Township | Role`.

> **Security note:** to keep this workable with zero budget, passwords are
> stored as plain text in the Sheet and checked as-is. This is fine for an
> internal tool with a small trusted operator group, but restrict Sheet
> access to admins only, and don't reuse these passwords elsewhere. If you
> later want proper hashing, that logic lives entirely in the `login_()`
> function in `Code.gs`.

## 4. Deploy the website to GitHub Pages
1. Push this whole folder to a GitHub repo.
2. Repo **Settings > Pages > Deploy from a branch**, pick `main` and `/root`.
3. Your site will be live at `https://<you>.github.io/<repo>/`.

That's it — no server, no hosting cost, no separate database to maintain.

## Troubleshooting the Sheets / Telegram connection
If reports are saving but Telegram isn't posting, or the Dashboard/History
doesn't seem to match the Sheet:
1. **Redeploy after any Code.gs change.** Editing the script in the Apps
   Script editor does NOT update your live `/exec` URL — you must go
   **Deploy > Manage deployments > (pencil icon) > New version > Deploy**
   every time, or your site keeps hitting the old code.
2. Run **`checkConnections`** from the function dropdown, then **View >
   Logs**. It checks your Spreadsheet ID, Telegram token/chat ID, and
   installed triggers in one pass and tells you exactly which one is
   missing or failing, instead of failing silently.
3. If only Telegram is suspect, run **`testTelegram`** the same way.
4. Common Telegram gotcha: the bot must actually be a **member of the
   group/channel** for `TELEGRAM_CHAT_ID`, and for a channel the id is
   usually negative (e.g. `-1001234567890`).

## Notes / things to customize
- **Township logos**: currently rendered as a colored badge with the
  township's 2-letter code. Drop real logo images into `assets/` and swap
  the `.township-logo` div in `js/forms.js` for an `<img>` if you have
  actual artwork.
- **Township prefix codes** (`UBEA`, `ARCV`, etc.) are defined in both
  `js/config.js` and `apps-script/Code.gs` (`TOWNSHIPS`) — keep them in
  sync if you rename a township.
- **`dashboardSummary` action** is wired up but currently just returns the
  same data as `listReports` — extend it in `Code.gs` if you want
  server-side aggregation instead of the client-side stats in `dashboard.js`.
- All dropdown content (Type of Incident, Vehicular Classification, Weather)
  lives in the `Config` tab and is editable from the Super Admin page
  without redeploying anything.
