'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Eye, 
  Calendar,
  Clock,
  Settings,
  AlertTriangle,
  CheckCircle,
  Wrench
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// 활동 타입 열거형
export type ActivityType = 'breakdown' | 'repair' | 'maintenance' | 'inspection';

// 활동 상태 열거형  
export type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// 최근 활동 데이터 타입
export interface RecentActivity {
  id: string;
  type: ActivityType;
  status: ActivityStatus;
  equipmentNumber: string;
  equipmentType: string;
  title: string;
  description: string;
  reporter?: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface RecentActivitiesTableProps {
  activities: RecentActivity[];
  loading?: boolean;
  onViewDetail?: (activity: RecentActivity) => void;
}

// 활동 타입 라벨 및 아이콘
const activityConfig = {
  breakdown: {
    label: '고장 신고',
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-50'
  },
  repair: {
    label: '수리',
    icon: Wrench,
    color: 'text-blue-600 bg-blue-50'
  },
  maintenance: {
    label: '정비',
    icon: Settings,
    color: 'text-green-600 bg-green-50'
  },
  inspection: {
    label: '점검',
    icon: CheckCircle,
    color: 'text-purple-600 bg-purple-50'
  }
};

// 상태 라벨 및 색상
const statusConfig = {
  pending: {
    label: '대기',
    color: 'bg-yellow-100 text-yellow-800'
  },
  in_progress: {
    label: '진행중',
    color: 'bg-blue-100 text-blue-800'
  },
  completed: {
    label: '완료',
    color: 'bg-green-100 text-green-800'
  },
  cancelled: {
    label: '취소',
    color: 'bg-gray-100 text-gray-800'
  }
};

// 우선순위 색상
const priorityConfig = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800', 
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const RecentActivitiesTable: React.FC<RecentActivitiesTableProps> = ({
  activities,
  loading = false,
  onViewDetail
}) => {
  const router = useRouter();
  
  // 필터 및 정렬 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'all'>('all');
  const [sortField, setSortField] = useState<keyof RecentActivity>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // 필터링 및 정렬된 데이터
  const filteredAndSortedActivities = useMemo(() => {
    let filtered = activities;

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.equipmentNumber.toLowerCase().includes(query) ||
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        activity.reporter?.toLowerCase().includes(query) ||
        activity.assignee?.toLowerCase().includes(query)
      );
    }

    // 타입 필터
    if (typeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === typeFilter);
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(activity => activity.status === statusFilter);
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // 날짜 필드의 경우 Date 객체로 변환
      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // 최대 10개만 표시
    return filtered.slice(0, 10);
  }, [activities, searchQuery, typeFilter, statusFilter, sortField, sortDirection]);

  // 정렬 핸들러
  const handleSort = (field: keyof RecentActivity) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // 상세보기 핸들러
  const handleViewDetail = (activity: RecentActivity) => {
    if (onViewDetail) {
      onViewDetail(activity);
    } else {
      // 기본 동작: 고장 관리 페이지로 이동
      if (activity.type === 'breakdown') {
        router.push(`/breakdowns/${activity.id}`);
      }
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}분 전`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}시간 전`;
    } else if (diffInHours < 24 * 7) {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg hover:scale-[1.01] dark:bg-gray-800 dark:border-gray-700 dark:hover:shadow-2xl dark:hover:shadow-black/25 transition-all duration-300 ease-in-out">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">최근 활동</h3>
            <p className="text-sm text-gray-600">가장 최근 활동 10개 표시</p>
          </div>

          {/* 검색 및 필터 */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 타입 필터 */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ActivityType | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">모든 타입</option>
              <option value="breakdown">고장 신고</option>
              <option value="repair">수리</option>
              <option value="maintenance">정비</option>
              <option value="inspection">점검</option>
            </select>

            {/* 상태 필터 */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ActivityStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">모든 상태</option>
              <option value="pending">대기</option>
              <option value="in_progress">진행중</option>
              <option value="completed">완료</option>
              <option value="cancelled">취소</option>
            </select>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">활동 내역을 불러오는 중...</p>
          </div>
        ) : filteredAndSortedActivities.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-2">
              <Calendar className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-500">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' 
                ? '검색 조건에 맞는 활동이 없습니다' 
                : '최근 활동이 없습니다'
              }
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  타입/상태
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('equipmentNumber')}
                >
                  <div className="flex items-center">
                    설비 정보
                    {sortField === 'equipmentNumber' && (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1" /> : <SortDesc className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  내용
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  담당자
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    생성일
                    {sortField === 'createdAt' && (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1" /> : <SortDesc className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedActivities.map((activity) => {
                const TypeIcon = activityConfig[activity.type].icon;
                
                return (
                  <tr key={activity.id} className="hover:bg-gray-50 transition-colors duration-200">
                    {/* 타입/상태 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${activityConfig[activity.type].color}`}>
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {activityConfig[activity.type].label}
                          </span>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusConfig[activity.status].color}`}>
                          {statusConfig[activity.status].label}
                        </span>
                      </div>
                    </td>

                    {/* 설비 정보 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {activity.equipmentNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {activity.equipmentType}
                        </div>
                      </div>
                    </td>

                    {/* 내용 */}
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {activity.description}
                        </div>
                        {activity.priority && (
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${priorityConfig[activity.priority]}`}>
                            {activity.priority.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 담당자 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {activity.assignee || activity.reporter || '-'}
                      </div>
                    </td>

                    {/* 생성일 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(activity.createdAt)}
                      </div>
                    </td>

                    {/* 액션 */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleViewDetail(activity)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        상세보기
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 푸터 */}
      {!loading && filteredAndSortedActivities.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              총 {activities.length}개 중 {filteredAndSortedActivities.length}개 표시
            </div>
            <div className="text-sm text-gray-500">
              최근 활동 순으로 정렬됨
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentActivitiesTable;