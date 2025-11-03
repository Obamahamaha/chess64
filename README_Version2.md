```markdown
# chess64

A simple browser chess site with a built-in AI (minimax + alpha-beta) and adjustable ELO-like strength.

Files:
- index.html
- styles.css
- script.js
- README.md

How to run locally:
1. Save all files in a folder (e.g., chess64).
2. Open index.html directly in your browser or run a local server:
   - Python 3: python -m http.server 8000
   - Node: npx http-server
   - VS Code: Live Server extension
3. Open http://localhost:8000 (if using a server).

How to deploy to GitHub Pages (private repo):
1. Create a private repository named "chess64" on GitHub (see below for CLI commands).
2. Push these files to the repository's main branch.
3. In the repository Settings → Pages, set the source to the main branch / root and save.
4. GitHub Pages will publish; for private repos, verify Pages is available for your plan/account and note the site URL in Pages settings.

Notes:
- The site uses chess.js and chessboard.js from CDNs.
- For stronger and faster AI, consider integrating Stockfish WASM.
- If you want, I can produce a ZIP with all files or show exact git commands to push the project.