'use client';

import { useState, useMemo } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Pagination } from './Pagination';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  filters?: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
  }[];
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  selection?: {
    selectedKeys: string[];
    onChange: (selectedKeys: string[]) => void;
    getRowKey: (record: T) => string;
  };
  actions?: {
    title: string;
    onClick: (selectedKeys: string[]) => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
  }[];
  emptyText?: string;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  pagination,
  filters,
  searchable = false,
  searchPlaceholder = '검색...',
  onSearch,
  selection,
  actions,
  emptyText = '데이터가 없습니다.',
  className = ''
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const [searchValue, setSearchValue] = useState('');

  // 정렬 처리
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig?.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!selection) return;
    
    if (checked) {
      const allKeys = sortedData.map(selection.getRowKey);
      selection.onChange(allKeys);
    } else {
      selection.onChange([]);
    }
  };

  const handleSelectRow = (record: T, checked: boolean) => {
    if (!selection) return;
    
    const rowKey = selection.getRowKey(record);
    const currentKeys = selection.selectedKeys;
    
    if (checked) {
      selection.onChange([...currentKeys, rowKey]);
    } else {
      selection.onChange(currentKeys.filter(key => key !== rowKey));
    }
  };

  const isAllSelected = selection && selection.selectedKeys.length === sortedData.length;
  const isIndeterminate = selection && selection.selectedKeys.length > 0 && !isAllSelected;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 헤더 영역 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        {/* 검색 */}
        {searchable && (
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
            />
          </div>
        )}

        {/* 필터 */}
        {filters && filters.length > 0 && (
          <div className="flex gap-2">
            {filters.map((filter) => (
              <Select
                key={filter.key}
                value={filter.value}
                onChange={filter.onChange}
                options={[
                  { value: '', label: `모든 ${filter.label}` },
                  ...filter.options
                ]}
                className="min-w-[120px]"
              />
            ))}
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      {actions && actions.length > 0 && selection && selection.selectedKeys.length > 0 && (
        <div className="flex gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'secondary'}
              onClick={() => action.onClick(selection.selectedKeys)}
              disabled={action.disabled}
              size="sm"
            >
              {action.title} ({selection.selectedKeys.length})
            </Button>
          ))}
        </div>
      )}

      {/* 테이블 */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {selection && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key as string)}
                >
                  <div className="flex items-center gap-2">
                    {column.title}
                    {column.sortable && (
                      <div className="flex flex-col">
                        <svg
                          className={`w-3 h-3 ${
                            sortConfig?.key === column.key && sortConfig?.direction === 'asc'
                              ? 'text-primary-600'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selection ? 1 : 0)} className="px-4 py-12">
                  <EmptyState message={emptyText} />
                </td>
              </tr>
            ) : (
              sortedData.map((record, rowIndex) => {
                const rowKey = selection?.getRowKey(record);
                const isSelected = selection?.selectedKeys.includes(rowKey || '');

                return (
                  <tr
                    key={rowIndex}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                    }`}
                  >
                    {selection && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(record, e.target.checked)}
                          className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {column.render
                          ? column.render(record[column.key as keyof T], record)
                          : String(record[column.key as keyof T] || '-')
                        }
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {pagination && (
        <div className="flex justify-center">
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={pagination.onChange}
          />
        </div>
      )}
    </div>
  );
}