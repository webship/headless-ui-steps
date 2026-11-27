'use strict';

// Shared helpers for the step files of this pack.
//
// Not a step file: it registers no step definitions. It holds the plumbing the steps use and that a project can
// require for its own steps: how a component is found the way a person reads it, and how the steps wait for it.
//
// Headless UI gives components their behaviour and their ARIA and leaves their looks to the app. Its state is in a list
// of tokens on every component, data-headlessui-state ("open", "active", "focus", "selected", "checked", "disabled"):
// the React line (2.x) also sets them as attributes of their own (data-open, data-selected …), the Vue line (1.7) has
// the tokens only, so the steps read the tokens and the ARIA, which both lines set. Its transitions are CSS
// transitions: the React line marks them (data-enter, data-leave, data-transition, data-closed), the Vue line runs them
// through classes; either way they are read from the browser (Element.getAnimations) and waited for to end, never for a
// fixed time. Menus, lists and panels drawn with an anchor, and dialogs, are rendered in #headlessui-portal-root at the
// end of the page; while a dialog is open the rest of the page carries aria-hidden="true" and inert, so the steps look
// inside the open dialog.
//
// Everything builds on webship-js's own helpers (`friendly`, `failure`), so the steps fail the way the core webship-js
// steps do.

const webship = require('webship-js/tests/step-definitions/webship');

const { friendly } = webship;

// What to check when a step fails, by what the failure is about: every failure of this pack carries a hint, its own
// when the step gives one, else the one of its subject.
const HINTS = [
  [/popover/, 'a popover is the panel a button opens (aria-controls); it has no name of its own, so it is named by the button that opens it, or by the name a scenario gives it when it opens it.'],
  [/drop-down menu/, 'a drop-down menu is named by the button that opens it (aria-labelledby); its items are menuitems named by their text.'],
  [/dialog|side panel/, 'a dialog is named by its title (aria-labelledby, its DialogTitle), or by a heading in it or the start of its text when it has none; a side panel is a dialog at the side of the window.'],
  [/search list/, 'a search list is a Combobox named by its label; its options show in a listbox once something is typed in it.'],
  [/select list/, 'a select list is a Listbox named by its label (Headless UI adds the option it shows to its name, the label alone finds it); its options show in a listbox while it is open.'],
  [/switch/, 'a switch is named by its label (aria-labelledby); it is on when aria-checked is "true".'],
  [/radio group/, 'a radio group is named by its label; its choices are radios named by their text, the chosen one with aria-checked="true".'],
  [/field/, 'a field is named by its label; Headless UI marks one that is invalid with aria-invalid and data-invalid, and points it at its descriptions with aria-describedby.'],
  [/panel/, 'a panel is a Disclosure named by the text of its button; its content is the panel the button controls (aria-controls), there only while it is expanded.'],
  [/tab/, 'a tab is named by its text; its content is the tabpanel it controls (aria-controls); a disabled tab cannot be chosen.'],
  [/transition/, 'a transition that never ends is an animation with no end: check the page for a component stuck in a state.'],
  [/button|link/, 'a button or a link is named by its text, or by its aria-label when it shows only an icon.'],
];

function failure(page, message, details) {
  const info = { ...(details || {}) };
  if (!info.hint) {
    const found = HINTS.find(([re]) => re.test(message));
    info.hint = found ? found[1] : 'names are read the way a person reads them: check the spelling, and that the page shows it.';
  }
  return webship.failure(page, message, info);
}

// The budgets of the waits (milliseconds): each is a ceiling, not a pause.
const WAIT = {
  shown: 10000,  // a component to be shown and stop moving
  gone: 10000,   // a component to be closed and gone
  value: 10000,  // a field, a list or a tab to show what a step expects
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const kindOf = (word) => (/^drop-?down menu$/.test(word) ? 'drop-down menu' : word);

// What a world remembers of the components a scenario opened with a named button: a popover, or a menu with no name of
// its own, is known by the name the scenario gave it.
function opened(world) {
  if (!world.headlessUiOpened) world.headlessUiOpened = {};
  return world.headlessUiOpened;
}

// The browser-side probe: what a component is doing, read in the page.
const PROBE = `(() => {
  const moving = (el) => (el && el.getAnimations ? el.getAnimations({ subtree: true }) : [])
    .filter((a) => a.playState === 'running' && (!a.effect || !a.effect.getTiming || a.effect.getTiming().iterations !== Infinity)).length;
  const marked = (el) => Boolean(el && (el.matches('[data-transition], [data-enter], [data-leave]') || el.querySelector('[data-transition], [data-enter], [data-leave]')));
  const boxed = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  // A dialog's own element can have no box of its own (its panel and backdrop are fixed in the window): it is shown when
  // a child of it is.
  const visible = (el) => { if (!el || !el.isConnected) return false; const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.display === 'none') return false; return boxed(el) || [...el.querySelectorAll('*')].some(boxed); };
  const opacity = (el) => { let o = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity || '1'); return o; };
  return { moving, marked, visible, opacity };
})()`;

// Is the element shown and still? { shown, opacity, moving }: moving counts its running transitions and the React
// line's transition marks.
async function stateOf(locator) {
  return locator.evaluate((el, probe) => {
    // eslint-disable-next-line no-new-func
    const p = new Function(`return ${probe}`)();
    return { shown: p.visible(el), opacity: Math.round(p.opacity(el) * 1000) / 1000, moving: p.moving(el) + (p.marked(el) ? 1 : 0) };
  }, PROBE).catch(() => ({ shown: false, gone: true, opacity: 0, moving: 0 }));
}

// Wait until the first element of `locator` is shown and has stopped moving: visible, full opacity, no transition
// running in it or its children (a dialog stays at full opacity while its panel and backdrop fade in). Returns true, or
// the last state seen.
async function waitShown(locator, timeout = WAIT.shown) {
  const end = Date.now() + timeout;
  let last = { shown: false };
  while (Date.now() < end) {
    if (await locator.count() > 0) {
      last = await stateOf(locator.first());
      if (last.shown && last.opacity >= 0.999 && last.moving === 0) return true;
    } else {
      last = { shown: false, gone: true };
    }
    await sleep(40);
  }
  return last;
}

// Wait until no element of `locator` is shown and none is moving: closed and gone (removed, or hidden and still).
async function waitGone(locator, timeout = WAIT.gone) {
  const end = Date.now() + timeout;
  let last = { shown: true };
  while (Date.now() < end) {
    const n = await locator.count();
    if (n === 0) return true;
    let any = false;
    for (let i = 0; i < n; i += 1) {
      last = await stateOf(locator.nth(i));
      if (last.shown || last.moving > 0) { any = true; break; }
    }
    if (!any) return true;
    await sleep(40);
  }
  return last;
}

// No CSS transition running anywhere in the page, and none marked (an endless animation, a spinner's, does not count).
async function waitStill(page, timeout = WAIT.shown) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const moving = await page.evaluate(() => document.getAnimations()
      .filter((a) => a.playState === 'running' && (!a.effect || !a.effect.getTiming || a.effect.getTiming().iterations !== Infinity)).length
      + document.querySelectorAll('[data-transition], [data-enter], [data-leave]').length).catch(() => 0);
    if (moving === 0) return true;
    await sleep(40);
  }
  return false;
}

// How a state reads in a failure.
function describe(state) {
  if (state === true) return 'as expected';
  if (!state || state.gone) return 'not in the page';
  if (!state.shown) return 'in the page but hidden';
  if (state.moving) return `still moving (${state.moving} transition(s) running, opacity ${state.opacity})`;
  if (state.opacity < 0.999) return `shown at opacity ${state.opacity}`;
  return 'shown';
}

// The text matched the way a person reads it: in any case, and any run of white space as one space.
function textRe(text, { exact = false } = {}) {
  const t = String(text).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(exact ? `^\\s*${t}\\s*$` : t, 'i');
}

// The tokens of a component's state (data-headlessui-state): both lines set them.
async function tokensOf(locator) {
  return locator.evaluate((el) => (el.getAttribute('data-headlessui-state') || '').split(/\s+/).filter(Boolean)).catch(() => []);
}

// The dialogs of a page: role=dialog, or role=alertdialog for one that asks something.
const DIALOGS = '[role=dialog], [role=alertdialog]';

// A dialog by its name (its title), by a heading in it, or, for one with neither, by the start of its text.
function dialog(page, name) {
  const all = page.locator(DIALOGS);
  const named = page.getByRole('dialog', { name, exact: true }).or(page.getByRole('alertdialog', { name, exact: true })).and(all);
  const byHeading = all.filter({ has: page.getByRole('heading', { name, exact: true }) });
  const byText = all.filter({ hasText: textRe(name) });
  return named.or(byHeading).or(byText);
}

const esc = (s) => String(s).replace(/["\\]/g, '\\$&');

// A drop-down menu (Menu): by its name, which Headless UI gives it from the button that opens it (aria-labelledby), or
// by the name the scenario gave it when it opened it with a named button.
function dropMenu(world, name) {
  const page = world.page;
  return page.getByRole('menu', { name, exact: true }).or(page.locator(`[role=menu][data-webship-name="${esc(name)}"]`));
}

// A popover (Popover): its panel has no role and no name; it is the one the scenario opened under that name, or the one
// the button of that name controls (aria-controls), marked when the button is pressed.
function popover(world, name) {
  const page = world.page;
  return page.locator(`[data-webship-name="${esc(name)}"], [data-webship-for="${esc(name)}"]`);
}

// Mark the panel a named button controls, so later steps find it by the button's name.
async function markControlled(page, name) {
  const btn = page.getByRole('button', { name, exact: true }).first();
  if (await btn.count() === 0) return false;
  const id = await btn.getAttribute('aria-controls').catch(() => null);
  if (!id) return false;
  await page.evaluate(({ id, name }) => { const el = document.getElementById(id); if (el) el.setAttribute('data-webship-for', name); }, { id, name });
  return true;
}

// A component of a kind by its name.
function component(world, kind, name) {
  const page = world.page;
  switch (kindOf(kind)) {
    case 'dialog': case 'side panel': return dialog(page, name);
    case 'drop-down menu': return dropMenu(world, name);
    case 'popover': return popover(world, name);
    default: throw new Error(`No such kind of component: ${kind}`);
  }
}

// Any shown component of a kind.
function anyOf(world, kind) {
  const page = world.page;
  switch (kindOf(kind)) {
    case 'dialog': case 'side panel': return page.locator(DIALOGS);
    case 'drop-down menu': return page.getByRole('menu');
    case 'popover': return page.locator('[id^=headlessui-popover-panel]');
    default: throw new Error(`No such kind of component: ${kind}`);
  }
}

// The first of `candidates` whose label is `label`: its aria-label, else the first element it is labelled by
// (aria-labelledby), else its <label>; a required field's asterisk is not part of it. Returns a locator of that element
// that does not go through the accessibility tree (it is marked with data-webship-label): while a dialog is open the
// rest of the page is aria-hidden and inert. Or null.
async function byLabel(candidates, label) {
  const want = String(label).trim().toLowerCase().replace(/\s*:\s*$/, '');
  const n = await candidates.count();
  for (let i = 0; i < n; i += 1) {
    const c = candidates.nth(i);
    const own = await c.evaluate((el) => {
      const clean = (t) => String(t || '').replace(/[\s\u200b]+/g, ' ').replace(/\s*\*\s*$/, '').replace(/\s*:\s*$/, '').trim().toLowerCase();
      if (el.getAttribute('aria-label')) return clean(el.getAttribute('aria-label'));
      const ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
      if (ids.length) return clean((document.getElementById(ids[0]) || {}).textContent);
      if (el.labels && el.labels.length) return clean(el.labels[0].textContent);
      return '';
    }).catch(() => '');
    if (own === want) {
      const mark = String(label).trim();
      await c.evaluate((el, m) => el.setAttribute('data-webship-label', m), mark);
      return candidates.page().locator(`[data-webship-label="${esc(mark)}"]`).first();
    }
  }
  return null;
}

// The texts an element points at with aria-describedby.
async function describedBy(locator) {
  return locator.evaluate((el) => (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)
    .map((id) => ((document.getElementById(id) || {}).textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean)).catch(() => []);
}

module.exports = {
  WAIT, sleep, kindOf, opened, stateOf, waitShown, waitGone, waitStill, describe, textRe, tokensOf,
  DIALOGS, dialog, dropMenu, popover, markControlled, component, anyOf, byLabel, describedBy, esc,
  friendly, failure,
};
