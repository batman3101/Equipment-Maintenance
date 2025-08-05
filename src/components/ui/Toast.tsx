'use client'

import React, { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastData {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastProps {
  toast: ToastData
  onClose: (id: string) => void
}

const toastStyles = {
  success: {
    icon: '✅',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    iconBg: 'bg-green-100 dark:bg-green-800',
    iconColor: 'text-green-600 dark:text-green-400',
    titleColor: 'text-green-800 dark:text-green-200',
    messageColor: 'text-green-700 dark:text-green-300'
  },
  error: {
    icon: '❌',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconBg: 'bg-red-100 dark:bg-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    titleColor: 'text-red-800 dark:text-red-200',
    messageColor: 'text-red-700 dark:text-red-300'
  },
  warning: {
    icon: '⚠️',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconBg: 'bg-yellow-100 dark:bg-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    titleColor: 'text-yellow-800 dark:text-yellow-200',
    messageColor: 'text-yellow-700 dark:text-yellow-300'
  },
  info: {
    icon: 'ℹ️',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-100 dark:bg-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    titleColor: 'text-blue-800 dark:text-blue-200',
    messageColor: 'text-blue-700 dark:text-blue-300'
  }
}

export function Toast({ toast, onClose }: ToastProps) {
  const styles = toastStyles[toast.type]
  const duration = toast.duration || 5000

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(toast.id)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [toast.id, duration, onClose])

  const handleClose = () => {
    onClose(toast.id)
  }

  return (
    <div className={`
      max-w-sm w-full ${styles.bgColor} ${styles.borderColor} border rounded-lg shadow-lg 
      transform transition-all duration-300 ease-in-out
      animate-slide-in-right hover:shadow-xl
    `}>
      <div className="p-4">
        <div className="flex items-start">
          <div className={`
            flex-shrink-0 w-8 h-8 ${styles.iconBg} rounded-full 
            flex items-center justify-center mr-3
          `}>
            <span className={`text-lg ${styles.iconColor}`}>
              {styles.icon}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`text-sm font-semibold ${styles.titleColor}`}>
                  {toast.title}
                </p>
                {toast.message && (
                  <p className={`mt-1 text-sm ${styles.messageColor}`}>
                    {toast.message}
                  </p>
                )}
              </div>
              
              <button
                onClick={handleClose}
                className={`
                  ml-4 flex-shrink-0 rounded-md p-1 
                  hover:bg-gray-100 dark:hover:bg-gray-700 
                  focus:outline-none focus:ring-2 focus:ring-gray-400
                  transition-colors duration-200
                `}
              >
                <span className="sr-only">닫기</span>
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {toast.action && (
              <div className="mt-3">
                <button
                  onClick={toast.action.onClick}
                  className={`
                    text-sm font-medium underline ${styles.titleColor}
                    hover:no-underline focus:outline-none focus:ring-2 
                    focus:ring-offset-2 focus:ring-gray-400 rounded
                  `}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress bar for duration */}
      {duration > 0 && (
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${
              toast.type === 'success' ? 'from-green-400 to-green-600' :
              toast.type === 'error' ? 'from-red-400 to-red-600' :
              toast.type === 'warning' ? 'from-yellow-400 to-yellow-600' :
              'from-blue-400 to-blue-600'
            }`}
            style={{
              animation: `toast-progress ${duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  )
}

export function ToastContainer({ toasts, onClose }: { 
  toasts: ToastData[]
  onClose: (id: string) => void 
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  )
}

// CSS animations (이 부분은 globals.css에 추가해야 합니다)
// const styles = `
// @keyframes slide-in-right {
//   from {
//     transform: translateX(100%);
//     opacity: 0;
//   }
//   to {
//     transform: translateX(0);
//     opacity: 1;
//   }
// }

// @keyframes toast-progress {
//   from {
//     width: 100%;
//   }
//   to {
//     width: 0%;
//   }
// }

// .animate-slide-in-right {
//   animation: slide-in-right 0.3s ease-out;
// }
// `