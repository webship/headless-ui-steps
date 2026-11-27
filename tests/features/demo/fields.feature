Feature: Fields and their messages
  The demo's own page of form fields (Headless UI's Field, Label, Description, Input, Select and Textarea): sent empty,
  the required ones are marked invalid and say why; filled, none is.

  Scenario: A form sent empty marks its fields, then filled marks none
    Given I go to "/ours/form-fields"
    Then no fields should be shown as invalid
    When I press "Send"
    Then 3 fields should be shown as invalid
    And the "Full name" field should be shown as invalid
    And the "Full name" field should show the message "Enter your full name."
    And the "Full name" field should show the message "Use your real name so the courier can find you."
    And the "Country" field should show the message "Choose the country we ship to."
    And the "Delivery notes" field should be shown as invalid
    When I fill in "Full name" with "Ada Lovelace"
    And I select "Jordan" from "Country"
    And I fill in "Delivery notes" with "Ring twice, third floor."
    And I press "Send"
    Then no fields should be shown as invalid
    And the "Full name" field should be shown as valid
    And I should see "Your details were sent."
