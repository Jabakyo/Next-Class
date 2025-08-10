// Temporary script to add events to localStorage for testing
const events = [
  {
    "id": 1,
    "title": "Study Group for Psychology Research Methods",
    "date": "2025-07-25",
    "time": "15:00",
    "location": "Library Study Room 204",
    "description": "Let's review the material for our upcoming exam and work on the research project together. Bring your notes and laptops!",
    "createdBy": "demo_user_1",
    "createdAt": "2025-07-23T15:00:00.000Z",
    "invitees": ["1753262526297", "demo_user_2"],
    "attendees": [
      {
        "userId": "1753262526297",
        "status": "pending",
        "respondedAt": null
      },
      {
        "userId": "demo_user_2",
        "status": "pending", 
        "respondedAt": null
      }
    ],
    "status": "active"
  },
  {
    "id": 2,
    "title": "International Coffee Chat",
    "date": "2025-07-26",
    "time": "14:30",
    "location": "Campus Coffee Shop",
    "description": "Join us for a casual conversation about different cultures and languages. Perfect opportunity to practice speaking and meet new people from around the world!",
    "createdBy": "demo_user_3",
    "createdAt": "2025-07-23T16:00:00.000Z",
    "invitees": ["1753262526297", "demo_user_1", "demo_user_2"],
    "attendees": [
      {
        "userId": "1753262526297",
        "status": "pending",
        "respondedAt": null
      },
      {
        "userId": "demo_user_1",
        "status": "accepted",
        "respondedAt": "2025-07-23T16:15:00.000Z"
      },
      {
        "userId": "demo_user_2",
        "status": "declined",
        "respondedAt": "2025-07-23T16:30:00.000Z"
      }
    ],
    "status": "active"
  },
  {
    "id": 3,
    "title": "Coding Workshop: Introduction to AI",
    "date": "2025-07-28",
    "time": "18:00",
    "location": "Computer Lab - Tome Hall 115",
    "description": "Hands-on workshop covering basic AI concepts and machine learning. We'll work on a simple project together. All skill levels welcome! Please bring your laptop.",
    "createdBy": "demo_user_2",
    "createdAt": "2025-07-23T17:00:00.000Z",
    "invitees": ["1753262526297"],
    "attendees": [
      {
        "userId": "1753262526297",
        "status": "pending",
        "respondedAt": null
      }
    ],
    "status": "active"
  }
];

// Add to localStorage
localStorage.setItem('events', JSON.stringify(events));
console.log('Events added to localStorage:', events.length, 'events');

// Verify
const stored = JSON.parse(localStorage.getItem('events') || '[]');
console.log('Verified stored events:', stored.length);