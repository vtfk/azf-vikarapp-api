const { nanoid } = require('nanoid');

module.exports = [
  {
    "@odata.type": "#microsoft.graph.user",
    "id": nanoid(),
    "displayName": "Test Testesen I",
    "jobTitle": "Tester",
    "officeLocation": "School #1",
    "userPrincipalName": "tt1@vtfk.no",
    owned: [
      '5bf3266e-9ba0-4524-8887-ea6547377b54',
      'dda5ad39-645c-4b9b-bb8d-b762b6e1e72e',
      '27a90494-e7cc-49d9-bd12-e7f14a7d2bc1',
      '44a701ca-3536-44b1-8072-91f42b9eddef'
    ]
  },
  {
    "@odata.type": "#microsoft.graph.user",
    "id": nanoid(),
    "displayName": "Test Testesen II",
    "jobTitle": "Tester",
    "officeLocation": "School #2",
    "userPrincipalName": "tt2@vtfk.no",
    owned: [
    '5735b78c-2f25-40a8-89e2-29c587b1032c'
    ]
  },
  {
    "@odata.type": "#microsoft.graph.user",
    "id": nanoid(),
    "displayName": "Test Testesen III",
    "jobTitle": "Tester",
    "officeLocation": "School #2",
    "userPrincipalName": "tt3@vtfk.no",
    owned: [
      '4d6d602e-2ab3-44e6-a75f-7fd24707c845'
    ]
  },
  {
    "@odata.type": "#microsoft.graph.user",
    "id": nanoid(),
    "displayName": "Test Testesen IIII",
    "jobTitle": "Tester",
    "officeLocation": "School #3",
    "userPrincipalName": "tt4@vtfk.no",
    owned: [
      '8df65c9e-a0a4-4599-872c-2d3ba654556b'
    ]
  },
  {
    "@odata.type": "#microsoft.graph.user",
    "id": nanoid(),
    "displayName": "Test Testesen V",
    "jobTitle": "Tester",
    "officeLocation": "School #3",
    "userPrincipalName": "tt5@vtfk.no",
    owned: [
      'a1eaa827-c6f9-458f-94f4-40ff64f7dca1'
    ]
  }
]