'use client';

import { Badge } from './Badge';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig = {
  // 사용자 상태
  active: { 
    label: '활성', 
    variant: 'success' as const,
    color: 'green'
  },
  inactive: { 
    label: '비활성', 
    variant: 'secondary' as const,
    color: 'gray'
  },
  pending: { 
    label: '대기', 
    variant: 'warning' as const,
    color: 'yellow'
  },
  suspended: { 
    label: '정지', 
    variant: 'danger' as const,
    color: 'red'
  },
  
  // 등록 요청 상태
  approved: { 
    label: '승인됨', 
    variant: 'success' as const,
    color: 'green'
  },
  rejected: { 
    label: '거부됨', 
    variant: 'danger' as const,
    color: 'red'
  },
  
  // 설비 상태
  operational: { 
    label: '정상', 
    variant: 'success' as const,
    color: 'green'
  },
  maintenance: { 
    label: '정비', 
    variant: 'warning' as const,
    color: 'yellow'
  },
  breakdown: { 
    label: '고장', 
    variant: 'danger' as const,
    color: 'red'
  },
  
  // 고장 상태
  in_progress: { 
    label: '진행중', 
    variant: 'warning' as const,
    color: 'yellow'
  },
  completed: { 
    label: '완료', 
    variant: 'success' as const,
    color: 'green'
  },
  cancelled: { 
    label: '취소', 
    variant: 'secondary' as const,
    color: 'gray'
  }
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    variant: 'secondary' as const,
    color: 'gray'
  };

  return (
    <Badge 
      variant={config.variant}
      className={className}
    >
      {config.label}
    </Badge>
  );
}