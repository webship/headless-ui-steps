Feature: Dialogs
  A dialog named by its title, opened with its button, answered, and closed with Escape or a click outside. While it is
  open, the rest of the page is hidden and inert: the steps look inside it.

  Scenario: A dialog opened with its button, read, answered with one of its own
    Given I go to "/dialog/dialog"
    When I open the "Deactivate account" dialog with the "Toggle!" button
    Then the "Deactivate account" dialog should be shown
    And the "Deactivate account" dialog should show "Are you sure you want to deactivate your account?"
    When I press "Cancel" in the "Deactivate account" dialog
    Then the "Deactivate account" dialog should not be shown
    And no dialog should be shown

  Scenario: A dialog closed with Escape, then with a click outside it
    Given I go to "/dialog/dialog"
    When I open the "Deactivate account" dialog with the "Toggle!" button
    And I press Escape in the "Deactivate account" dialog
    Then no dialog should be shown
    When I open the "Deactivate account" dialog with the "Toggle!" button
    And I click outside the "Deactivate account" dialog
    Then no dialog should be shown

  # Its panel and backdrop fade in and out while the dialog itself stays at full opacity: shown means no transition
  # running inside it. It has no title: it is named by its heading.
  Scenario: A dialog with transitions of its own, and no title
    Given I go to "/dialog/dialog-built-in-transition"
    When I open the "Dialog" dialog with the "Toggle!" button
    Then the "Dialog" dialog should be shown
    When I close the "Dialog" dialog
    Then no dialog should be shown

  # webship-js's own press does not wait for a transition: the next step reads the dialog once they are done.
  Scenario: A dialog opened by a press of webship-js's own
    Given I go to "/dialog/dialog"
    When I press "Toggle!"
    And I wait for the transitions to finish
    Then the "Deactivate account" dialog should be shown
    When I press "Deactivate" in the "Deactivate account" dialog
    Then no dialog should be shown
