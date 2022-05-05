const { nanoid } = require('nanoid');

module.exports = [
  {
    "@odata.type": "#microsoft.graph.user",
    "id": nanoid(),
    "displayName": "School #1 Teacher #1",
    "jobTitle": "Tester",
    "companyName": "School #1",
    "userPrincipalName": "s1t1@vtfk.no",
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
    "displayName": "School #1 Teacher #2",
    "jobTitle": "Tester",
    "companyName": "School #1",
    "userPrincipalName": "s1t2@vtfk.no",
    owned: [
    '5735b78c-2f25-40a8-89e2-29c587b1032c'
    ]
  },
  {
    "@odata.type": "#microsoft.graph.user",
    "id": nanoid(),
    "displayName": "School #2 Teacher #1",
    "jobTitle": "Tester",
    "companyName": "School #2",
    "userPrincipalName": "s2t1@vtfk.no",
    owned: [
      '4d6d602e-2ab3-44e6-a75f-7fd24707c845'
    ]
  },
  {
    "@odata.type": "#microsoft.graph.user",
    "id": nanoid(),
    "displayName": "School #2 Teacher #2",
    "jobTitle": "Tester",
    "companyName": "School #2",
    "userPrincipalName": "s2t2@vtfk.no",
    owned: [
      '8df65c9e-a0a4-4599-872c-2d3ba654556b'
    ]
  },
  {
    "@odata.type": "#microsoft.graph.user",
    "id": nanoid(),
    "displayName": "School #3 Teacher #1",
    "jobTitle": "Tester",
    "companyName": "School #3",
    "userPrincipalName": "s3t1@vtfk.no",
    owned: [
      'a1eaa827-c6f9-458f-94f4-40ff64f7dca1'
    ]
  },
  {
    "@odata.type": "#microsoft.graph.user",
    "id": nanoid(),
    "displayName": "School #3 Teacher #2",
    "jobTitle": "Tester",
    "companyName": "School #3",
    "userPrincipalName": "s3t2@vtfk.no",
    owned: [
      'a1eaa827-c6f9-458f-94f4-40ff64f7dca1'
    ]
  }
]