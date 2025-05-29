<template>
    <div class="calendar-page">
      <!-- Header -->
      <div class="view-header">
        <div class="header-content">
          <h1 class="view-title">{{ title || 'Calendar' }}</h1>
          <p class="view-subtitle">{{ currentMonthYear }}</p>
        </div>
        
        <div class="header-controls">
          <div class="view-switcher">
            <button 
              class="view-btn"
              :class="{ active: viewMode === 'month' }"
              @click="viewMode = 'month'"
            >
              Month
            </button>
            <button 
              class="view-btn"
              :class="{ active: viewMode === 'week' }"
              @click="viewMode = 'week'"
            >
              Week
            </button>
            <button 
              class="view-btn"
              :class="{ active: viewMode === 'day' }"
              @click="viewMode = 'day'"
            >
              Day
            </button>
          </div>
  
          <div class="nav-controls">
            <button class="nav-btn" @click="navigatePrevious">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <button class="nav-btn today-btn" @click="navigateToday">
              Today
            </button>
            <button class="nav-btn" @click="navigateNext">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </div>
  
          <button class="action-btn primary" @click="$emit('action', { type: 'create-event' })">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Add Event
          </button>
        </div>
      </div>
  
      <!-- Calendar Grid -->
      <div class="calendar-container">
        <!-- Month View -->
        <div v-if="viewMode === 'month'" class="month-view">
          <div class="weekdays">
            <div v-for="day in weekdays" :key="day" class="weekday">
              {{ day }}
            </div>
          </div>
          
          <div class="days-grid">
            <div 
              v-for="(day, index) in calendarDays" 
              :key="index"
              class="day-cell"
              :class="{
                'other-month': !day.isCurrentMonth,
                'today': day.isToday,
                'selected': day.isSelected
              }"
              @click="selectDate(day.date)"
            >
              <div class="day-number">{{ day.date.getDate() }}</div>
              
              <div class="day-events">
                <div 
                  v-for="event in getEventsForDay(day.date).slice(0, 3)" 
                  :key="event.id"
                  class="event-chip"
                  :style="{ background: event.color || 'rgba(255, 255, 255, 0.1)' }"
                  @click.stop="$emit('action', { type: 'view-event', event })"
                >
                  <span class="event-time">{{ formatEventTime(event) }}</span>
                  <span class="event-title">{{ event.title }}</span>
                </div>
                
                <div 
                  v-if="getEventsForDay(day.date).length > 3" 
                  class="more-events"
                >
                  +{{ getEventsForDay(day.date).length - 3 }} more
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Week View -->
        <div v-else-if="viewMode === 'week'" class="week-view">
          <div class="time-column">
            <div class="time-header"></div>
            <div v-for="hour in 24" :key="hour" class="time-slot">
              {{ formatHour(hour - 1) }}
            </div>
          </div>
  
          <div class="week-days">
            <div v-for="day in weekDays" :key="day.date" class="week-day">
              <div class="day-header">
                <div class="day-name">{{ formatDayName(day.date) }}</div>
                <div class="day-date" :class="{ today: isToday(day.date) }">
                  {{ day.date.getDate() }}
                </div>
              </div>
              
              <div class="day-timeline">
                <div v-for="hour in 24" :key="hour" class="hour-slot"></div>
                
                <div 
                  v-for="event in getEventsForDay(day.date)" 
                  :key="event.id"
                  class="timeline-event"
                  :style="getEventStyle(event)"
                  @click="$emit('action', { type: 'view-event', event })"
                >
                  <div class="event-content">
                    <div class="event-title">{{ event.title }}</div>
                    <div class="event-time">{{ formatEventTime(event) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Day View -->
        <div v-else class="day-view">
          <!-- Similar structure to week view but for single day -->
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed } from 'vue'
  
  export default {
    name: 'CalendarPageTemplate',
    props: {
      title: String,
      events: {
        type: Array,
        default: () => []
      },
      config: {
        type: Object,
        default: () => ({})
      }
    },
    emits: ['action', 'navigate'],
    setup(props, { emit }) {
      const viewMode = ref('month')
      const currentDate = ref(new Date())
      const selectedDate = ref(null)
  
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
      const currentMonthYear = computed(() => {
        const options = { month: 'long', year: 'numeric' }
        return currentDate.value.toLocaleDateString('en-US', options)
      })
  
      const calendarDays = computed(() => {
        const year = currentDate.value.getFullYear()
        const month = currentDate.value.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const startDate = new Date(firstDay)
        startDate.setDate(startDate.getDate() - firstDay.getDay())
        
        const days = []
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        for (let i = 0; i < 42; i++) {
          const date = new Date(startDate)
          date.setDate(startDate.getDate() + i)
          
          days.push({
            date,
            isCurrentMonth: date.getMonth() === month,
            isToday: date.getTime() === today.getTime(),
            isSelected: selectedDate.value && date.getTime() === selectedDate.value.getTime()
          })
        }
        
        return days
      })
  
      const weekDays = computed(() => {
        const startOfWeek = new Date(currentDate.value)
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
        
        const days = []
        for (let i = 0; i < 7; i++) {
          const date = new Date(startOfWeek)
          date.setDate(startOfWeek.getDate() + i)
          days.push({ date })
        }
        
        return days
      })
  
      const getEventsForDay = (date) => {
        const dayStart = new Date(date)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(date)
        dayEnd.setHours(23, 59, 59, 999)
        
        return props.events.filter(event => {
          const eventDate = new Date(event.date)
          return eventDate >= dayStart && eventDate <= dayEnd
        })
      }
  
      const formatEventTime = (event) => {
        const date = new Date(event.date)
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      }
  
      const formatHour = (hour) => {
        if (hour === 0) return '12 AM'
        if (hour === 12) return '12 PM'
        return hour > 12 ? `${hour - 12} PM` : `${hour} AM`
      }
  
      const formatDayName = (date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short' })
      }
  
      const isToday = (date) => {
        const today = new Date()
        return date.toDateString() === today.toDateString()
      }
  
      const getEventStyle = (event) => {
        const eventDate = new Date(event.date)
        const startHour = eventDate.getHours() + eventDate.getMinutes() / 60
        const duration = event.duration || 1 // hours
        
        return {
          top: `${startHour * 60}px`,
          height: `${duration * 60}px`,
          background: event.color || 'rgba(255, 255, 255, 0.1)'
        }
      }
  
      const navigatePrevious = () => {
        const newDate = new Date(currentDate.value)
        if (viewMode.value === 'month') {
          newDate.setMonth(newDate.getMonth() - 1)
        } else if (viewMode.value === 'week') {
          newDate.setDate(newDate.getDate() - 7)
        } else {
          newDate.setDate(newDate.getDate() - 1)
        }
        currentDate.value = newDate
      }
  
      const navigateNext = () => {
        const newDate = new Date(currentDate.value)
        if (viewMode.value === 'month') {
          newDate.setMonth(newDate.getMonth() + 1)
        } else if (viewMode.value === 'week') {
          newDate.setDate(newDate.getDate() + 7)
        } else {
          newDate.setDate(newDate.getDate() + 1)
        }
        currentDate.value = newDate
      }
  
      const navigateToday = () => {
        currentDate.value = new Date()
      }
  
      const selectDate = (date) => {
        selectedDate.value = date
        emit('action', { type: 'select-date', date })
      }
  
      return {
        viewMode,
        currentDate,
        selectedDate,
        weekdays,
        currentMonthYear,
        calendarDays,
        weekDays,
        getEventsForDay,
        formatEventTime,
        formatHour,
        formatDayName,
        isToday,
        getEventStyle,
        navigatePrevious,
        navigateNext,
        navigateToday,
        selectDate
      }
    }
  }
  </script>
  
  <style scoped>
  .calendar-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #000;
    color: white;
  }
  
  /* Header */
  .view-header {
    padding: 24px 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(18, 18, 18, 0.4);
    backdrop-filter: blur(20px);
  }
  
  .header-content {
    margin-bottom: 20px;
  }
  
  .view-title {
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }
  
  .view-subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .header-controls {
    display: flex;
    gap: 24px;
    align-items: center;
  }
  
  /* View Switcher */
  .view-switcher {
    display: flex;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 4px;
  }
  
  .view-btn {
    padding: 8px 16px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.15s ease;
  }
  
  .view-btn:hover {
    color: rgba(255, 255, 255, 0.8);
  }
  
  .view-btn.active {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  /* Navigation Controls */
  .nav-controls {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-left: auto;
  }
  
  .nav-btn {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .nav-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .nav-btn svg {
    width: 20px;
    height: 20px;
  }
  
  .today-btn {
    min-width: 80px;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .action-btn.primary {
    background: white;
    color: black;
  }
  
  .action-btn.primary:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
  }
  
  .action-btn svg {
    width: 18px;
    height: 18px;
  }
  
  /* Calendar Container */
  .calendar-container {
    flex: 1;
    overflow: hidden;
    padding: 24px;
  }
  
  /* Month View */
  .month-view {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    margin-bottom: 8px;
  }
  
  .weekday {
    padding: 12px;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .days-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(6, 1fr);
    gap: 1px;
    background: rgba(255, 255, 255, 0.05);
  }
  
  .day-cell {
    background: rgba(0, 0, 0, 0.8);
    padding: 8px;
    min-height: 100px;
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
    overflow: hidden;
  }
  
  .day-cell:hover {
    background: rgba(255, 255, 255, 0.03);
  }
  
  .day-cell.other-month {
    opacity: 0.3;
  }
  
  .day-cell.today {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .day-cell.today .day-number {
    background: white;
    color: black;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }
  
  .day-cell.selected {
    background: rgba(255, 255, 255, 0.08);
    outline: 2px solid rgba(255, 255, 255, 0.2);
    outline-offset: -2px;
  }
  
  .day-number {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 8px;
  }
  
  .day-events {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .event-chip {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    gap: 4px;
  }
  
  .event-chip:hover {
    transform: translateX(2px);
  }
  
  .event-time {
    font-weight: 600;
    opacity: 0.8;
  }
  
  .event-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .more-events {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 4px;
  }
  
  /* Week View */
  .week-view {
    height: 100%;
    display: flex;
    overflow: auto;
  }
  
  .time-column {
    width: 80px;
    flex-shrink: 0;
  }
  
  .time-header {
    height: 60px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .time-slot {
    height: 60px;
    padding: 4px 8px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    border-bottom: 1px solid rgba(255, 255, 255, 0.02);
  }
  
  .week-days {
    flex: 1;
    display: flex;
  }
  
  .week-day {
    flex: 1;
    border-left: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .day-header {
    height: 60px;
    padding: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    text-align: center;
  }
  
  .day-name {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 4px;
  }
  
  .day-date {
    font-size: 20px;
    font-weight: 600;
  }
  
  .day-date.today {
    background: white;
    color: black;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  .day-timeline {
    position: relative;
    height: calc(24 * 60px);
  }
  
  .hour-slot {
    height: 60px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.02);
  }
  
  .timeline-event {
    position: absolute;
    left: 4px;
    right: 4px;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.15s ease;
  }
  
  .timeline-event:hover {
    transform: scale(1.02);
    z-index: 10;
  }
  
  .event-content {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .event-content .event-title {
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 2px;
  }
  
  .event-content .event-time {
    font-size: 11px;
    opacity: 0.8;
  }
  
  /* Scrollbar */
  .calendar-container::-webkit-scrollbar,
  .week-view::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }
  
  .calendar-container::-webkit-scrollbar-track,
  .week-view::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .calendar-container::-webkit-scrollbar-thumb,
  .week-view::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    border: 3px solid transparent;
    background-clip: padding-box;
  }
  
  .calendar-container::-webkit-scrollbar-thumb:hover,
  .week-view::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.12);
    background-clip: padding-box;
  }
  </style>