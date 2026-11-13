# OmniNote Pro v4 – website

Landing page for **OmniNote Pro v4**, a free note-taking app made for the Redmi Pad Pro 5G and Redmi Smart Pen 1s.

## Files
```
index.html      page structure and text
css/style.css   all styling
js/config.js    YOUR settings: APK link, issues link, version
js/main.js      writing pad, device checker, menu
assets/         favicon
.nojekyll       tells GitHub Pages to serve files as-is
```

## Setup
1. Upload the **contents** of this folder to a new GitHub repository (so `index.html` is at the top level).
2. Repo **Settings → Pages → Deploy from a branch → main / (root)**. Your site goes live at `https://USERNAME.github.io/REPO/`.
3. Create a **Release** in the repo and attach your APK.
4. Open `js/config.js` and paste the APK link into `apkUrl` and your issues page into `issuesUrl`.

## Uploading a new version later
Attach the new APK to a new Release, then update `version` (and `apkUrl` if the file name changed) in `js/config.js`.
