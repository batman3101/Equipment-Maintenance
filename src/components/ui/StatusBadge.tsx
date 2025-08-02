import React from 'react'

type Status = 'reported' | 'in_progress' | 'under_repair' | 'completed'

interface StatusBadgeProps {
  status: Status
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig = {
    reported: {
      label: '보고됨',
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      darkClassName: 'dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700'
    },
    in_progress: {
      label: '진행중',
      className: 'status-in-progress',
      darkClassName: ''
    },
    under_repair: {
      label: '수리중',
      className: 'status-under-repair',
      darkClassName: ''
    },
    completed: {
      label: '완료',
      className: 'status-completed',
      darkClassName: ''
    }
  }

  const config = statusConfig[status]

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${config.className}
        ${config.darkClassName}
        ${className}
      `}
    >
      {config.label}
    </span>
  )
}