'use client';

import React from 'react';
import { 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Wrench,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock
} from 'lucide-react';

export interface EquipmentStats {
  // 설비 기본 정보
  totalEquipment: number;
  equipmentByType: { [key: string]: number };
  
  // 고장 관련 통계
  monthlyBreakdowns: number;
  yesterdayBreakdowns: number;
  todayBreakdowns: number;
  
  // 수리 관련 통계
  yesterdayRepairs: number;
  todayRepairs: number;
}

interface EquipmentStatsCardsProps {
  stats: EquipmentStats;
  loading?: boolean;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  color = 'blue',
  loading = false 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
    gray: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
  };

  const iconColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    purple: 'text-purple-600 dark:text-purple-400',
    gray: 'text-gray-600 dark:text-gray-400'
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:scale-[1.02] dark:bg-gray-800 dark:border-gray-700 dark:hover:shadow-2xl dark:hover:shadow-black/25 transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <div className={`w-5 h-5 ${iconColorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </div>
      
      <div className="flex items-baseline space-x-2">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {trend && (
          <div className={`flex items-center text-sm ${
            trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      
      {trend && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{trend.label}</p>
      )}
    </div>
  );
};

const EquipmentStatsCards: React.FC<EquipmentStatsCardsProps> = ({ stats, loading = false }) => {
  // 설비 종류별 가장 많은 타입 찾기
  const getMostCommonType = () => {
    const types = Object.entries(stats.equipmentByType);
    if (types.length === 0) return { type: '-', count: 0 };
    
    const [type, count] = types.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );
    
    const typeLabels: { [key: string]: string } = {
      cnc_machine: 'CNC 머신',
      lathe: '선반',
      milling_machine: '밀링머신',
      drill_press: '드릴프레스',
      grinder: '그라인더',
      press: '프레스',
      conveyor: '컨베이어',
      robot: '로봇',
      other: '기타'
    };
    
    return { 
      type: typeLabels[type] || type, 
      count 
    };
  };

  const mostCommonType = getMostCommonType();
  const typeCount = Object.keys(stats.equipmentByType).length;

  // 전일 대비 증감률 계산
  const breakdownTrend = stats.yesterdayBreakdowns > 0 
    ? ((stats.todayBreakdowns - stats.yesterdayBreakdowns) / stats.yesterdayBreakdowns) * 100
    : 0;
    
  const repairTrend = stats.yesterdayRepairs > 0 
    ? ((stats.todayRepairs - stats.yesterdayRepairs) / stats.yesterdayRepairs) * 100
    : 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">설비 현황을 한눈에 확인하세요</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">실시간 설비 및 고장/수리 현황</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 총 설비 */}
        <StatCard
          title="총 설비"
          value={stats.totalEquipment}
          icon={<Settings />}
          color="blue"
          loading={loading}
        />

        {/* 설비 종류 */}
        <StatCard
          title="설비 종류"
          value={`${typeCount}개 종류`}
          icon={<Settings />}
          color="purple"
          loading={loading}
        />

        {/* 가장 많은 설비 종류 */}
        <StatCard
          title="주요 설비"
          value={`${mostCommonType.type} (${mostCommonType.count})`}
          icon={<Settings />}
          color="gray"
          loading={loading}
        />

        {/* 월 설비 고장 */}
        <StatCard
          title="월 설비 고장"
          value={stats.monthlyBreakdowns}
          icon={<AlertTriangle />}
          color="yellow"
          loading={loading}
        />

        {/* 어제의 설비 고장 */}
        <StatCard
          title="어제의 설비 고장"
          value={stats.yesterdayBreakdowns}
          icon={<Calendar />}
          color="red"
          loading={loading}
        />

        {/* 오늘의 설비 고장 */}
        <StatCard
          title="오늘의 설비 고장"
          value={stats.todayBreakdowns}
          icon={<Clock />}
          trend={breakdownTrend !== 0 ? {
            value: Math.round(Math.abs(breakdownTrend)),
            isPositive: breakdownTrend < 0, // 고장은 감소가 좋음
            label: "어제 대비"
          } : undefined}
          color="red"
          loading={loading}
        />

        {/* 어제의 완료된 수리 */}
        <StatCard
          title="어제의 완료된 수리"
          value={stats.yesterdayRepairs}
          icon={<Calendar />}
          color="green"
          loading={loading}
        />

        {/* 오늘 완료된 수리 */}
        <StatCard
          title="오늘 완료된 수리"
          value={stats.todayRepairs}
          icon={<Wrench />}
          trend={repairTrend !== 0 ? {
            value: Math.round(Math.abs(repairTrend)),
            isPositive: repairTrend > 0, // 수리는 증가가 좋음
            label: "어제 대비"
          } : undefined}
          color="green"
          loading={loading}
        />
      </div>
    </div>
  );
};

export default EquipmentStatsCards;