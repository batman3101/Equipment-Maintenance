'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { throttle } from '@/lib/utils/index';
import { VirtualScroller } from './VirtualScroller';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  height?: number | string;
  itemHeight: number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  className?: string;
  headerComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
}

/**
 * 가상 목록 컴포넌트
 * 대용량 목록을 효율적으로 렌더링하기 위한 컴포넌트
 * 모바일 성능 최적화를 위한 가상 스크롤링 적용
 */
export function VirtualList<T>({
  items,
  renderItem,
  keyExtractor,
  height = 400,
  itemHeight,
  onEndReached,
  endReachedThreshold = 0.8,
  loading = false,
  loadingComponent,
  emptyComponent,
  className = '',
  headerComponent,
  footerComponent,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(
    typeof height === 'number' ? height : 400
  );

  // 컨테이너 높이 계산
  useEffect(() => {
    if (typeof height === 'string' && containerRef.current) {
      const updateHeight = () => {
        if (containerRef.current) {
          const newHeight = containerRef.current.getBoundingClientRect().height;
          setContainerHeight(newHeight);
        }
      };

      updateHeight();

      const resizeObserver = new ResizeObserver(throttle(updateHeight, 100));
      resizeObserver.observe(containerRef.current);

      return () => {
        if (containerRef.current) {
          resizeObserver.unobserve(containerRef.current);
        }
        resizeObserver.disconnect();
      };
    }
  }, [height]);

  // 아이템 렌더링 함수
  const renderVirtualItem = useCallback(
    (item: T, index: number) => {
      return (
        <div key={keyExtractor(item, index)} className="virtual-list-item">
          {renderItem(item, index)}
        </div>
      );
    },
    [renderItem, keyExtractor]
  );

  return (
    <div
      ref={containerRef}
      className={`virtual-list-container ${className}`}
      style={{ height: height }}
    >
      {/* 헤더 컴포넌트 */}
      {headerComponent}

      {/* 로딩 상태 */}
      {loading && loadingComponent}

      {/* 빈 상태 */}
      {!loading && items.length === 0 && emptyComponent}

      {/* 가상 스크롤러 */}
      {!loading && items.length > 0 && (
        <VirtualScroller
          items={items}
          height={containerHeight}
          itemHeight={itemHeight}
          renderItem={renderVirtualItem}
          overscan={5}
          onEndReached={onEndReached}
          endReachedThreshold={endReachedThreshold}
        />
      )}

      {/* 푸터 컴포넌트 */}
      {footerComponent}
    </div>
  );
}