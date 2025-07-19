'use client';

import React from 'react';
import { SearchInput } from '@/shared/components/ui';
import type { Equipment } from '../types';

export interface EquipmentSearchProps {
  onSearch?: (query: string) => void;
  onSuggestionSelect?: (equipment: Equipment) => void;
  suggestions?: Equipment[];
  loading?: boolean;
  placeholder?: string;
  className?: string;
}

export const EquipmentSearch = React.forwardRef<HTMLDivElement, EquipmentSearchProps>(
  ({ 
    onSearch,
    onSuggestionSelect,
    suggestions = [],
    loading = false,
    placeholder = "설비 번호, 이름, 위치로 검색...",
    className,
    ...props 
  }, ref) => {
    
    const suggestionStrings = suggestions.map(eq => 
      `${eq.equipment_number} - ${eq.name}`
    );

    const handleSuggestionSelect = (suggestion: string) => {
      const equipment = suggestions.find(eq => 
        suggestion.startsWith(eq.equipment_number)
      );
      if (equipment && onSuggestionSelect) {
        onSuggestionSelect(equipment);
      }
    };

    return (
      <div ref={ref} className={className} {...props}>
        <SearchInput
          onSearch={onSearch}
          suggestions={suggestionStrings}
          onSuggestionSelect={handleSuggestionSelect}
          loading={loading}
          placeholder={placeholder}
        />
      </div>
    );
  }
);

EquipmentSearch.displayName = 'EquipmentSearch';