# Each scenario fails at its last step by design. They change nothing outside the browser of the scenario.
@must-fail
Feature: The components of the demo, asserted wrong
  Each scenario asserts something about a component of the demo that is not true, at its last step.

  Scenario: A dialog that is not open
    Fails with: Expected the "Deactivate account" dialog to be shown, but it is not in the page
    Given I go to "/dialog/dialog"
    Then the "Deactivate account" dialog should be shown

  Scenario: A dialog that stays open
    Fails with: Expected the "Deactivate account" dialog to be closed, but it is shown
    Given I go to "/dialog/dialog"
    When I open the "Deactivate account" dialog with the "Toggle!" button
    Then the "Deactivate account" dialog should not be shown

  Scenario: A text the dialog does not show
    Fails with: Expected the "Deactivate account" dialog to show "Delete everything now", but it does not.
    Given I go to "/dialog/dialog"
    When I open the "Deactivate account" dialog with the "Toggle!" button
    Then the "Deactivate account" dialog should show "Delete everything now"

  Scenario: A button the dialog does not have
    Fails with: Expected the "Deactivate account" dialog to have a button or a link named "Maybe later", but it has none.
    Given I go to "/dialog/dialog"
    When I open the "Deactivate account" dialog with the "Toggle!" button
    And I press "Maybe later" in the "Deactivate account" dialog

  Scenario: An item the drop-down menu does not have
    Fails with: Expected the "Options" drop-down menu to have an item "Preferences", but it has none.
    Given I go to "/menu/menu-with-transition"
    When I choose "Preferences" from the "Options" drop-down menu

  Scenario: An item of the drop-down menu that is not disabled
    Fails with: Expected "Support" to be disabled in the "Options" drop-down menu, but it is not.
    Given I go to "/menu/menu-with-transition"
    When I open the "Options" drop-down menu
    Then "Support" should be disabled in the "Options" drop-down menu

  Scenario: A popover that is not open
    Fails with: Expected the "Normal" popover to be shown, but it is not in the page
    Given I go to "/popover/popover"
    Then the "Normal" popover should be shown

  Scenario: An option the select list does not offer
    Fails with: Expected the "Assigned to" select list to offer "Nobody at all", but it offers
    Given I go to "/listbox/listbox-with-pure-tailwind"
    When I choose "Nobody at all" in the "Assigned to" select list

  # The example starts on a person picked at random: the scenario chooses one first, so the last step always fails.
  Scenario: An option the select list does not show
    Fails with: Expected the "Assigned to" select list to show "Tom Cook", but it shows "Wade Cooper".
    Given I go to "/listbox/listbox-with-pure-tailwind"
    When I choose "Wade Cooper" in the "Assigned to" select list
    Then the "Assigned to" select list should show "Tom Cook"

  Scenario: An option the search list does not offer for what is typed
    Fails with: Expected the "Assigned to" search list to offer "Wade Cooper" for "zz", but it offers nothing.
    Given I go to "/combobox/combobox-with-pure-tailwind"
    When I type "zz" in the "Assigned to" search list and choose "Wade Cooper"

  Scenario: A panel that is collapsed
    Fails with: Expected the "Trigger" panel to be expanded, but it is collapsed.
    Given I go to "/disclosure/disclosure"
    Then the "Trigger" panel should be expanded

  Scenario: A tab that is not the selected one
    Fails with: Expected the "Billing" tab to be active, but it is not.
    Given I go to "/tabs/tabs-with-pure-tailwind"
    Then the "Billing" tab should be active

  Scenario: A disabled tab switched to
    Fails with: Expected to switch to the "Company" tab, but it is disabled.
    Given I go to "/tabs/tabs-with-pure-tailwind"
    When I switch to the "Company" tab

  Scenario: A switch that is off
    Fails with: Expected the "Enable notifications" switch to be on, but it is off.
    Given I go to "/switch/switch-with-pure-tailwind"
    Then the "Enable notifications" switch should be turned on

  Scenario: A choice of the radio group that is not chosen
    Fails with: Expected "Public access" to be chosen in the "Privacy setting" radio group, but it is not.
    Given I go to "/radio-group/radio-group"
    Then "Public access" should be chosen in the "Privacy setting" radio group

  Scenario: Fields the form has not marked
    Fails with: Expected 2 field(s) to be shown as invalid, but 0 are.
    Given I go to "/ours/form-fields"
    Then 2 fields should be shown as invalid

  Scenario: A message the field does not show
    Fails with: Expected the "Country" field to show the message "Pick one, please.", but it shows "Choose the country we ship to."
    Given I go to "/ours/form-fields"
    When I press "Send"
    Then the "Country" field should show the message "Pick one, please."

  Scenario: A field shown as valid that is not
    Fails with: Expected the "Full name" field to be shown as valid, but it is invalid.
    Given I go to "/ours/form-fields"
    When I press "Send"
    Then the "Full name" field should be shown as valid
