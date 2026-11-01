@AGENTS.md

## Claude Code

- `AGENTS.md` above is the guide. The skills in `.claude/skills/` go deeper,
  one topic each: `hlou-site-spec`, `hlou-site-anatomy`, `hlou-blocks`,
  `hlou-content-contract`, `hlou-code-variant`, `hlou-roundtrip`. Load the
  matching one before you edit.
- Pages, sections, theme, content and collections are written in `hlou/site/`
  (skill `hlou-site-spec`). Run `pnpm hlou:compile` after each change and fix
  every error it prints before the next one.
- `.claude/launch.json` declares `dev` (port 3000, compiles and watches the
  spec) and `preview` (port 4173, after `pnpm build`). Use them to check a
  change in the browser.
- People, domains, publishing and form delivery stay in Hlou: name the Hlou
  screen when a request needs one of them.
