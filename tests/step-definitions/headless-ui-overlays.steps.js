'use strict';

// Dialogs (and a dialog at the side of the window, a side panel), drop-down menus and popovers: opened, read, answered,
// closed. A dialog is named by its title; a menu by the button that opens it; a popover, which has no name of its own, by
// the button that opens it. Each step waits for the component's own state and for its transitions to end.

const { When, Then } = require('@cucumber/cucumber');
const h = require('./headless-ui-helpers');

const KIND = '(dialog|side panel|drop-?down menu|popover)';

async function expectShown(world, kind, name) {
  const done = await h.waitShown(h.component(world, kind, name));
  if (done === true) return;
  throw h.failure(world.page, `Expected the "${name}" ${h.kindOf(kind)} to be shown, but it is ${h.describe(done)} after ${h.WAIT.shown / 1000} seconds.`);
}

async function expectGone(world, kind, name) {
  const done = await h.waitGone(h.component(world, kind, name));
  if (done === true) return;
  throw h.failure(world.page, `Expected the "${name}" ${h.kindOf(kind)} to be closed, but it is ${h.describe(done)} after ${h.WAIT.gone / 1000} seconds.`);
}

/**
 * Open a dialog, a side panel, a drop-down menu or a popover by pressing the button (or link) that opens it, then wait
 * until it is shown and still. With no button named, the button is the one of the component's name (a menu's or a
 * popover's button). A menu or a popover is then known by the name the scenario gives it.
 *
 * Example #1: When I open the "Options" drop-down menu
 * Example #2: And I open the "Deactivate account" dialog with the "Toggle!" button
 * Example #3: When I open the "Solutions" popover
 * Example #4: And we open the "Account" drop-down menu with the "Options" button
 * Example #5: When I open the "Settings" side panel with the "Open settings" button
 */
When(/^(?:I |we )?open the "([^"]*)" (dialog|side panel|drop-?down menu|popover)(?: with the "([^"]*)" (button|link))?$/, async function (name, kind, by, role) {
  const page = this.page;
  const k = h.kindOf(kind);
  const label = by || name;
  const control = page.getByRole(role === 'link' ? 'link' : 'button', { name: label, exact: true }).first();
  if (await control.count() === 0) throw h.failure(page, `Expected a ${role || 'button'} named "${label}" to open the "${name}" ${k}, but the page has none.`);
  await control.click();
  if (k === 'drop-down menu' || k === 'popover') {
    const id = await control.getAttribute('aria-controls').catch(() => null);
    if (id) await page.evaluate(({ id, name }) => { const el = document.getElementById(id); if (el) el.setAttribute('data-webship-name', name); }, { id, name });
    h.opened(this)[`${k}:${name}`] = true;
  }
  await expectShown(this, k, name);
});

/**
 * Close a dialog, a side panel, a drop-down menu or a popover: its own close button when it has one, else Escape; then
 * wait until it is gone.
 *
 * Example #1: When I close the "Deactivate account" dialog
 * Example #2: And I close the "Options" drop-down menu
 * Example #3: When we close the "Solutions" popover
 * Example #4: And I close the "Settings" side panel
 * Example #5: When I close the "Payment successful" dialog
 */
When(/^(?:I |we )?close the "([^"]*)" (dialog|side panel|drop-?down menu|popover)$/, async function (name, kind) {
  const page = this.page;
  const k = h.kindOf(kind);
  const box = h.component(this, k, name).first();
  if (await box.count() === 0) throw h.failure(page, `Expected the "${name}" ${k} to be open, to close it, but it is not in the page.`);
  const close = box.getByRole('button', { name: /^(close|cancel|dismiss)\b/i }).first();
  if (k !== 'drop-down menu' && await close.count() > 0) await close.click();
  else { await box.focus().catch(() => {}); await page.keyboard.press('Escape'); }
  await expectGone(this, k, name);
});

/**
 * Press Escape in a dialog, a side panel, a drop-down menu or a popover, then wait for its answer: it closes.
 *
 * Example #1: When I press Escape in the "Deactivate account" dialog
 * Example #2: And I press Escape in the "Options" drop-down menu
 * Example #3: When we press Escape in the "Solutions" popover
 * Example #4: And I press Escape in the "Settings" side panel
 * Example #5: When I press Escape in the "Account" drop-down menu
 */
When(/^(?:I |we )?press Escape in the "([^"]*)" (dialog|side panel|drop-?down menu|popover)$/, async function (name, kind) {
  const k = h.kindOf(kind);
  const box = h.component(this, k, name).first();
  if (await box.count() === 0) throw h.failure(this.page, `Expected the "${name}" ${k} to be open, to press Escape in it, but it is not in the page.`);
  await box.focus().catch(() => {});
  await this.page.keyboard.press('Escape');
  await expectGone(this, k, name);
});

/**
 * Click outside a dialog, a side panel, a drop-down menu or a popover (a corner of the window), then wait for its
 * answer: it closes.
 *
 * Example #1: When I click outside the "Deactivate account" dialog
 * Example #2: And I click outside the "Options" drop-down menu
 * Example #3: When we click outside the "Solutions" popover
 * Example #4: And I click outside the "Settings" side panel
 * Example #5: When I click outside the "Account" drop-down menu
 */
When(/^(?:I |we )?click outside the "([^"]*)" (dialog|side panel|drop-?down menu|popover)$/, async function (name, kind) {
  const page = this.page;
  const k = h.kindOf(kind);
  const box = h.component(this, k, name).first();
  if (await box.count() === 0) throw h.failure(page, `Expected the "${name}" ${k} to be open, to click outside it, but it is not in the page.`);
  const size = page.viewportSize() || { width: 1280, height: 800 };
  await page.mouse.click(size.width - 5, size.height - 5);
  await expectGone(this, k, name);
});

/**
 * A dialog, a side panel, a drop-down menu or a popover is shown (its role and name, full opacity, no transition
 * running in it), or it is not (gone).
 *
 * Example #1: Then the "Deactivate account" dialog should be shown
 * Example #2: And the "Options" drop-down menu should not be shown
 * Example #3: Then the "Solutions" popover should be shown
 * Example #4: And the "Settings" side panel should not be shown
 * Example #5: Then the "Payment successful" dialog should not be shown
 */
Then(/^the "([^"]*)" (dialog|side panel|drop-?down menu|popover) should( not)? be shown$/, async function (name, kind, not) {
  if (not) await expectGone(this, kind, name);
  else await expectShown(this, kind, name);
});

/**
 * No dialog, side panel, drop-down menu or popover is shown.
 *
 * Example #1: Then no dialog should be shown
 * Example #2: And no drop-down menu should be shown
 * Example #3: Then no popover should be shown
 * Example #4: And no side panel should be shown
 * Example #5: Then no dropdown menu should be shown
 */
Then(/^no (dialog|side panel|drop-?down menu|popover) should be shown$/, async function (kind) {
  const k = h.kindOf(kind);
  const done = await h.waitGone(h.anyOf(this, k));
  if (done !== true) throw h.failure(this.page, `Expected no ${k} to be shown, but one is ${h.describe(done)}.`);
});

/**
 * A dialog, a side panel, a drop-down menu, a popover, a panel or a tab shows a text, or a button or a link of that
 * name (or does not).
 *
 * Example #1: Then the "Deactivate account" dialog should show "This will permanently deactivate your account"
 * Example #2: And the "Options" drop-down menu should show "Account settings"
 * Example #3: Then the "Solutions" popover should show "Insights"
 * Example #4: And the "Trigger" panel should show "Content"
 * Example #5: Then the "Team Members" tab should not show "Billing history"
 */
Then(/^the "([^"]*)" (dialog|side panel|drop-?down menu|popover|panel|tab) should( not)? show "([^"]*)"$/, async function (name, kind, not, text) {
  const page = this.page;
  const k = h.kindOf(kind);
  let box;
  if (k === 'panel' || k === 'tab') {
    const role = k === 'tab' ? 'tab' : 'button';
    const control = page.getByRole(role, { name, exact: true }).first();
    if (await control.count() === 0) throw h.failure(page, `Expected a ${k} named "${name}", but the page has none.`);
    const id = await control.getAttribute('aria-controls');
    box = id ? page.locator(`[id="${h.esc(id)}"]`) : page.locator('[data-webship-none]');
  } else {
    box = h.component(this, k, name).first();
    if (!not) {
      const done = await h.waitShown(box);
      if (done !== true) throw h.failure(page, `Expected the "${name}" ${k} to show "${text}", but it is ${h.describe(done)}.`);
    }
  }
  // What is read is the text itself, not the component's own box: a dialog element can have no box of its own (its
  // children are fixed to the window), and a panel can hold the text in a part that is hidden.
  const seen = box.getByText(h.textRe(text)).or(box.getByRole('button', { name: text, exact: true }))
    .or(box.getByRole('link', { name: text, exact: true })).filter({ visible: true });
  const end = Date.now() + h.WAIT.value;
  let shows = false;
  do {
    shows = await seen.count().catch(() => 0) > 0;
    if (shows !== Boolean(not)) return;
    await h.sleep(40);
  } while (Date.now() < end);
  throw h.failure(page, `Expected the "${name}" ${k} ${not ? 'not ' : ''}to show "${text}", but it ${not ? 'does' : 'does not'}.`);
});

/**
 * Press a button or a link in a dialog, a side panel or a popover, then wait for the component's answer: still shown,
 * or gone.
 *
 * Example #1: When I press "Deactivate" in the "Deactivate account" dialog
 * Example #2: And I press "Cancel" in the "Deactivate account" dialog
 * Example #3: When we press "Insights" in the "Solutions" popover
 * Example #4: And I press "Save" in the "Settings" side panel
 * Example #5: When I press "Got it, thanks!" in the "Payment successful" dialog
 */
When(/^(?:I |we )?press "([^"]*)" in the "([^"]*)" (dialog|side panel|popover)$/, async function (label, name, kind) {
  const page = this.page;
  const k = h.kindOf(kind);
  const box = h.component(this, k, name).first();
  const shown = await h.waitShown(box);
  if (shown !== true) throw h.failure(page, `Expected the "${name}" ${k} to be shown, to press "${label}" in it, but it is ${h.describe(shown)}.`);
  const control = box.getByRole('button', { name: label, exact: true }).or(box.getByRole('link', { name: label, exact: true })).first();
  if (await control.count() === 0) throw h.failure(page, `Expected the "${name}" ${k} to have a button or a link named "${label}", but it has none.`);
  await control.click();
  await h.waitStill(page);
});

/**
 * Choose an item of a drop-down menu: open the menu when it is closed, click the item, wait until the menu is gone.
 * An item that runs window.alert is answered by webship-js's own dialog steps, given before this one.
 *
 * Example #1: When I choose "Account settings" from the "Options" drop-down menu
 * Example #2: And I choose "Sign out" in the "Options" drop-down menu
 * Example #3: When we choose "Support" from the "Account" dropdown menu
 * Example #4: And I choose "License" from the "Options" drop-down menu
 * Example #5: When I choose "Duplicate" from the "Edit" drop-down menu
 */
When(/^(?:I |we )?choose "([^"]*)" (?:from|in) the "([^"]*)" drop-?down menu$/, async function (item, name) {
  const page = this.page;
  let menu = h.dropMenu(this, name).first();
  if (!(await menu.count() > 0 && await menu.isVisible().catch(() => false))) {
    const button = page.getByRole('button', { name, exact: true }).first();
    if (await button.count() === 0) throw h.failure(page, `Expected the "${name}" drop-down menu, or its button, but the page has neither.`);
    await button.click();
    menu = h.dropMenu(this, name).first();
    const shown = await h.waitShown(menu);
    if (shown !== true) throw h.failure(page, `Expected the "${name}" drop-down menu to open, but it is ${h.describe(shown)}.`);
  }
  const entry = menu.getByRole('menuitem', { name: item, exact: true }).or(menu.getByRole('menuitem').filter({ hasText: h.textRe(item) })).first();
  if (await entry.count() === 0) throw h.failure(page, `Expected the "${name}" drop-down menu to have an item "${item}", but it has none.`);
  await entry.click();
  const gone = await h.waitGone(h.dropMenu(this, name));
  if (gone !== true) throw h.failure(page, `Expected the "${name}" drop-down menu to close after "${item}" was chosen, but it is ${h.describe(gone)}.`);
});

/**
 * An item of an open drop-down menu is active (the one the keyboard is on: aria-activedescendant, the "active" state)
 * or disabled (aria-disabled, the "disabled" state), or it is not.
 *
 * Example #1: Then "Account settings" should be active in the "Options" drop-down menu
 * Example #2: And "New feature (soon)" should be disabled in the "Options" drop-down menu
 * Example #3: Then "Support" should not be active in the "Options" drop-down menu
 * Example #4: And "Sign out" should not be disabled in the "Options" drop-down menu
 * Example #5: Then "License" should not be active in the "Account" dropdown menu
 */
Then(/^"([^"]*)" should( not)? be (active|disabled) in the "([^"]*)" drop-?down menu$/, async function (item, not, what, name) {
  const page = this.page;
  const menu = h.dropMenu(this, name).first();
  const shown = await h.waitShown(menu);
  if (shown !== true) throw h.failure(page, `Expected the "${name}" drop-down menu to be open, to read "${item}" in it, but it is ${h.describe(shown)}.`);
  const entry = menu.getByRole('menuitem').filter({ hasText: h.textRe(item) }).first();
  if (await entry.count() === 0) throw h.failure(page, `Expected the "${name}" drop-down menu to have an item "${item}", but it has none.`);
  const end = Date.now() + h.WAIT.value;
  let is = false;
  do {
    const tokens = await h.tokensOf(entry);
    is = what === 'disabled'
      ? tokens.includes('disabled') || (await entry.getAttribute('aria-disabled')) === 'true'
      : tokens.includes('active') || await menu.evaluate((m, e) => m.getAttribute('aria-activedescendant') === e, await entry.getAttribute('id'));
    if (is !== Boolean(not)) return;
    await h.sleep(40);
  } while (Date.now() < end);
  throw h.failure(page, `Expected "${item}" ${not ? 'not ' : ''}to be ${what} in the "${name}" drop-down menu, but it ${is ? 'is' : 'is not'}.`);
});

/**
 * Wait until no transition runs in the page: for a step of webship-js's own (I press …) whose next step reads what it
 * opened or closed.
 *
 * Example #1: When I wait for the transitions to finish
 * Example #2: And I wait for the transitions to finish
 * Example #3: When we wait for the transitions to finish
 * Example #4: And we wait for the transitions to finish
 * Example #5: Then I wait for the transitions to finish
 */
When(/^(?:I |we )?wait for the transitions to finish$/, async function () {
  const done = await h.waitStill(this.page);
  if (!done) throw h.failure(this.page, `Expected the page's transitions to finish within ${h.WAIT.shown / 1000} seconds, but one is still running.`);
});
