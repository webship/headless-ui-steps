Feature: Select lists and search lists
  A select list named by its label (its button's name is the label and the option it shows), its options shown while it
  is open and gone after a choice; a search list typed in and chosen from.

  Scenario: A select list: an option chosen, then the next one at once
    Given I go to "/listbox/listbox-with-pure-tailwind"
    Then the "Assigned to" select list should offer "Devon Webb"
    And the "Assigned to" select list should not offer "Nobody at all"
    When I choose "Devon Webb" in the "Assigned to" select list
    Then the "Assigned to" select list should show "Devon Webb"
    When I choose "Tom Cook" in the "Assigned to" select list
    Then the "Assigned to" select list should show "Tom Cook"

  Scenario: A search list: typed in, its options, a choice
    Given I go to "/combobox/combobox-with-pure-tailwind"
    When I type "wa" in the "Assigned to" search list and choose "Wade Cooper"
    Then the "Assigned to" search list should show "Wade Cooper"

  Scenario: What a search list offers for what is typed
    Given I go to "/combobox/combobox-with-pure-tailwind"
    When I type "wa" in the "Assigned to" search list
    Then the "Assigned to" search list should offer "Wade Cooper"
    And the "Assigned to" search list should not offer "Tom Cook"

  Scenario: The lists of a form, labelled with a colon
    Given I go to "/combinations/form"
    When I choose "Charlie" in the "Assigned to" select list
    Then the "Assigned to" select list should show "Charlie"
