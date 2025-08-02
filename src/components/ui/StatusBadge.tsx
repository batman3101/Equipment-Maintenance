import React from 'react'

type Variant = 'success' | 'danger' | 'warning' | 'info' | 'secondary' | 'reported' | 'in_progress' | 'under_repair' | 'completed'

interface StatusBadgeProps {
  variant: Variant
  children: React.ReactNode
  className?: string
}

export function StatusBadge({ variant, children, className = '' }: StatusBadgeProps) {
  const variantConfig = {
    success: {
      className: 'bg-green-100 text-black border-green-200',
      darkClassName: 'dark:bg-green-900/30 dark:text-black dark:border-green-700'
    },
    danger: {
      className: 'bg-red-100 text-black border-red-200',
      darkClassName: 'dark:bg-red-900/30 dark:text-black dark:border-red-700'
    },
    warning: {
      className: 'bg-yellow-100 text-black border-yellow-200',
      darkClassName: 'dark:bg-yellow-900/30 dark:text-black dark:border-yellow-700'
    },
    info: {
      className: 'bg-blue-100 text-black border-blue-200',
      darkClassName: 'dark:bg-blue-900/30 dark:text-black dark:border-blue-700'
    },
    secondary: {
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      darkClassName: 'dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700'
    },
    reported: {
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      darkClassName: 'dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700'
    },
    in_progress: {
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      darkClassName: 'dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
    },
    under_repair: {
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      darkClassName: 'dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700'
    },
    completed: {
      className: 'bg-green-100 text-green-800 border-green-200',
      darkClassName: 'dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
    }
  }

  const config = variantConfig[variant]

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${config.className}
        ${config.darkClassName}
        ${className}
      `}
    >
      {children}
    </span>
  )
}