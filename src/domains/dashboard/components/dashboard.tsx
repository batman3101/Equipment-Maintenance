/**
 * 메인 대시보드 컴포넌트 - 개선된 버전
 */

'use client';

import React, { useState, useEffect } from 'react';
import EquipmentStatsCards from '@/components/dashboard/EquipmentStatsCards';
import TrendAnalysisCharts from '@/components/dashboard/TrendAnalysisCharts';
import RecentActivitiesTable from '@/components/dashboard/RecentActivitiesTable';
import type { EquipmentStats } from '@/components/dashboard/EquipmentStatsCards';
import type { 
  MonthlyBreakdownData, 
  YearlyBreakdownData, 
  BreakdownTypeData 
} from '@/components/dashboard/TrendAnalysisCharts';
import type { RecentActivity } from '@/components/dashboard/RecentActivitiesTable';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<EquipmentStats>({
    totalEquipment: 0,
    equipmentByType: {},
    monthlyBreakdowns: 0,
    yesterdayBreakdowns: 0,
    todayBreakdowns: 0,
    yesterdayRepairs: 0,
    todayRepairs: 0
  });

  // 샘플 데이터 생성
  useEffect(() => {
    // 시뮬레이션: 데이터 로딩
    const loadDashboardData = async () => {
      setLoading(true);
      
      // 2초 후 샘플 데이터 로드 (실제 환경에서는 API 호출)
      setTimeout(() => {
        setStatsData({
          totalEquipment: 156,
          equipmentByType: {
            cnc_machine: 45,
            lathe: 32,
            milling_machine: 28,
            drill_press: 18,
            grinder: 15,
            press: 12,
            conveyor: 6
          },
          monthlyBreakdowns: 23,
          yesterdayBreakdowns: 3,
          todayBreakdowns: 1,
          yesterdayRepairs: 2,
          todayRepairs: 4
        });
        setLoading(false);
      }, 2000);
    };

    loadDashboardData();
  }, []);

  // 샘플 월별 트렌드 데이터
  const monthlyTrendData: MonthlyBreakdownData[] = [
    { month: '2024-01', breakdowns: 18, repairs: 16 },
    { month: '2024-02', breakdowns: 22, repairs: 20 },
    { month: '2024-03', breakdowns: 15, repairs: 17 },
    { month: '2024-04', breakdowns: 28, repairs: 25 },
    { month: '2024-05', breakdowns: 19, repairs: 21 },
    { month: '2024-06', breakdowns: 31, repairs: 29 },
    { month: '2024-07', breakdowns: 24, repairs: 26 },
    { month: '2024-08', breakdowns: 26, repairs: 24 },
    { month: '2024-09', breakdowns: 21, repairs: 23 },
    { month: '2024-10', breakdowns: 17, repairs: 19 },
    { month: '2024-11', breakdowns: 29, repairs: 27 },
    { month: '2024-12', breakdowns: 23, repairs: 25 }
  ];

  // 샘플 연도별 트렌드 데이터
  const yearlyTrendData: YearlyBreakdownData[] = [
    { year: '2020', breakdowns: 245, repairs: 238 },
    { year: '2021', breakdowns: 198, repairs: 195 },
    { year: '2022', breakdowns: 312, repairs: 298 },
    { year: '2023', breakdowns: 267, repairs: 261 },
    { year: '2024', breakdowns: 273, repairs: 272 }
  ];

  // 샘플 고장 유형별 분포 데이터
  const breakdownTypeData: BreakdownTypeData[] = [
    { type: '기계적 고장', count: 45, percentage: 35.2 },
    { type: '전기적 고장', count: 32, percentage: 25.0 },
    { type: '소프트웨어 오류', count: 23, percentage: 18.0 },
    { type: '냉각 시스템', count: 18, percentage: 14.1 },
    { type: '윤활 시스템', count: 10, percentage: 7.8 }
  ];

  // 샘플 최근 활동 데이터
  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'breakdown',
      status: 'pending',
      equipmentNumber: 'CNC-001',
      equipmentType: 'CNC 머신',
      title: '스핀들 모터 이상',
      description: '스핀들 모터에서 이상 소음 발생',
      reporter: '김기사',
      createdAt: '2024-07-25T09:30:00Z',
      updatedAt: '2024-07-25T09:30:00Z',
      priority: 'high'
    },
    {
      id: '2',
      type: 'repair',
      status: 'in_progress',
      equipmentNumber: 'LAT-005',
      equipmentType: '선반',
      title: '척 교체 작업',
      description: '마모된 척을 새것으로 교체',
      assignee: '박정비',
      createdAt: '2024-07-25T08:15:00Z',
      updatedAt: '2024-07-25T10:00:00Z',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'maintenance',
      status: 'completed',
      equipmentNumber: 'MIL-003',
      equipmentType: '밀링머신',
      title: '정기 점검',
      description: '월간 정기 점검 완료',
      assignee: '이정비',
      createdAt: '2024-07-24T14:20:00Z',
      updatedAt: '2024-07-24T16:45:00Z',
      priority: 'low'
    },
    {
      id: '4',
      type: 'breakdown',
      status: 'completed',
      equipmentNumber: 'DRL-002',
      equipmentType: '드릴프레스',
      title: '벨트 교체',
      description: '구동 벨트 절단으로 인한 교체',
      reporter: '최기사',
      assignee: '김정비',
      createdAt: '2024-07-24T11:30:00Z',
      updatedAt: '2024-07-24T15:20:00Z',
      priority: 'medium'
    },
    {
      id: '5',
      type: 'inspection',
      status: 'completed',
      equipmentNumber: 'GRD-001',
      equipmentType: '그라인더',
      title: '안전 점검',
      description: '월간 안전 점검 실시',
      assignee: '박안전',
      createdAt: '2024-07-23T13:45:00Z',
      updatedAt: '2024-07-23T15:30:00Z',
      priority: 'medium'
    }
  ];

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">대시보드</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            설비 현황을 한눈에 확인하세요
          </p>
        </div>
      </div>

      {/* 설비 현황 카드 */}
      <EquipmentStatsCards 
        stats={statsData} 
        loading={loading} 
      />

      {/* 트렌드 분석 차트 */}
      <TrendAnalysisCharts
        monthlyData={monthlyTrendData}
        yearlyData={yearlyTrendData}
        breakdownTypeData={breakdownTypeData}
        loading={loading}
      />

      {/* 최근 활동 테이블 */}
      <RecentActivitiesTable
        activities={recentActivities}
        loading={loading}
        onViewDetail={(activity) => {
          console.log('상세보기:', activity);
          // TODO: 상세보기 페이지로 이동하거나 모달 열기
        }}
      />
    </div>
  );
}