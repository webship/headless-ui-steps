Feature: Panels, tabs, switches and radio groups
  A panel named by its button and there only while expanded; tabs and the content each shows; a disabled tab; switches
  turned on and off; the choices of a radio group.

  Scenario: A panel expanded and collapsed
    Given I go to "/disclosure/disclosure"
    Then the "Trigger" panel should be collapsed
    When I expand the "Trigger" panel
    Then the "Trigger" panel should be expanded
    And the "Trigger" panel should show "Content"
    When I collapse the "Trigger" panel
    Then the "Trigger" panel should be collapsed

  Scenario: Tabs, their content, and a disabled one
    Given I go to "/tabs/tabs-with-pure-tailwind"
    Then the "Team Members" tab should be active
    And the "Company" tab should be disabled
    And the "Billing" tab should not be disabled
    When I switch to the "Billing" tab
    Then the "Billing" tab should be active
    And the "Team Members" tab should not be active
    And the "Billing" tab should show "Tab content for billing"

  Scenario: A switch turned on and off
    Given I go to "/switch/switch-with-pure-tailwind"
    Then the "Enable notifications" switch should be turned off
    When I turn on the "Enable notifications" switch
    Then the "Enable notifications" switch should be turned on
    When I turn off the "Enable notifications" switch
    Then the "Enable notifications" switch should be turned off

  Scenario: The switches of a form
    Given I go to "/combinations/form"
    Then the "Enable notifications" switch should be turned on
    When I turn on the "Banana" switch
    Then the "Banana" switch should be turned on
    And the "Apple" switch should be turned off

  # The playground's radio group starts with no choice (useState() with no value) and logs React's warning about an input
  # going from uncontrolled to controlled when one is made: its own console error, warned about here, not failed on.
  @js-warn
  Scenario: A radio group: a choice made
    Given I go to "/radio-group/radio-group"
    When I choose "Private to Project Members" in the "Privacy setting" radio group
    Then "Private to Project Members" should be chosen in the "Privacy setting" radio group
    And "Public access" should not be chosen in the "Privacy setting" radio group
