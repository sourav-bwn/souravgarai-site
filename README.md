# souravgarai - personal site

Multipage portfolio and software development site for Sourav Garai.
Plain HTML, CSS and JavaScript. No build step. GitHub data (graph, achievements, repos) is baked into data.js.

## Tests

Offline regression tests for the calculator, tax, invoice and digest logic, plus site hygiene checks (sitemap, internal links, data file shapes). They exercise the exact functions shipped to visitors, extracted from the browser scripts, so no separate copy can drift.

```sh
npm test   # node --test, no dependencies; Node 18+
```
