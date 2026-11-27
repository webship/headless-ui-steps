'use strict';

// Panels (Disclosure) and tabs (TabGroup). A panel is named by the text of its button and is there only while it is
// expanded; a tab is named by its text and shows the tabpanel it controls (the others are empty placeholders).

const { When, Then } = require('@cucumber/cucumber');
const h = require('./headless-ui-helpers');

// A panel's button: a button that says whether it is expanded (aria-expanded), by its text.
async function panelButton(world, name) {
  const page = world.page;
  const btn = page.locator('button[aria-expanded]').filter({ hasText: h.textRe(name, { exact: true }) })
    .or(page.getByRole('button', { name, exact: true }).and(page.locator('[aria-expanded]'))).first();
  if (await btn.count() === 0) throw h.failure(page, `Expected a panel named "${name}", but the page has none.`);
  return btn;
}

// Is the panel expanded and still: its button says so, and its panel is shown with no transition running.
async function panelState(page, btn) {
  const expanded = (await btn.getAttribute('aria-expanded')) === 'true';
  const id = await btn.getAttribute('aria-controls').catch(() => null);
  const panel = id ? page.locator(`[id="${h.esc(id)}"]`) : null;
  const s = panel && await panel.count() > 0 ? await h.stateOf(panel) : { shown: false, gone: true, moving: 0 };
  return { expanded, shown: s.shown, moving: s.moving };
}

async function waitPanel(world, btn, want) {
  const end = Date.now() + h.WAIT.shown;
  let s;
  do {
    s = await panelState(world.page, btn);
    if (want === 'expanded' && s.expanded && s.shown && !s.moving) return true;
    if (want === 'collapsed' && !s.expanded && !s.shown && !s.moving) return true;
    await h.sleep(40);
  } while (Date.now() < end);
  return s;
}

const panelWords = (s) => `${s.expanded ? 'expanded' : 'collapsed'}${s.moving ? ', still moving' : ''}`;

/**
 * Expand or collapse a panel: its button is clicked when the panel is not already so, and the step waits until the
 * panel is shown and still, or gone.
 *
 * Example #1: When I expand the "Trigger" panel
 * Example #2: And I collapse the "Trigger" panel
 * Example #3: When we expand the "What is your refund policy?" panel
 * Example #4: And we collapse the "What is your refund policy?" panel
 * Example #5: When I expand the "Do you offer technical support?" panel
 */
When(/^(?:I |we )?(expand|collapse) the "([^"]*)" panel$/, async function (verb, name) {
  const btn = await panelButton(this, name);
  const want = verb === 'expand' ? 'expanded' : 'collapsed';
  if (((await btn.getAttribute('aria-expanded')) === 'true') !== (want === 'expanded')) await btn.click();
  const done = await waitPanel(this, btn, want);
  if (done !== true) throw h.failure(this.page, `Expected the "${name}" panel to be ${want} after it was clicked, but it is ${panelWords(done)}.`);
});

/**
 * A panel is expanded (its button's aria-expanded, its content shown and still) or collapsed (its content gone).
 *
 * Example #1: Then the "Trigger" panel should be expanded
 * Example #2: And the "Trigger" panel should be collapsed
 * Example #3: Then the "What is your refund policy?" panel should be expanded
 * Example #4: And the "What is your refund policy?" panel should be collapsed
 * Example #5: Then the "Do you offer technical support?" panel should be collapsed
 */
Then(/^the "([^"]*)" panel should be (expanded|collapsed)$/, async function (name, want) {
  const btn = await panelButton(this, name);
  const done = await waitPanel(this, btn, want);
  if (done !== true) throw h.failure(this.page, `Expected the "${name}" panel to be ${want}, but it is ${panelWords(done)}.`);
});

// A tab by its name: exactly, else by the start of its text (a disabled tab may say so after its name: "Company
// (disabled)").
async function tabOf(world, name) {
  const page = world.page;
  const exact = page.getByRole('tab', { name, exact: true }).or(page.getByRole('tab').filter({ hasText: h.textRe(name, { exact: true }) }));
  const start = page.getByRole('tab').filter({ hasText: new RegExp(`^\\s*${String(name).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\b|\\s|\\()`, 'i') });
  const tab = (await exact.count() > 0 ? exact : start).first();
  if (await tab.count() === 0) {
    const names = await page.getByRole('tab').allInnerTexts().catch(() => []);
    throw h.failure(page, `Expected a tab named "${name}", but the page has none (its tabs: ${names.map((t) => `"${t.trim()}"`).join(', ') || 'none'}).`);
  }
  return tab;
}

async function tabActive(page, tab) {
  const selected = (await tab.getAttribute('aria-selected')) === 'true';
  if (!selected) return false;
  const id = await tab.getAttribute('aria-controls').catch(() => null);
  if (!id) return true;
  const panel = page.locator(`[id="${h.esc(id)}"]`);
  return await panel.count() > 0 && (await h.stateOf(panel)).shown;
}

/**
 * Switch to a tab: it is clicked, and the step waits until it is selected and its tabpanel shown. A disabled tab cannot
 * be chosen, and the step says so.
 *
 * Example #1: When I switch to the "Billing" tab
 * Example #2: And I switch to the "My Account" tab
 * Example #3: When we switch to the "Team Members" tab
 * Example #4: And we switch to the "Recent" tab
 * Example #5: When I switch to the "Popular" tab
 */
When(/^(?:I |we )?switch to the "([^"]*)" tab$/, async function (name) {
  const page = this.page;
  const tab = await tabOf(this, name);
  if (await tab.isDisabled().catch(() => false) || (await h.tokensOf(tab)).includes('disabled')) {
    throw h.failure(page, `Expected to switch to the "${name}" tab, but it is disabled.`);
  }
  await tab.click();
  const end = Date.now() + h.WAIT.shown;
  while (Date.now() < end) {
    if (await tabActive(page, tab)) { await h.waitStill(page); return; }
    await h.sleep(40);
  }
  throw h.failure(page, `Expected the "${name}" tab to be active after it was clicked, but it is not.`);
});

/**
 * A tab is active (aria-selected, its tabpanel shown), or it is not.
 *
 * Example #1: Then the "Billing" tab should be active
 * Example #2: And the "My Account" tab should not be active
 * Example #3: Then the "Team Members" tab should be active
 * Example #4: And the "Recent" tab should not be active
 * Example #5: Then the "Popular" tab should be active
 */
Then(/^the "([^"]*)" tab should( not)? be active$/, async function (name, not) {
  const page = this.page;
  const tab = await tabOf(this, name);
  const end = Date.now() + h.WAIT.value;
  let is = false;
  do {
    is = await tabActive(page, tab);
    if (is !== Boolean(not)) return;
    await h.sleep(40);
  } while (Date.now() < end);
  throw h.failure(page, `Expected the "${name}" tab ${not ? 'not ' : ''}to be active, but it ${is ? 'is' : 'is not'}.`);
});

/**
 * A tab is disabled (it cannot be chosen: disabled, the "disabled" state), or it is not.
 *
 * Example #1: Then the "Company" tab should be disabled
 * Example #2: And the "Billing" tab should not be disabled
 * Example #3: Then the "My Account" tab should not be disabled
 * Example #4: And the "Team Members" tab should not be disabled
 * Example #5: Then the "Archived" tab should be disabled
 */
Then(/^the "([^"]*)" tab should( not)? be disabled$/, async function (name, not) {
  const tab = this.page.getByRole('tab').filter({ hasText: h.textRe(name) }).first();
  if (await tab.count() === 0) throw h.failure(this.page, `Expected a tab named "${name}", but the page has none.`);
  const is = await tab.isDisabled().catch(() => false) || (await h.tokensOf(tab)).includes('disabled');
  if (is === Boolean(not)) throw h.failure(this.page, `Expected the "${name}" tab ${not ? 'not ' : ''}to be disabled, but it ${is ? 'is' : 'is not'}.`);
});
