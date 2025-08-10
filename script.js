// Global variables
let currentWeek = "A"
let selectedSlot = null

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initializeWeekToggle()
  initializeEventForm()
  initializeClassForm()
  loadScheduleData()
})

// Week toggle functionality
function initializeWeekToggle() {
  const weekButtons = document.querySelectorAll(".week-btn")

  weekButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons
      weekButtons.forEach((btn) => btn.classList.remove("active"))

      // Add active class to clicked button
      this.classList.add("active")

      // Update current week
      currentWeek = this.dataset.week

      // Update schedule display
      updateScheduleDisplay()
    })
  })
}

// Update schedule display based on selected week
function updateScheduleDisplay() {
  const weekHeader = document.querySelector(".week-header h2")
  weekHeader.textContent = `Week ${currentWeek} Schedule`

  // Here you would typically load different schedule data
  // For demo purposes, we'll just update the header
  console.log(`Switched to Week ${currentWeek}`)
}

// Event Modal Functions
function openEventModal() {
  const modal = document.getElementById("eventModal")
  modal.classList.add("active")
  document.body.style.overflow = "hidden"
}

function closeEventModal() {
  const modal = document.getElementById("eventModal")
  modal.classList.remove("active")
  document.body.style.overflow = "auto"

  // Reset form
  document.querySelector(".event-form").reset()
}

// Class Modal Functions
function openClassModal() {
  const modal = document.getElementById("classModal")
  modal.classList.add("active")
  document.body.style.overflow = "hidden"
}

function closeClassModal() {
  const modal = document.getElementById("classModal")
  modal.classList.remove("active")
  document.body.style.overflow = "auto"

  // Reset form
  document.querySelector(".class-form").reset()
}

// Add class to schedule slot
function addClass(slot) {
  selectedSlot = slot
  openClassModal()
}

// Initialize event form
function initializeEventForm() {
  const eventForm = document.querySelector(".event-form")

  eventForm.addEventListener("submit", (e) => {
    e.preventDefault()

    const formData = new FormData(eventForm)
    const eventData = {
      title: formData.get("eventTitle"),
      date: formData.get("eventDate"),
      time: formData.get("eventTime"),
      location: formData.get("eventLocation"),
      description: formData.get("eventDescription"),
    }

    // Add event to the events list
    addEventToList(eventData)

    // Close modal and reset form
    closeEventModal()

    // Show success message
    showNotification("Event created successfully!", "success")
  })
}

// Initialize class form
function initializeClassForm() {
  const classForm = document.querySelector(".class-form")

  classForm.addEventListener("submit", (e) => {
    e.preventDefault()

    const formData = new FormData(classForm)
    const classData = {
      name: formData.get("className"),
      room: formData.get("classRoom"),
      professor: formData.get("professor"),
    }

    // Add class to selected slot
    if (selectedSlot) {
      addClassToSlot(selectedSlot, classData)
    }

    // Close modal and reset form
    closeClassModal()

    // Show success message
    showNotification("Class added successfully!", "success")
  })
}

// Add event to events list
function addEventToList(eventData) {
  const eventsList = document.querySelector(".events-list")
  const eventDate = new Date(eventData.date)

  const eventCard = document.createElement("div")
  eventCard.className = "event-card"
  eventCard.innerHTML = `
        <div class="event-date">
            <span class="day">${eventDate.getDate()}</span>
            <span class="month">${eventDate.toLocaleDateString("en-US", { month: "short" })}</span>
        </div>
        <div class="event-info">
            <h4>${eventData.title}</h4>
            <p class="event-time">${eventData.time}</p>
            <p class="event-location">${eventData.location}</p>
        </div>
    `

  // Insert at the beginning of the list
  eventsList.insertBefore(eventCard, eventsList.firstChild)
}

// Add class to schedule slot
function addClassToSlot(slot, classData) {
  slot.classList.remove("empty")
  slot.innerHTML = `
        <div class="class-info">
            <div class="class-name">${classData.name}</div>
            <div class="class-room">${classData.room}</div>
        </div>
    `
}

// Show notification
function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div")
  notification.className = `notification ${type}`
  notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `

  // Add styles
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === "success" ? "#4CAF50" : "#ff6b35"};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 1001;
        animation: slideInRight 0.3s ease;
    `

  document.body.appendChild(notification)

  // Auto remove after 3 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove()
    }
  }, 3000)
}

// Load schedule data (placeholder for actual data loading)
function loadScheduleData() {
  // This would typically load data from a server
  console.log("Loading schedule data...")
}

// Close modals when clicking outside
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    if (e.target.id === "eventModal") {
      closeEventModal()
    } else if (e.target.id === "classModal") {
      closeClassModal()
    }
  }
})

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeEventModal()
    closeClassModal()
  }
})

// Search functionality
const searchInput = document.querySelector(".search-input")
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase()
    // Implement search logic here
    console.log("Searching for:", searchTerm)
  })
}

// Add CSS animation for notifications
const style = document.createElement("style")
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
    }
    
    .notification-content button {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
`
document.head.appendChild(style)
