import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react'
import { Animated, Easing, Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useThemeMode } from '../context/ThemeContext'

type ToastType = 'success' | 'error' | 'info' | 'warning'

type ToastState = {
  visible: boolean
  title: string
  message?: string
  type: ToastType
}

type ToastContextValue = {
  show: (title: string, message?: string, type?: ToastType, durationMs?: number) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useThemeMode()
  const [state, setState] = useState<ToastState>({ visible: false, title: '', message: '', type: 'info' })
  const slide = useRef(new Animated.Value(-80)).current
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const currentDurationRef = useRef<number>(3000)

  const show = useCallback((title: string, message?: string, type: ToastType = 'info', durationMs = 3000) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    currentDurationRef.current = durationMs
    setState({ visible: true, title, message, type })
  }, [])

  const hide = useCallback(() => {
    Animated.timing(slide, { toValue: -80, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
      setState((prev) => ({ ...prev, visible: false }))
    })
  }, [slide])

  useEffect(() => {
    if (state.visible) {
      Animated.timing(slide, { toValue: 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }).start()
      timerRef.current = setTimeout(hide, currentDurationRef.current)
    }
    return () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null } }
  }, [state.visible, hide, slide])

  const palette = {
    success: { bg: '#10B981', border: '#059669', icon: 'checkmark-circle' as const },
    error: { bg: '#EF4444', border: '#DC2626', icon: 'alert-circle' as const },
    warning: { bg: '#F59E0B', border: '#D97706', icon: 'warning' as const },
    info: { bg: colors.card, border: colors.border, icon: 'information-circle' as const },
  }[state.type]

  return (
    <ToastContext.Provider value={{ show }}>
      <View style={{ flex: 1 }}>
        {children}
        {state.visible && (
          <Animated.View
            style={{
              position: 'absolute',
              left: 12,
              right: 12,
              top: 12,
              transform: [{ translateY: slide }],
            }}
          >
            <Pressable
              onPress={hide}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: palette.bg,
                borderWidth: 1,
                borderColor: palette.border,
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Ionicons name={palette.icon} size={18} color="#FFFFFF" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }} numberOfLines={1}>{state.title}</Text>
                {state.message ? (
                  <Text style={{ color: '#F8FAFC', fontSize: 12, marginTop: 2 }} numberOfLines={3}>{state.message}</Text>
                ) : null}
              </View>
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  )
}
