// Debug script to check events in localStorage
// Run this in browser console to debug events

console.log('=== EVENT DEBUGGING ===')

// Check localStorage
const events = localStorage.getItem('events')
console.log('Raw events from localStorage:', events)

if (events) {
  try {
    const parsedEvents = JSON.parse(events)
    console.log('Parsed events:', parsedEvents)
    console.log('Number of events:', parsedEvents.length)
    
    // Check each event
    parsedEvents.forEach((event, index) => {
      console.log(`Event ${index + 1}:`, event)
      console.log(`- Title: ${event.title}`)
      console.log(`- Date: ${event.date}`)
      console.log(`- Status: ${event.status}`)
      console.log(`- Created by: ${event.createdBy}`)
      console.log(`- Invitees: ${event.invitees}`)
      
      // Check if event is upcoming
      const eventDate = new Date(event.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const isUpcoming = eventDate >= today && event.status !== 'cancelled'
      console.log(`- Is upcoming: ${isUpcoming} (Event date: ${eventDate}, Today: ${today})`)
    })
  } catch (error) {
    console.error('Error parsing events:', error)
  }
} else {
  console.log('No events found in localStorage')
}

// Check current user
const currentUser = localStorage.getItem('currentUser')
console.log('Current user from localStorage:', currentUser)

if (currentUser) {
  try {
    const parsedUser = JSON.parse(currentUser)
    console.log('User ID:', parsedUser.id)
    console.log('User name:', parsedUser.name)
  } catch (error) {
    console.error('Error parsing current user:', error)
  }
}

console.log('=== END DEBUGGING ===')