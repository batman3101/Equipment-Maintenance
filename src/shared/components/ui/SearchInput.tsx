'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from './Input';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onSearch?: (value: string) => void;
  onClear?: () => void;
  debounceMs?: number;
  showClearButton?: boolean;
  loading?: boolean;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  className?: string;
}

/**
 * 검색 입력 컴포넌트
 * - 디바운스 기능
 * - 자동완성 제안
 * - 검색 기록 관리
 * - 모바일 최적화
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ 
    onSearch,
    onClear,
    debounceMs = 300,
    showClearButton = true,
    loading = false,
    suggestions = [],
    onSuggestionSelect,
    className,
    value: controlledValue,
    defaultValue,
    ...props 
  }, ref) => {
    const [value, setValue] = React.useState(controlledValue || defaultValue || '');
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = React.useState(-1);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const suggestionsRef = React.useRef<HTMLDivElement>(null);

    // 디바운스된 검색 실행
    const debouncedSearch = React.useMemo(
      () => {
        let timeoutId: NodeJS.Timeout;
        return (searchValue: string) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            onSearch?.(searchValue);
          }, debounceMs);
        };
      },
      [onSearch, debounceMs]
    );

    // 값 변경 처리
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setValue(newValue);
      
      if (typeof newValue === 'string' && newValue.trim()) {
        debouncedSearch(newValue);
        setShowSuggestions(suggestions.length > 0);
      } else {
        setShowSuggestions(false);
        onClear?.();
      }
      
      setActiveSuggestionIndex(-1);
    };

    // 클리어 버튼 처리
    const handleClear = () => {
      setValue('');
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      onClear?.();
      inputRef.current?.focus();
    };

    // 제안 선택 처리
    const handleSuggestionClick = (suggestion: string) => {
      setValue(suggestion);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      onSuggestionSelect?.(suggestion);
      onSearch?.(suggestion);
    };

    // 키보드 네비게이션
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setActiveSuggestionIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setActiveSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (activeSuggestionIndex >= 0) {
            handleSuggestionClick(suggestions[activeSuggestionIndex]);
          } else if (typeof value === 'string' && value.trim()) {
            onSearch?.(value);
            setShowSuggestions(false);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setActiveSuggestionIndex(-1);
          break;
      }
    };

    // 외부 클릭 시 제안 숨기기
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          inputRef.current && 
          !inputRef.current.contains(event.target as Node) &&
          suggestionsRef.current &&
          !suggestionsRef.current.contains(event.target as Node)
        ) {
          setShowSuggestions(false);
          setActiveSuggestionIndex(-1);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 제어된 컴포넌트 지원
    React.useEffect(() => {
      if (controlledValue !== undefined) {
        setValue(controlledValue);
      }
    }, [controlledValue]);

    return (
      <div className={cn('relative', className)}>
        <div className="relative">
          <Input
            ref={inputRef}
            type="search"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0 && typeof value === 'string' && value.trim()) {
                setShowSuggestions(true);
              }
            }}
            leftIcon={
              loading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )
            }
            rightIcon={
              showClearButton && value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="hover:text-gray-600 transition-colors p-1"
                  aria-label="검색어 지우기"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )
            }
            {...props}
          />
        </div>

        {/* 검색 제안 드롭다운 */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className={cn(
              'absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg',
              'max-h-60 overflow-y-auto'
            )}
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                className={cn(
                  'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors',
                  'flex items-center space-x-3 min-h-[48px]',
                  'first:rounded-t-lg last:rounded-b-lg',
                  activeSuggestionIndex === index && 'bg-blue-50 text-blue-700'
                )}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setActiveSuggestionIndex(index)}
              >
                <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="truncate">{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';