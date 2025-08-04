import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm ${hover ? 'hover:shadow-md transition-shadow' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`px-6 py-4 text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 rounded-b-lg ${className}`}>
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Content = CardContent
Card.Footer = CardFooter