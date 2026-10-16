# Cheats Sidekick

Search, insert, and save snippets, Notes, Brain entries, and Project cards from [Cheats](https://cheats.cloud) without leaving VS Code.

[Cheats](https://cheats.cloud) is a personal cheat-sheet web app for storing code and command snippets ("cheats"), searchable and organized by type, plus a separate Notes section for private notes and checklists, a Brain section holding the context, rules, and memories you want an AI assistant to work from, and a Projects section for Kanban boards. This extension connects to your Cheats account so you can pull a snippet, note, brain entry, or project card straight into your editor, or push a new one back up, without switching to the browser.

**Free to search.** A free Cheats account is all you need for search and insert across every section, no card required. Creating anything from VS Code needs a Pro plan, see [Plans and limits](#plans-and-limits) below.

## Getting started

1. On [cheats.cloud](https://cheats.cloud), sign in (or create a free account) and go to `/user`. In the API Access section, generate an API key. Pick read-only if you just want to search, or read + write if you also want to create things from VS Code (Pro required for write, see below). If you limit the key to particular sections, include every section you want to use from VS Code: Cheats, Notes, Brain, and Projects.
2. Back in VS Code, open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run `Cheats Sidekick: Set API Key`, then paste the key in. It's kept in VS Code's secure SecretStorage, never written to a settings file.
3. You're set. Try typing `/cheats` in any file to search.

## What you can do

### Search while you type

Type `/cheats` followed by your search terms anywhere in an editor, for example `/cheats react hook`. Once you've typed three characters and paused, IntelliSense lists matching cheats, ranked by relevance. Recent searches are remembered for a couple of minutes, so backspacing and retyping doesn't use up your daily API requests. Accept a suggestion and it replaces what you typed with the full snippet.

### Search Cheats

Select some text and run `Cheats Sidekick: Search Cheats` (`Ctrl+Alt+/`, or `Cmd+Alt+/` on Mac) to search on it right away. With no selection, it fills a search box from the word under your cursor instead so you can edit it before searching. Either way you get a quick-pick list of matches, and picking one replaces the selection (or inserts at the cursor) with the full snippet.

### Save a snippet back to Cheats

Run `Cheats Sidekick: Create Cheat` (`Ctrl+Alt+.`, or `Cmd+Alt+.` on Mac) from any editor, selection or not. It opens a form in a new tab with all the fields at once: title, type (pick an existing one or type a new one), a visibility toggle (private by default), and the body, pre-filled from your selection if you had one. Fill it in and click Save cheat.

### Search Notes

Select some text (or just place your cursor in a word) and run `Cheats Sidekick: Search Notes` (`Ctrl+Alt+Shift+/`, or `Cmd+Alt+Shift+/` on Mac). Leave the search box blank to browse your most recently created Notes instead. Pick a result from the quick-pick list and its full text replaces the selection.

### Save a note back to Cheats

Run `Cheats Sidekick: Create Note` (`Ctrl+Alt+Shift+.`, or `Cmd+Alt+Shift+.` on Mac) from any editor, selection or not. It opens a form in a new tab with all the fields at once: title, a category (a pill you click to cycle between Note and List), an expiry (permanent, or auto-delete after an hour, a day, or a week), and the text, pre-filled from your selection if you had one. Fill it in and click Save note. Notes are always private, unencrypted, and don't show up in cheat search.

### Work with your Brain

Brain is the AI-facing side of the same section: briefs are context you want an assistant to have, rules are constraints it should follow, and memories are what it records for itself. Three Command Palette commands cover it (no default keybindings, to avoid colliding with the chords above):

- `Cheats Sidekick: Search Brain` searches those entries the same way Search Notes does.
- `Cheats Sidekick: Create Brain Entry` opens the same form with the category pill cycling Brief, Rules, and Memory instead of Note and List.
- `Cheats Sidekick: Insert Guides (Brief + Rules)` pulls your briefs and rules as one formatted markdown block and inserts it at the cursor, which is the thing to drop into a `CLAUDE.md` or `AGENTS.md`. If you have none yet, it tells you so rather than inserting nothing.

### Work with your Projects

Projects is Cheats' Kanban board: each project is a board, and each card sits in one of its columns (Open, In progress, In review). Two Command Palette commands cover it, again with no default keybindings:

- `Cheats Sidekick: Search Project Cards` searches the cards on every board you can see, including boards shared with you. Leave the box blank to list every card. Each result shows its type (Bug, Feature and so on), which board it's on and which column it's in, and picking one inserts its text.
- `Cheats Sidekick: Create Project Card` asks which board to add it to (skipped if you only have one), then opens a form with the title, a type pill, a column pill, and the text, pre-filled from your selection. Boards shared with you as view-only aren't offered. New boards are created on the site itself.

## Plans and limits

This extension's usage aligns with whatever plan your Cheats account is on. Search and insert work on any account for every section, while creating anything from VS Code needs a Pro plan (Pro also raises your daily API quota, and lifts the Free caps on the site's own sections: up to 5 items each in Vault, Notes, Brain and Pennies, and one project with up to 5 cards or entries in Projects and Hours, while Dues needs Pro to add anything). See [Cheats' plans](https://cheats.cloud/billing) for the details.

A couple of other things worth knowing:

- Search only shows cheats you can normally see: your own private ones, plus everything public. Notes and Brain entries are always private, so those searches only ever show your own. Project card search also includes cards on boards other people have shared with you.
- The daily API quota is shared across everything using your key, including Cheats' Model Context Protocol integration if you use that too. Full API details live at [cheats.cloud/api-docs](https://cheats.cloud/api-docs).

## Contributing

Want to work on the extension itself rather than just use it? Clone [the repo](https://github.com/AaronTrotter/cheats-vscode-extension), run `npm install`, then press F5 in VS Code to launch an Extension Development Host with your changes loaded (it builds automatically first). Use `npm run watch` while actively editing to recompile on save.