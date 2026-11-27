Feature: Drop-down menus and popovers
  A menu named by the button that opens it, its items read, the keyboard on one, one chosen; a popover, which has no name
  of its own, named by its button. Each opens and closes with its transitions, and the steps wait for them.

  Scenario: A drop-down menu that fades in: opened, read, closed with Escape
    Given I go to "/menu/menu-with-transition"
    When I open the "Options" drop-down menu
    Then the "Options" drop-down menu should show "Account settings"
    And "New feature (soon)" should be disabled in the "Options" drop-down menu
    And "Support" should not be disabled in the "Options" drop-down menu
    When I press Escape in the "Options" drop-down menu
    Then no drop-down menu should be shown

  Scenario: The keyboard on an item, then an item chosen
    Given I go to "/menu/menu-with-transition"
    When I open the "Options" drop-down menu
    And I press the key "ArrowDown"
    Then "Account settings" should be active in the "Options" drop-down menu
    And "Support" should not be active in the "Options" drop-down menu
    When I choose "License" from the "Options" drop-down menu
    Then no drop-down menu should be shown

  # The playground's plain menu answers each item with window.alert: webship-js's own step accepts it first.
  Scenario: An item that answers with an alert, accepted
    Given I go to "/menu/menu"
    And I will accept the next dialog
    When I choose "Support" from the "Options" drop-down menu
    Then the "Options" drop-down menu should not be shown

  Scenario: A drop-down menu closed with a click outside it
    Given I go to "/menu/menu-with-transition"
    When I open the "Options" drop-down menu
    And I click outside the "Options" drop-down menu
    Then no drop-down menu should be shown

  Scenario: A popover named by its button: opened, read, closed
    Given I go to "/popover/popover"
    When I open the "Normal" popover
    Then the "Normal" popover should be shown
    And the "Normal" popover should show "Normal - First"
    When I press Escape in the "Normal" popover
    Then the "Normal" popover should not be shown
    When I open the "Portal" popover
    And I click outside the "Portal" popover
    Then no popover should be shown
