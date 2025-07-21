'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
}

/**
 * 최적화된 이미지 컴포넌트
 * - 지연 로딩 및 블러 플레이스홀더 지원
 * - WebP/AVIF 자동 변환 (Next.js Image 기능)
 * - 로딩 상태 표시
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75,
  onLoad,
  ...props
}: OptimizedImageProps & React.ComponentPropsWithoutRef<typeof Image>) {
  const [isLoading, setIsLoading] = useState(!priority);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        sizes={sizes}
        quality={quality}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        {...props}
      />
    </div>
  );
}