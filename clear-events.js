// Utility script to clear events from localStorage
// Run this in browser console to clear old events and force fresh ones

console.log('Clearing events from localStorage...')
localStorage.removeItem('events')
console.log('Events cleared! Refresh the page to get fresh sample events.')