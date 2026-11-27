// This pack's own page, not Headless UI's: form fields as Headless UI's documentation shows them (Field, Label,
// Description, Input, Select, Textarea and Fieldset with Legend, https://headlessui.com/react/input and the pages beside
// it). The playground has no field marked invalid, and forms are where the steps that read a field's validity are used.
// Sent empty, the form marks its required fields invalid (the `invalid` prop: aria-invalid and data-invalid) and says
// why in a Description of each; filled, it marks none and says it was sent.
import * as React from 'react';
import { Button, Description, Field, Fieldset, Input, Label, Legend, Select, Textarea } from '@headlessui/react';

export default function FormFields() {
  const [sent, setSent] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [name, setName] = React.useState('');
  const [country, setCountry] = React.useState('');
  const [about, setAbout] = React.useState('');
  const nameInvalid = sent && name.trim() === '';
  const countryInvalid = sent && country === '';
  const aboutInvalid = sent && about.trim().length < 10;
  const field = 'mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm data-invalid:border-red-500';

  function send(event: React.FormEvent) {
    event.preventDefault();
    setSent(true);
    setDone(name.trim() !== '' && country !== '' && about.trim().length >= 10);
  }

  return (
    <div className="mx-auto my-12 max-w-lg px-4">
      <form noValidate onSubmit={send}>
        <Fieldset className="space-y-6 rounded-lg bg-white p-6 shadow">
          <Legend className="text-lg font-semibold">Shipping details</Legend>
          <Field>
            <Label className="text-sm font-medium">Full name</Label>
            <Description className="text-sm text-gray-500">Use your real name so the courier can find you.</Description>
            <Input name="full_name" value={name} onChange={(e) => setName(e.target.value)} invalid={nameInvalid} className={field} />
            {nameInvalid && <Description className="text-sm text-red-600">Enter your full name.</Description>}
          </Field>
          <Field>
            <Label className="text-sm font-medium">Country</Label>
            <Select name="country" value={country} onChange={(e) => setCountry(e.target.value)} invalid={countryInvalid} className={field}>
              <option value="">Choose one</option>
              <option value="jo">Jordan</option>
              <option value="ca">Canada</option>
              <option value="mx">Mexico</option>
            </Select>
            {countryInvalid && <Description className="text-sm text-red-600">Choose the country we ship to.</Description>}
          </Field>
          <Field>
            <Label className="text-sm font-medium">Delivery notes</Label>
            <Description className="text-sm text-gray-500">At least 10 characters: a gate code, a floor, a time.</Description>
            <Textarea name="notes" value={about} onChange={(e) => setAbout(e.target.value)} invalid={aboutInvalid} rows={3} className={field} />
          </Field>
          <Field disabled>
            <Label className="text-sm font-medium data-disabled:opacity-50">Coupon</Label>
            <Input name="coupon" className={`${field} data-disabled:opacity-50`} />
          </Field>
          <Button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white data-hover:bg-gray-700">
            Send
          </Button>
          {done && <p role="status" className="text-sm text-green-700">Your details were sent.</p>}
        </Fieldset>
      </form>
    </div>
  );
}
