# Each scenario fails at its last step by design. They change nothing outside the browser of the scenario.
@must-fail
Feature: The components of the Vue playground, asserted wrong
  Each scenario asserts something about a component of the Vue playground that is not true, at its last step.

  Scenario: A dialog that is not open
    Fails with: Expected the "Deactivate account" dialog to be shown, but it is not in the page
    Given I go to "/dialog/dialog"
    Then the "Deactivate account" dialog should be shown

  Scenario: An item the drop-down menu does not have
    Fails with: Expected the "Options" drop-down menu to have an item "Preferences", but it has none.
    Given I go to "/menu/menu-with-transition"
    When I choose "Preferences" from the "Options" drop-down menu

  # The example starts on a person picked at random: the scenario chooses one first, so the last step always fails.
  Scenario: An option the select list does not show
    Fails with: Expected the "Assigned to" select list to show "Tom Cook", but it shows "Wade Cooper".
    Given I go to "/listbox/listbox"
    When I choose "Wade Cooper" in the "Assigned to" select list
    Then the "Assigned to" select list should show "Tom Cook"

  Scenario: A switch that is off
    Fails with: Expected the "Enable notifications" switch to be on, but it is off.
    Given I go to "/switch/switch"
    Then the "Enable notifications" switch should be turned on

  Scenario: A tab that is not the selected one
    Fails with: Expected the "Billing" tab to be active, but it is not.
    Given I go to "/tabs/tabs"
    Then the "Billing" tab should be active
