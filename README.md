# headless-ui-steps

Cucumber step definitions for sites and apps built with Headless UI, Tailwind Labs' unstyled, accessible components for
React and Vue, for [webship-js](https://webship.co/docs/webship-js/2.0.x), a BDD browser automation harness built on
Playwright and Cucumber-js.

Headless UI gives its menus, select lists, search lists, dialogs, popovers, panels, tabs, switches and radio groups their
behaviour and their ARIA, and leaves their looks to Tailwind CSS or any other styles. The steps work on them as a person
sees them, by their roles and their names, and wait on what the components themselves say (their state, the end of their
transitions), never for a fixed time. No step phrase names the library.

The steps, their features, the demo app and CI come with the first release, `2.0.0`.
