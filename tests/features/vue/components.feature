Feature: The Vue playground's components
  The same steps on Headless UI's Vue line, whose state is in data-headlessui-state only and whose transitions run
  through classes: a menu, a dialog, a select list, a search list, a panel, tabs, a switch, a radio group and a popover.

  Scenario: A drop-down menu that fades in: opened, read, closed with Escape
    Given I go to "/menu/menu-with-transition"
    When I open the "Options" drop-down menu
    Then the "Options" drop-down menu should show "Account settings"
    And "New feature (soon)" should be disabled in the "Options" drop-down menu
    When I press Escape in the "Options" drop-down menu
    Then no drop-down menu should be shown

  Scenario: A dialog opened with its button, answered with one of its own
    Given I go to "/dialog/dialog"
    When I open the "Deactivate account" dialog with the "Toggle!" button
    Then the "Deactivate account" dialog should be shown
    When I press "Cancel" in the "Deactivate account" dialog
    Then no dialog should be shown

  # The example starts on a person picked at random (Math.random() in its setup): the scenario reads only what it chose.
  Scenario: A select list: an option chosen, then another
    Given I go to "/listbox/listbox"
    When I choose "Wade Cooper" in the "Assigned to" select list
    Then the "Assigned to" select list should show "Wade Cooper"
    When I choose "Devon Webb" in the "Assigned to" select list
    Then the "Assigned to" select list should show "Devon Webb"

  Scenario: A search list: typed in, a choice
    Given I go to "/combobox/combobox-with-pure-tailwind"
    When I type "to" in the "Assigned to" search list and choose "Tom Cook"
    Then the "Assigned to" search list should show "Tom Cook"

  Scenario: A panel, the tabs, a switch
    Given I go to "/disclosure/disclosure"
    When I expand the "Trigger" panel
    Then the "Trigger" panel should show "Content"
    Given I go to "/tabs/tabs"
    When I switch to the "Billing" tab
    Then the "Billing" tab should be active
    And the "Company" tab should be disabled
    Given I go to "/switch/switch"
    When I turn on the "Enable notifications" switch
    Then the "Enable notifications" switch should be turned on

  Scenario: A radio group and a popover
    Given I go to "/radio-group/radio-group"
    When I choose "Private to you" in the "Privacy setting" radio group
    Then "Private to you" should be chosen in the "Privacy setting" radio group
    Given I go to "/popover/popover"
    When I open the "Normal" popover
    Then the "Normal" popover should be shown
    When I press Escape in the "Normal" popover
    Then no popover should be shown
