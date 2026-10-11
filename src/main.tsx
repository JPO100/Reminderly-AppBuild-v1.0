import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LocalNotifications } from '@capacitor/local-notifications'
import App from './app/App'
import './styles/index.css'
import { registerNotificationActionTypes } from './app/notifications'
import { migrateSettings } from './app/settings/migration'

// Must run before the app reads any settings
try {
  migrateSettings()
} catch {
  // Fail silently - the app keeps reading its current keys
}

const PENDING_NOTIFICATION_REMINDER_ID_KEY = 'reminderly.pendingNotificationReminderId'
const PENDING_NOTIFICATION_ACTION_KEY = 'reminderly.pendingNotificationAction'
const NOTIFICATION_TAP_EVENT = 'reminderly:notification-tap'

void registerNotificationActionTypes()

void LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
  const reminderId = event.notification.extra?.reminderId
  if (typeof reminderId !== 'string') return

  localStorage.setItem(PENDING_NOTIFICATION_REMINDER_ID_KEY, reminderId)
  if (event.actionId && event.actionId !== 'tap') {
    localStorage.setItem(PENDING_NOTIFICATION_ACTION_KEY, event.actionId)
  } else {
    localStorage.removeItem(PENDING_NOTIFICATION_ACTION_KEY)
  }
  window.dispatchEvent(new CustomEvent(NOTIFICATION_TAP_EVENT))
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
