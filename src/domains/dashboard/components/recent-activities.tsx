/**
 * 최근 활동 목록 컴포넌트
 * 최근 등록된 고장과 수리 내역을 표시
 */

import React from 'react';
import Link from 'next/link';
import { RecentActivity } from '../types';
import { 
  AlertTriangle, 
  Wrench, 
  Clock, 
  User,
  ChevronRight 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface RecentActivitiesProps {
  activities: RecentActivity[];
  loading?: boolean;
}

const statusConfig = {
  in_progress: {
    label: '진행 중',
    color: 'text-orange-600 bg-orange-100',
    icon: AlertTriangle,
  },
  under_repair: {
    label: '수리 중',
    color: 'text-blue-600 bg-blue-100',
    icon: Wrench,
  },
  completed: {
    label: '완료',
    color: 'text-green-600 bg-green-100',
    icon: Wrench,
  },
};

const activityTypeConfig = {
  breakdown: {
    label: '고장 등록',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  repair: {
    label: '수리 완료',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
};

function ActivityItem({ activity }: { activity: RecentActivity }) {
  const statusInfo = statusConfig[activity.status];
  const typeInfo = activityTypeConfig[activity.type];
  const StatusIcon = statusInfo.icon;

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ko,
      });
    } catch {
      return '방금 전';
    }
  };

  return (
    <Link 
      href={`/breakdowns/${activity.type === 'breakdown' ? activity.id : activity.id}`}
      className="block"
    >
      <div className={`rounded-lg border p-4 transition-colors hover:bg-gray-50 ${typeInfo.borderColor}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* 활동 타입과 상태 */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusInfo.color}`}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {statusInfo.label}
              </span>
              <span className={`text-xs font-medium ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
            </div>

            {/* 설비 정보 */}
            <div className="mb-2">
              <h4 className="font-medium text-gray-900 truncate">
                {activity.equipmentType} - {activity.equipmentNumber}
              </h4>
              {activity.symptoms && (
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                  {activity.symptoms}
                </p>
              )}
              {activity.actionTaken && (
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                  조치: {activity.actionTaken}
                </p>
              )}
            </div>

            {/* 시간과 담당자 정보 */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatTimeAgo(activity.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{activity.reporterName}</span>
              </div>
            </div>
          </div>

          {/* 화살표 아이콘 */}
          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
        </div>
      </div>
    </Link>
  );
}

export function RecentActivities({ activities, loading }: RecentActivitiesProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <ActivityItemSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">활동 내역이 없습니다</h3>
        <p className="mt-1 text-sm text-gray-500">
          고장 등록이나 수리 완료 후 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <ActivityItem key={`${activity.type}-${activity.id}`} activity={activity} />
      ))}
    </div>
  );
}

/**
 * 활동 아이템 스켈레톤 로딩 컴포넌트
 */
function ActivityItemSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200"></div>
            <div className="h-4 w-12 animate-pulse rounded bg-gray-200"></div>
          </div>
          <div className="mb-2">
            <div className="h-5 w-32 animate-pulse rounded bg-gray-200 mb-1"></div>
            <div className="h-4 w-48 animate-pulse rounded bg-gray-200"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-3 w-16 animate-pulse rounded bg-gray-200"></div>
            <div className="h-3 w-12 animate-pulse rounded bg-gray-200"></div>
          </div>
        </div>
        <div className="h-5 w-5 animate-pulse rounded bg-gray-200 flex-shrink-0 ml-2"></div>
      </div>
    </div>
  );
}