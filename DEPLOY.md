# Deploying the Cheats Sidekick VS Code extension

Published to the VS Code Marketplace as `AaronTrotter.aaronscheatsheet` (the extension id stays the same
across the rebrand; only the display name is "Cheats Sidekick").

1. Bump `version` in `package.json`.
2. Compile: `npm install && npm run compile` (writes `out/`; never edit `out/` by hand).
3. Package: `npx @vscode/vsce package` (produces `aaronscheatsheet-<version>.vsix`).
4. Smoke test: **Extensions → ⋯ → Install from VSIX…**, run **Cheats Sidekick: Set API Key**, search.
5. Publish: `npx @vscode/vsce publish -p <PAT>`. The PAT is an Azure DevOps token with
   **Marketplace → Manage** for publisher `AaronTrotter`; do not commit it.
6. Tag the release: `git tag v<version> && git push --tags`.

Notes:

- The default for the `cheats.baseUrl` setting now points at `https://cheats.cloud`.
  Do not publish until that domain serves the app.
- Git repo: `https://github.com/AaronTrotter/cheats-vscode-extension`.
