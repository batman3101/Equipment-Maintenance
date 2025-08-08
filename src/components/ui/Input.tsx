import React from 'react'

interface InputProps {
  label?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date'
  placeholder?: string
  value?: string
  defaultValue?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  disabled?: boolean
  error?: string
  className?: string
  id?: string
  min?: string
  step?: string
  readOnly?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
}

export function Input({
  label,
  type = 'text',
  placeholder,
  value,
  defaultValue,
  onChange,
  required = false,
  disabled = false,
  error,
  className = '',
  id,
  min,
  step,
  readOnly,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        required={required}
        disabled={disabled}
        min={min}
        step={step}
        readOnly={readOnly}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy || (error ? `${inputId}-error` : undefined)}
        aria-invalid={error ? 'true' : 'false'}
        className={`
          w-full px-3 py-2 border rounded-lg 
          text-gray-900 dark:text-gray-100
          bg-white dark:bg-gray-800
          border-gray-300 dark:border-gray-600
          placeholder-gray-500 dark:placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-700
          ${error ? 'border-red-500 dark:border-red-400' : ''}
        `}
      />
      {error && (
        <p 
          id={`${inputId}-error`}
          className="mt-1 text-sm text-red-500 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  )
}