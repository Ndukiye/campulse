import { Alert, Platform } from 'react-native'

export function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    try {
      // Use native browser alert for web
      // eslint-disable-next-line no-alert
      window.alert(`${title}${message ? '\n\n' + message : ''}`)
    } catch {
      console.log('[Alert]', title, message ?? '')
    }
  } else {
    Alert.alert(title, message)
  }
}
