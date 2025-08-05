'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ToastContainer, ToastData } from '@/components/ui/Toast'

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => void
  showSuccess: (title: string, message?: string, options?: Partial<ToastData>) => void
  showError: (title: string, message?: string, options?: Partial<ToastData>) => void
  showWarning: (title: string, message?: string, options?: Partial<ToastData>) => void
  showInfo: (title: string, message?: string, options?: Partial<ToastData>) => void
  removeToast: (id: string) => void
  clearAllToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const showToast = useCallback((toastData: Omit<ToastData, 'id'>) => {
    const id = generateId()
    const toast: ToastData = {
      id,
      duration: 5000, // 기본 5초
      ...toastData
    }

    setToasts(prev => [...prev, toast])

    // 최대 5개까지만 표시
    setToasts(prev => prev.slice(-5))
  }, [generateId])

  const showSuccess = useCallback((
    title: string, 
    message?: string, 
    options?: Partial<ToastData>
  ) => {
    showToast({
      type: 'success',
      title,
      message,
      ...options
    })
  }, [showToast])

  const showError = useCallback((
    title: string, 
    message?: string, 
    options?: Partial<ToastData>
  ) => {
    showToast({
      type: 'error',
      title,
      message,
      duration: 7000, // 에러는 조금 더 오래 표시
      ...options
    })
  }, [showToast])

  const showWarning = useCallback((
    title: string, 
    message?: string, 
    options?: Partial<ToastData>
  ) => {
    showToast({
      type: 'warning',
      title,
      message,
      ...options
    })
  }, [showToast])

  const showInfo = useCallback((
    title: string, 
    message?: string, 
    options?: Partial<ToastData>
  ) => {
    showToast({
      type: 'info',
      title,
      message,
      ...options
    })
  }, [showToast])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  const contextValue: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAllToasts
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}