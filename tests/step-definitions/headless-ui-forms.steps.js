'use strict';

// Fields and their messages, select lists (Listbox), search lists (Combobox), switches and radio groups, each named by
// its label. A select list's button is named by its label and the option it shows; the label alone finds it. A list's
// options show in a listbox while it is open; after a choice they leave, and the steps wait for them to be gone before
// anything else is clicked.

const { When, Then } = require('@cucumber/cucumber');
const h = require('./headless-ui-helpers');

// The fields a label can name: inputs, selects and textareas, Headless UI's or the page's own.
const FIELDS = 'input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea';

async function fieldOf(world, label) {
  const page = world.page;
  const found = await h.byLabel(page.locator(FIELDS), label);
  if (!found) throw h.failure(page, `Expected a field named "${label}", but the page has none.`);
  return found;
}

async function invalid(locator) {
  return locator.evaluate((el) => el.getAttribute('aria-invalid') === 'true' || el.hasAttribute('data-invalid')).catch(() => false);
}

/**
 * A field is shown as valid or as invalid: Headless UI's `invalid` sets aria-invalid and data-invalid on it.
 *
 * Example #1: Then the "Full name" field should be shown as invalid
 * Example #2: And the "Country" field should be shown as invalid
 * Example #3: Then the "Full name" field should be shown as valid
 * Example #4: And the "Delivery notes" field should be shown as invalid
 * Example #5: Then the "Delivery notes" field should be shown as valid
 */
Then(/^the "([^"]*)" field should be shown as (valid|invalid)$/, async function (label, which) {
  const f = await fieldOf(this, label);
  const end = Date.now() + h.WAIT.value;
  let is = false;
  do {
    is = await invalid(f);
    if (is === (which === 'invalid')) return;
    await h.sleep(40);
  } while (Date.now() < end);
  throw h.failure(this.page, `Expected the "${label}" field to be shown as ${which}, but it is ${is ? 'invalid' : 'valid'}.`);
});

/**
 * A field shows a message: one of the texts it points at with aria-describedby (a Description of its Field).
 *
 * Example #1: Then the "Full name" field should show the message "Enter your full name."
 * Example #2: And the "Country" field should show the message "Choose the country we ship to."
 * Example #3: Then the "Full name" field should show the message "Use your real name so the courier can find you."
 * Example #4: And the "Delivery notes" field should show the feedback "At least 10 characters: a gate code, a floor, a time."
 * Example #5: Then the "Full name" field should show the feedback "Enter your full name."
 */
Then(/^the "([^"]*)" field should show the (?:message|feedback) "([^"]*)"$/, async function (label, text) {
  const f = await fieldOf(this, label);
  const want = h.textRe(text, { exact: true });
  const end = Date.now() + h.WAIT.value;
  let texts = [];
  do {
    texts = await h.describedBy(f);
    if (texts.some((t) => want.test(t))) return;
    await h.sleep(40);
  } while (Date.now() < end);
  throw h.failure(this.page, `Expected the "${label}" field to show the message "${text}", but it shows ${texts.map((t) => `"${t}"`).join(', ') || 'none'}.`);
});

/**
 * How many fields of the page are shown as invalid (aria-invalid or data-invalid), counting the visible ones.
 *
 * Example #1: Then 2 fields should be shown as invalid
 * Example #2: And no fields should be shown as invalid
 * Example #3: Then 1 field should be shown as invalid
 * Example #4: And 3 fields should be shown as invalid
 * Example #5: Then no field should be shown as invalid
 */
Then(/^(\d+|no) fields? should be shown as invalid$/, async function (count) {
  const want = count === 'no' ? 0 : Number(count);
  const all = this.page.locator(`:is(${FIELDS}):is([aria-invalid=true], [data-invalid])`);
  const end = Date.now() + h.WAIT.value;
  let n = 0;
  do {
    n = 0;
    const total = await all.count();
    for (let i = 0; i < total; i += 1) if (await all.nth(i).isVisible().catch(() => false)) n += 1;
    if (n === want) return;
    await h.sleep(40);
  } while (Date.now() < end);
  throw h.failure(this.page, `Expected ${want || 'no'} field(s) to be shown as invalid, but ${n} are.`);
});

// A select list's button (Listbox) by its label.
async function selectList(world, label) {
  const page = world.page;
  const found = await h.byLabel(page.locator('button[aria-haspopup=listbox]'), label);
  if (!found) throw h.failure(page, `Expected a select list named "${label}", but the page has none.`);
  return found;
}

// The listbox a select list or a search list opened: the one it controls, else the one labelled by it.
async function optionsOf(page, control) {
  const id = await control.getAttribute('aria-controls').catch(() => null);
  if (id) return page.locator(`[id="${h.esc(id)}"]`);
  const own = await control.getAttribute('id');
  return page.locator(`[role=listbox][aria-labelledby~="${h.esc(own)}"]`);
}

// The text a list's option is read by: its first line (an option may show a second one).
const firstLine = (t) => String(t || '').split('\n').map((s) => s.trim()).filter(Boolean)[0] || '';

async function optionTexts(list) {
  const opts = list.getByRole('option');
  const n = await opts.count();
  const out = [];
  for (let i = 0; i < n; i += 1) out.push(firstLine(await opts.nth(i).innerText().catch(() => '')));
  return out;
}

function optionNamed(list, text) {
  return list.getByRole('option').filter({ hasText: h.textRe(text) });
}

/**
 * Choose an option of a select list: open it, click the option, wait until its options are gone and it shows the
 * choice.
 *
 * Example #1: When I choose "Devon Webb" in the "Assigned to" select list
 * Example #2: And we choose "Arlene Mccoy" in the "Assigned to" select list
 * Example #3: When I choose "Tom Cook" in the "Assigned to" select list
 * Example #4: And I choose "Wade Cooper" in the "Assigned to" select list
 * Example #5: When we choose "Tanya Fox" in the "Assigned to" select list
 */
When(/^(?:I |we )?choose "([^"]*)" in the "([^"]*)" select list$/, async function (option, label) {
  const page = this.page;
  const button = await selectList(this, label);
  if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click();
  const list = await optionsOf(page, button);
  const shown = await h.waitShown(list);
  if (shown !== true) throw h.failure(page, `Expected the options of the "${label}" select list to show, but they are ${h.describe(shown)}.`);
  const entry = optionNamed(list, option).first();
  if (await entry.count() === 0) {
    const all = await optionTexts(list);
    throw h.failure(page, `Expected the "${label}" select list to offer "${option}", but it offers ${all.map((t) => `"${t}"`).join(', ') || 'nothing'}.`);
  }
  await entry.click();
  const gone = await h.waitGone(list);
  if (gone !== true) throw h.failure(page, `Expected the options of the "${label}" select list to be gone after the choice, but they are ${h.describe(gone)}.`);
  const shows = firstLine(await button.innerText());
  if (!h.textRe(option).test(shows)) throw h.failure(page, `Expected the "${label}" select list to show "${option}" after the choice, but it shows "${shows}".`);
});

/**
 * A select list shows an option: the text of its button.
 *
 * Example #1: Then the "Assigned to" select list should show "Devon Webb"
 * Example #2: And the "Assigned to" select list should show "Arlene Mccoy"
 * Example #3: Then the "Assigned to" select list should show "Tom Cook"
 * Example #4: And the "Assigned to" select list should show "Wade Cooper"
 * Example #5: Then the "Assigned to" select list should show "Tanya Fox"
 */
Then(/^the "([^"]*)" select list should show "([^"]*)"$/, async function (label, option) {
  const button = await selectList(this, label);
  const end = Date.now() + h.WAIT.value;
  let shows = '';
  do {
    shows = (await button.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
    if (h.textRe(option).test(shows)) return;
    await h.sleep(40);
  } while (Date.now() < end);
  throw h.failure(this.page, `Expected the "${label}" select list to show "${option}", but it shows "${shows}".`);
});

/**
 * A select list offers an option, or does not: it is opened, its options read, and it is closed again.
 *
 * Example #1: Then the "Assigned to" select list should offer "Devon Webb"
 * Example #2: And the "Assigned to" select list should not offer "Nobody"
 * Example #3: Then the "Assigned to" select list should offer "Tom Cook"
 * Example #4: And the "Assigned to" select list should not offer "Somebody else"
 * Example #5: Then the "Assigned to" select list should offer "Wade Cooper"
 */
Then(/^the "([^"]*)" select list should( not)? offer "([^"]*)"$/, async function (label, not, option) {
  const page = this.page;
  const button = await selectList(this, label);
  const wasOpen = (await button.getAttribute('aria-expanded')) === 'true';
  if (!wasOpen) await button.click();
  const list = await optionsOf(page, button);
  const shown = await h.waitShown(list);
  if (shown !== true) throw h.failure(page, `Expected the options of the "${label}" select list to show, but they are ${h.describe(shown)}.`);
  const all = await optionTexts(list);
  const has = all.some((t) => h.textRe(option, { exact: true }).test(t));
  if (!wasOpen) { await list.focus().catch(() => {}); await page.keyboard.press('Escape'); await h.waitGone(list); }
  if (has === Boolean(not)) {
    throw h.failure(page, `Expected the "${label}" select list ${not ? 'not ' : ''}to offer "${option}", but it offers ${all.map((t) => `"${t}"`).join(', ') || 'nothing'}.`);
  }
});

// A search list's input (Combobox) by its label.
async function searchList(world, label) {
  const page = world.page;
  const found = await h.byLabel(page.locator('[role=combobox]'), label);
  if (!found) throw h.failure(page, `Expected a search list named "${label}", but the page has none.`);
  return found;
}

/**
 * Type in a search list, wait for its options, choose one, and wait until they are gone and the list shows the choice.
 *
 * Example #1: When I type "wa" in the "Assigned to" search list and choose "Wade Cooper"
 * Example #2: And we type "Tom" in the "Assigned to" search list and choose "Tom Cook"
 * Example #3: When I type "jor" in the "Country" search list and choose "Jordan"
 * Example #4: And I type "dev" in the "Assigned to" search list and choose "Devon Webb"
 * Example #5: When we type "can" in the "Country" search list and choose "Canada"
 */
When(/^(?:I |we )?type "([^"]*)" in the "([^"]*)" search list and choose "([^"]*)"$/, async function (typed, label, option) {
  const page = this.page;
  const input = await searchList(this, label);
  await input.click();
  await input.fill('');
  await input.pressSequentially(typed, { delay: 30 });
  const list = await optionsOf(page, input);
  const entry = optionNamed(list, option).first();
  const end = Date.now() + h.WAIT.value;
  while (Date.now() < end && await entry.count() === 0) await h.sleep(40);
  if (await entry.count() === 0) {
    const all = await optionTexts(list);
    throw h.failure(page, `Expected the "${label}" search list to offer "${option}" for "${typed}", but it offers ${all.map((t) => `"${t}"`).join(', ') || 'nothing'}.`);
  }
  await entry.click();
  const gone = await h.waitGone(list);
  if (gone !== true) throw h.failure(page, `Expected the options of the "${label}" search list to be gone after the choice, but they are ${h.describe(gone)}.`);
});

/**
 * Type in a search list, and wait until it has answered: its options shown for what was typed, or none.
 *
 * Example #1: When I type "wa" in the "Assigned to" search list
 * Example #2: And we type "Tom" in the "Assigned to" search list
 * Example #3: When I type "jor" in the "Country" search list
 * Example #4: And I type "zz" in the "Assigned to" search list
 * Example #5: When we type "can" in the "Country" search list
 */
When(/^(?:I |we )?type "([^"]*)" in the "([^"]*)" search list$/, async function (typed, label) {
  const page = this.page;
  const input = await searchList(this, label);
  await input.click();
  await input.fill('');
  await input.pressSequentially(typed, { delay: 30 });
  await h.waitStill(page);
});

/**
 * A search list offers an option for what was typed in it, or does not.
 *
 * Example #1: Then the "Assigned to" search list should offer "Wade Cooper"
 * Example #2: And the "Assigned to" search list should not offer "Tom Cook"
 * Example #3: Then the "Country" search list should offer "Jordan"
 * Example #4: And the "Country" search list should not offer "Atlantis"
 * Example #5: Then the "Assigned to" search list should offer "Devon Webb"
 */
Then(/^the "([^"]*)" search list should( not)? offer "([^"]*)"$/, async function (label, not, option) {
  const page = this.page;
  const input = await searchList(this, label);
  const list = await optionsOf(page, input);
  const end = Date.now() + h.WAIT.value;
  let all = [];
  do {
    all = await optionTexts(list);
    const has = all.some((t) => h.textRe(option, { exact: true }).test(t));
    if (has !== Boolean(not)) return;
    await h.sleep(40);
  } while (Date.now() < end);
  throw h.failure(page, `Expected the "${label}" search list ${not ? 'not ' : ''}to offer "${option}", but it offers ${all.map((t) => `"${t}"`).join(', ') || 'nothing'}.`);
});

/**
 * A search list shows a text in its field.
 *
 * Example #1: Then the "Assigned to" search list should show "Wade Cooper"
 * Example #2: And the "Country" search list should show "Jordan"
 * Example #3: Then the "Assigned to" search list should show "Tom Cook"
 * Example #4: And the "Country" search list should show "Canada"
 * Example #5: Then the "Assigned to" search list should show "Devon Webb"
 */
Then(/^the "([^"]*)" search list should show "([^"]*)"$/, async function (label, text) {
  const input = await searchList(this, label);
  const end = Date.now() + h.WAIT.value;
  let value = '';
  do {
    value = await input.inputValue().catch(() => '');
    if (h.textRe(text, { exact: true }).test(value)) return;
    await h.sleep(40);
  } while (Date.now() < end);
  throw h.failure(this.page, `Expected the "${label}" search list to show "${text}", but it shows "${value}".`);
});

// A switch by its label.
async function switchOf(world, label) {
  const page = world.page;
  const found = await h.byLabel(page.locator('[role=switch]'), label);
  if (!found) throw h.failure(page, `Expected a switch named "${label}", but the page has none.`);
  return found;
}

/**
 * Turn a switch on or off: it is clicked when it is not already so, and the step waits until it says so (aria-checked).
 *
 * Example #1: When I turn on the "Enable notifications" switch
 * Example #2: And I turn off the "Enable notifications" switch
 * Example #3: When we turn on the "Apple" switch
 * Example #4: And we turn off the "Banana" switch
 * Example #5: When I turn on the "Banana" switch
 */
When(/^(?:I |we )?turn (on|off) the "([^"]*)" switch$/, async function (which, label) {
  const sw = await switchOf(this, label);
  const want = which === 'on' ? 'true' : 'false';
  if ((await sw.getAttribute('aria-checked')) !== want) await sw.click();
  const end = Date.now() + h.WAIT.value;
  while (Date.now() < end) {
    if ((await sw.getAttribute('aria-checked')) === want) { await h.waitStill(this.page); return; }
    await h.sleep(40);
  }
  throw h.failure(this.page, `Expected the "${label}" switch to be ${which} after it was turned ${which}, but it is not.`);
});

/**
 * A switch is on or off (aria-checked).
 *
 * Example #1: Then the "Enable notifications" switch should be turned on
 * Example #2: And the "Enable notifications" switch should be turned off
 * Example #3: Then the "Apple" switch should be turned on
 * Example #4: And the "Banana" switch should be turned off
 * Example #5: Then the "Banana" switch should be turned on
 */
Then(/^the "([^"]*)" switch should be turned (on|off)$/, async function (label, which) {
  const sw = await switchOf(this, label);
  const want = which === 'on' ? 'true' : 'false';
  const end = Date.now() + h.WAIT.value;
  let is = '';
  do {
    is = await sw.getAttribute('aria-checked');
    if (is === want) return;
    await h.sleep(40);
  } while (Date.now() < end);
  throw h.failure(this.page, `Expected the "${label}" switch to be ${which}, but it is ${is === 'true' ? 'on' : 'off'}.`);
});

// A radio group by its label (aria-labelledby, aria-label), else by the legend or the heading that names it inside the
// group or in the fieldset around it; and a choice of it by its text (its first line: a choice may show a description).
async function radioOf(world, group, choice) {
  const page = world.page;
  const all = page.locator('[role=radiogroup]');
  let g = await h.byLabel(all, group);
  if (!g) {
    const want = h.textRe(group, { exact: true });
    const n = await all.count();
    for (let i = 0; i < n && !g; i += 1) {
      const names = await all.nth(i).evaluate((el) => {
        const own = [...el.querySelectorAll('legend, h1, h2, h3, h4, h5, h6, [role=heading]')].slice(0, 2);
        const set = el.closest('fieldset');
        const legend = set && set.querySelector(':scope > legend');
        return [...own, legend].filter(Boolean).map((x) => x.textContent.replace(/\s+/g, ' ').trim());
      }).catch(() => []);
      if (names.some((t) => want.test(t))) g = all.nth(i);
    }
  }
  if (!g) throw h.failure(page, `Expected a radio group named "${group}", but the page has none.`);
  const radios = g.getByRole('radio');
  const n = await radios.count();
  for (let i = 0; i < n; i += 1) {
    const r = radios.nth(i);
    const name = await r.evaluate((el) => {
      const ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
      const t = ids.length ? (document.getElementById(ids[0]) || {}).textContent : (el.getAttribute('aria-label') || el.innerText);
      return String(t || '').split('\n').map((s) => s.trim()).filter(Boolean)[0] || '';
    });
    if (h.textRe(choice, { exact: true }).test(name)) return { group: g, radio: r };
  }
  throw h.failure(page, `Expected the "${group}" radio group to have the choice "${choice}", but it has none.`);
}

/**
 * Choose one of a radio group's choices, and wait until it is the chosen one (aria-checked).
 *
 * Example #1: When I choose "Private to Project Members" in the "Privacy setting" radio group
 * Example #2: And we choose "Public access" in the "Privacy setting" radio group
 * Example #3: When I choose "Private to you" in the "Privacy setting" radio group
 * Example #4: And I choose "Large" in the "Size" radio group
 * Example #5: When we choose "Small" in the "Size" radio group
 */
When(/^(?:I |we )?choose "([^"]*)" in the "([^"]*)" radio group$/, async function (choice, group) {
  const { radio } = await radioOf(this, group, choice);
  await radio.click();
  const end = Date.now() + h.WAIT.value;
  while (Date.now() < end) {
    if ((await radio.getAttribute('aria-checked')) === 'true') return;
    await h.sleep(40);
  }
  throw h.failure(this.page, `Expected "${choice}" to be chosen in the "${group}" radio group after it was clicked, but it is not.`);
});

/**
 * A choice of a radio group is the chosen one, or is not (aria-checked).
 *
 * Example #1: Then "Private to Project Members" should be chosen in the "Privacy setting" radio group
 * Example #2: And "Public access" should not be chosen in the "Privacy setting" radio group
 * Example #3: Then "Private to you" should be chosen in the "Privacy setting" radio group
 * Example #4: And "Large" should not be chosen in the "Size" radio group
 * Example #5: Then "Small" should be chosen in the "Size" radio group
 */
Then(/^"([^"]*)" should( not)? be chosen in the "([^"]*)" radio group$/, async function (choice, not, group) {
  const { radio } = await radioOf(this, group, choice);
  const end = Date.now() + h.WAIT.value;
  let is = false;
  do {
    is = (await radio.getAttribute('aria-checked')) === 'true';
    if (is !== Boolean(not)) return;
    await h.sleep(40);
  } while (Date.now() < end);
  throw h.failure(this.page, `Expected "${choice}" ${not ? 'not ' : ''}to be chosen in the "${group}" radio group, but it ${is ? 'is' : 'is not'}.`);
});
