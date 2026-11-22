# Quiz Bowl Playground

A study app that helps middle school students learn quiz bowl topic by topic: short lessons, key facts to memorize,
and practice tossups and bonuses for eight subjects (science, history, literature, geography, fine arts, math,
mythology and current events).

## Run it locally

Requires Node 20 or newer.

```bash
npm install
npm run dev        # start the dev server at http://localhost:5173/quiz-bowl/
npm test           # run unit tests
npm run validate   # check the content files
npm run build      # validate + production build into dist/
```

## Adding content

Each subject is one JSON file in `src/content/`. See [docs/CONTENT_FORMAT.md](docs/CONTENT_FORMAT.md) for the format.

## Deploying

`.github/workflows/deploy.yml` builds and tests every pull request, and deploys `main` to GitHub Pages.
One-time setup: in the repository's **Settings → Pages**, set **Source** to **GitHub Actions**.
The site will then be at `https://<owner>.github.io/quiz-bowl/`.

## Project layout

```
src/
  content/      subject JSON files + index.js loader
  components/   shared UI (layout, breadcrumbs, Markdown)
  pages/        Home, SubjectPage, LessonPage
scripts/        validate-content.mjs
```
