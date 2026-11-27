<p align="center"><img src="https://raw.githubusercontent.com/webship/headless-ui-steps/2.0.x/assets/logo.svg" alt="Headless UI logo" width="96"></p>

# headless-ui-steps

Cucumber step definitions for sites and apps built with Headless UI, Tailwind Labs' unstyled, accessible components for
React and Vue, for [webship-js](https://webship.co/docs/webship-js/2.0.x), a BDD browser automation harness built on
Playwright and Cucumber-js.

Headless UI gives its menus, select lists, search lists, dialogs, popovers, panels, tabs, switches and radio groups their
behaviour and their ARIA, and leaves their looks to Tailwind CSS or any other styles. The steps work on them as a person
sees them, by their roles and their names, and wait on what the components themselves say: their ARIA, their state, the
end of their transitions. They never wait a fixed time, and no step phrase names the library.

Proven on Headless UI 2.2.10 for React (its own playground's examples) and 1.7.23 for Vue (its own Vue playground).

## Requirements

- Node.js 24 or newer.
- webship-js 2.0.19 or newer.
- A site or an app built with Headless UI (`@headlessui/react` 2, or `@headlessui/vue` 1.7).

## Install

```bash
npm install --save-dev @webship-js/headless-ui-steps
```

List its step definitions in `cucumber.js`, after webship-js's own:

```js
require: [
  'node_modules/webship-js/tests/step-definitions/**/*.js',
  'node_modules/@webship-js/headless-ui-steps/tests/step-definitions/**/*.js',
  'tests/step-definitions/**/*.js',
],
```

With the [Webship Workspace](https://github.com/webship/workspace) and its Headless UI plugin
(`@webship.co/workspace-headless-ui`), an app is a command away, with this pack in its testing setup.

## Quick start

```gherkin
Feature: Deactivate an account
  Scenario: The dialog asks first, then closes
    Given I go to "/dialog/dialog"
    When I open the "Deactivate account" dialog with the "Toggle!" button
    Then the "Deactivate account" dialog should show "Are you sure you want to deactivate your account?"
    When I press "Cancel" in the "Deactivate account" dialog
    Then no dialog should be shown
```

```gherkin
Feature: Assign a task
  Scenario: A person chosen in a select list, then in a search list
    Given I go to "/listbox/listbox-with-pure-tailwind"
    When I choose "Devon Webb" in the "Assigned to" select list
    Then the "Assigned to" select list should show "Devon Webb"
    Given I go to "/combobox/combobox-with-pure-tailwind"
    When I type "wa" in the "Assigned to" search list and choose "Wade Cooper"
    Then the "Assigned to" search list should show "Wade Cooper"
```

## How the steps find things and wait

- **Names.** A component is named the way a person reads it:
  - a dialog by its title (DialogTitle), else by a heading in it or the start of its text;
  - a drop-down menu by the button that opens it (Headless UI names the menu after it);
  - a popover by the button that opens it: its panel has no role and no name of its own;
  - a panel (Disclosure) by the text of its button, and a tab by its text;
  - a field, a select list, a search list, a switch or a radio group by its label (a radio group also by the legend or
    the heading that names it); a choice of a radio group by its text.
- **Select lists.** Headless UI names a Listbox's button by its label *and* the option it shows (`aria-labelledby` points
  at both: "Assigned to Claudie Smitham"), so the steps find it by its label alone.
- **State, on both lines.** Every component carries its state as tokens in `data-headlessui-state` (`open`, `active`,
  `focus`, `selected`, `checked`, `disabled`): the React line also sets each as an attribute of its own (`data-open` …),
  the Vue line has the tokens only. The steps read the tokens and the ARIA (`aria-expanded`, `aria-selected`,
  `aria-checked`, `aria-activedescendant`), which both lines set.
- **Portals and the page behind a dialog.** Dialogs, and menus, lists and panels drawn with an anchor, are rendered in
  `#headlessui-portal-root` at the end of the page. While a dialog is open, the rest of the page carries
  `aria-hidden="true"` and `inert`, so the steps look inside the open dialog. A menu, a list or a popover leaves the page
  as it is.
- **Transitions.** Each step waits for the component's own state, then for its transitions to end, read from the browser:
  - the React line marks them on the element (`data-enter`, `data-leave`, `data-transition`, `data-closed`), the Vue line
    runs them through its classes; `Element.getAnimations()` catches both;
  - a dialog stays at full opacity while its panel and backdrop fade: shown means its role and name with no transition
    running anywhere in it; closed means removed;
  - after a choice a list's options leave while the list already shows it: the step waits for them to be gone before
    anything else is clicked.
- **Panels and tabs.** A panel's content is in the page only while it is expanded. The tabs that are not selected keep
  an empty placeholder for their panel (`<span role="tabpanel" aria-hidden="true">`), so a tab's content is read from the
  panel it controls once it is selected.

Every failure says what was expected, what was found, the page, and a hint.

## JavaScript

A Headless UI app is drawn by JavaScript: without it there is nothing to test. The suite runs in a browser with
JavaScript, and fails a scenario on any error the page raises.

## Steps

### `headless-ui-overlays.steps.js` (11)

| Step | What it does |
| --- | --- |
| `When I open the "…" dialog\|side panel\|drop-down menu\|popover [with the "…" button\|link]` | Clicks the opener, waits until it is shown and still |
| `When I close the "…" dialog\|side panel\|drop-down menu\|popover` | Its close button, else Escape; waits until it is gone |
| `When I press Escape in the "…" dialog\|side panel\|drop-down menu\|popover` | Escape, then waits for its answer |
| `When I click outside the "…" dialog\|side panel\|drop-down menu\|popover` | Clicks a corner of the window, then waits for its answer |
| `Then the "…" dialog\|side panel\|drop-down menu\|popover should [not] be shown` | Shown and still, or gone |
| `Then no dialog\|side panel\|drop-down menu\|popover should be shown` | None is |
| `Then the "…" dialog\|side panel\|drop-down menu\|popover\|panel\|tab should [not] show "…"` | A text shown in it, or a control in it named so |
| `When I press "…" in the "…" dialog\|side panel\|popover` | Presses a button or link in it, waits for its answer |
| `When I choose "…" from the "…" drop-down menu` | Opens it when closed, clicks the item, waits until it is gone |
| `Then "…" should [not] be active\|disabled in the "…" drop-down menu` | The `active` or `disabled` state, `aria-activedescendant`, `aria-disabled` |
| `When I wait for the transitions to finish` | No transition running or marked in the page |

### `headless-ui-forms.steps.js` (14)

| Step | What it does |
| --- | --- |
| `Then the "…" field should be shown as valid\|invalid` | `aria-invalid` and `data-invalid` (the `invalid` prop) |
| `Then the "…" field should show the message "…"` | One of the texts it points at with `aria-describedby` (its Descriptions) |
| `Then <n>\|no fields should be shown as invalid` | Counts the visible fields marked invalid |
| `When I choose "…" in the "…" select list` | Opens the select list, clicks the option, waits until its options are gone |
| `Then the "…" select list should show "…"` | The option its button shows |
| `Then the "…" select list should [not] offer "…"` | Opens it, reads its options, closes it |
| `When I type "…" in the "…" search list and choose "…"` | Types, waits for the options, clicks one, waits until they are gone |
| `When I type "…" in the "…" search list` | Types, then waits until the list has answered |
| `Then the "…" search list should [not] offer "…"` | The options shown for what was typed |
| `Then the "…" search list should show "…"` | The text of its field |
| `When I turn on\|off the "…" switch` | Clicks it when it is not already so, waits for `aria-checked` |
| `Then the "…" switch should be turned on\|off` | `aria-checked` |
| `When I choose "…" in the "…" radio group` | Clicks the choice, waits until it is the chosen one |
| `Then "…" should [not] be chosen in the "…" radio group` | `aria-checked` of the choice |

### `headless-ui-disclosure.steps.js` (5)

| Step | What it does |
| --- | --- |
| `When I expand\|collapse the "…" panel` | Clicks its button, waits for its content to be shown and still, or gone |
| `Then the "…" panel should be expanded\|collapsed` | `aria-expanded`, and its content |
| `When I switch to the "…" tab` | Waits until it is selected and its tabpanel shown; a disabled tab is refused, with a message |
| `Then the "…" tab should [not] be active` | `aria-selected`, and its tabpanel shown |
| `Then the "…" tab should [not] be disabled` | `disabled`, or the `disabled` state |

`tests/step-definitions/headless-ui-helpers.js` holds the plumbing a project can require for its own steps: finding a
component the way a person reads it, and waiting for it (`waitShown`, `waitGone`, `waitStill`, `tokensOf`).

## Phrases shared with other packs

The pack shares its phrases on purpose with the other component packs, Bootstrap's, UIkit's and Material UI's
(`@webship-js/bootstrap-steps`, `@webship-js/uikit-steps`, `@webship-js/material-ui-steps`): the component packs speak
the same words, so a scenario reads the same whatever library draws the page. Dialogs, side panels, drop-down menus and
popovers opened, answered and closed; panels and tabs; fields shown as valid or invalid: 18 phrases with Bootstrap's and
UIkit's packs, and with Material UI's its select lists and search lists too (24). A project loads the one pack of the
library its site is built with, never two of them.

No phrase is shared with any other published pack, the Next.js, Vue and Svelte packs among them. A switch is read as
turned on or off (`Then the "Enable notifications" switch should be turned on`), so it stays apart from the switches of
the Craft CMS pack (`the "Enabled" switch should be on`).

## Findings

Headless UI's playgrounds are used as Headless UI ships them. Read while the steps were written, left as they are and
not filed:

1. **The plain menu's items answer with `window.alert`** ("You clicked on #support"): the scenarios that choose one accept
   the alert first, with webship-js's own `I will accept the next dialog`.
2. **A popover's and a panel's content has no role**, and so no name: they are found from the button that opens them.
3. **A dialog's own element can have no box** (in the playgrounds' dialogs, its panel and backdrop are fixed to the
   window): it is shown when a child of it is, and what it shows is read on the text itself. **A dialog with no
   DialogTitle has no name** (the React playground's dialog with its built-in transition): it is found by its heading.
4. **The radio group example logs React's warning** about an input going from uncontrolled to controlled when a choice is
   made (it starts with no value): its scenario is tagged `@js-warn`, so the warning is reported, not failed on.
5. **A disabled tab says so after its name** ("Company(disabled)"): a tab is found by its name, else by the start of its
   text.
6. **The playgrounds' select lists and search lists start on a person picked at random** (`Math.random()` when they
   mount, on both lines): their scenarios, the ones that must fail among them, choose first and read only what they
   chose.

## Headless UI's own tests and this pack

Headless UI's repository asserts each component's states in its own tests (`accessibility-assertions.ts` and
`interactions.ts` of `packages/@headlessui-react/src/test-utils`, MIT): which ARIA and which state each component
carries while it is open, active, selected or checked. They were read for the states the steps wait on. Nothing of them
is in this repository.

## Testing this package

Two sites, each made at the run from its own release and served from its production build, in a Node.js 24 container
pinned by its digest:

| Site | Made by | Served by | What it is |
| --- | --- | --- | --- |
| `demo` (default), `http://127.0.0.1:8505` | `.github/scripts/build-demo.sh` | `.github/scripts/serve-demo.sh` | Headless UI 2.2.10's React playground examples in a Vite app, and a page of form fields of ours |
| `vue`, `http://127.0.0.1:8506` | `.github/scripts/build-vue.sh` | `.github/scripts/serve-vue.sh` | Headless UI 1.7.23's Vue playground, as it ships |

```bash
npm ci
npx playwright install chromium
bash .github/scripts/build-demo.sh && bash .github/scripts/serve-demo.sh &   # then:
npx cucumber-js                                     # the demo's suite
npm run test:must-fail                              # the assertions that must fail
SITE=vue npx cucumber-js                            # the Vue playground (build-vue.sh, serve-vue.sh first)
npm run test:examples                               # every example and feature step resolves to one definition
npm run test:paths                                  # a feature named on the command line runs alone
```

CI does the same for each site: the suite twice, then the assertions that must fail, each failing at its last step with
the message it announces and a hint.

## The demo

`demo-src/assemble.sh` assembles the demo; `.github/scripts/build-demo.sh` then installs it from its lock and builds it.
- It takes the examples of Headless UI's own React playground at the release `@headlessui/react@v2.2.10`, copied
  unchanged into a Vite React app (`src/page-examples/`), from `playgrounds/react/page-examples/` of
  [github.com/tailwindlabs/headlessui](https://github.com/tailwindlabs/headlessui), with the playground's own helpers
  they import: `playgrounds/react/components/`, `playgrounds/react/utils/` (`class-names.ts`, `match.ts`,
  `hooks/use-popper.ts`) and `playgrounds/react/data.ts`. Each example is at the path the playground gives it
  (`/menu/menu`, `/dialog/dialog` …).
- This pack's own files are the glue in `demo-src/`: the entry that lists the examples and picks the one a path names
  (`src/main.tsx`, as the playground's index and its page loader do), two stand-ins (`src/shims/`: the one Next.js link
  an example imports, a plain link here; and react-flatpickr's component, which that CommonJS package hands over as its
  whole module in Vite's build), `index.html`, `vite.config.ts`, `package.json` with its lock, and `npmrc`, which
  becomes the app's `.npmrc` (npm leaves a file of that name out of a package): `legacy-peer-deps`, since framer-motion 6
  and react-flatpickr 3, the majors the playground asks for, stop their React peer range at 18.
  `assemble.sh --minimal` makes the glue alone with Tailwind CSS 4 (`minimal-styles.css`): the Workspace plugin's
  starter. The package ships them, so the Workspace's Headless UI plugin makes the same demo from this pack's release.
- **One page is ours, not Headless UI's:** `src/ours/form-fields.tsx` (`/ours/form-fields`), form fields as Headless
  UI's documentation shows them (Field, Label, Description, Input, Select, Textarea, Fieldset and Legend). The playground
  has no field marked invalid, and forms are where the steps that read a field's validity are used.
- No font or style comes from a CDN: the examples' styles are the playground's own `styles.css`, built with Tailwind CSS
  4.

Headless UI's code, its playgrounds' examples among it, is released under the
[MIT licence](https://github.com/tailwindlabs/headlessui/blob/main/LICENSE) by Tailwind Labs. It is fetched and built at
each run, inside the demo's build, and is not part of this package or this repository.

`.github/scripts/build-vue.sh` makes the second site: Headless UI's own Vue playground as it ships
(`packages/playground-vue` at the release `@headlessui/vue@v1.7.23`, MIT). In its repository it takes `@headlessui/vue`
and `@headlessui/tailwindcss` from the repository's own packages and `@popperjs/core` from its root; here they come from
npm, and the two its manifest does not list are added: `@headlessui/tailwindcss` (its `tailwind.config.js` asks for it)
and `@popperjs/core` (its `playground-utils` import it). Its lock is this pack's (`.github/vue/package-lock.json`).

## How the steps were written

Every component a step touches was opened in a real browser first, on both playgrounds, and its state, its ARIA and its
transitions were read on every frame while it moved: when a menu is in the page and when it has faded in, where the focus
goes, how long a list's options stay after a choice, what a dialog does to the rest of the page, where a portal is. The
steps were written from that, and are proven on Headless UI 2.2.10 for React and 1.7.23 for Vue, in English, with
Chromium.

## License

MIT

## Logo

The logo is Simple Icons' Headless UI icon (`icons/headlessui.svg` of simple-icons 16.37.0, CC0-1.0), in the colour
the set lists for the brand (`#66E3FF`); its path is unmodified. It names the library the pack tests. Headless UI and
its mark are Tailwind Labs'. It is not covered by this package's licence.
