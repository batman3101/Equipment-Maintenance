/**
 * 대시보드 데이터 서비스
 * 대시보드에 필요한 통계 데이터와 최근 활동을 조회하는 서비스
 */

import { supabase } from '@/lib/supabase';
import { DashboardStats, RecentActivity } from '../types';

export class DashboardService {
  /**
   * 개발 환경용 모의 대시보드 통계 데이터
   */
  private getMockDashboardStats(): DashboardStats {
    return {
      totalBreakdowns: 45,
      inProgressBreakdowns: 8,
      completedRepairs: 37,
      previousDayStats: {
        totalBreakdowns: 42,
        inProgressBreakdowns: 10,
        completedRepairs: 32,
      },
    };
  }

  /**
   * 개발 환경용 모의 최근 활동 데이터
   */
  private getMockRecentActivities(limit: number): RecentActivity[] {
    const mockActivities: RecentActivity[] = [
      {
        id: '1',
        type: 'breakdown',
        equipmentType: 'CNC 밀링머신',
        equipmentNumber: 'CNC-001',
        status: 'in_progress',
        reporterName: '김현장',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30분 전
        symptoms: '스핀들 모터에서 이상 소음 발생',
      },
      {
        id: '2',
        type: 'repair',
        equipmentType: 'CNC 선반',
        equipmentNumber: 'CNC-002',
        status: 'completed',
        reporterName: '이기술',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2시간 전
        actionTaken: '베어링 교체 및 윤활유 보충',
      },
      {
        id: '3',
        type: 'breakdown',
        equipmentType: 'CNC 머시닝센터',
        equipmentNumber: 'CNC-003',
        status: 'under_repair',
        reporterName: '박작업',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4시간 전
        symptoms: '자동 공구 교환 장치 오작동',
      },
      {
        id: '4',
        type: 'repair',
        equipmentType: 'CNC 밀링머신',
        equipmentNumber: 'CNC-004',
        status: 'completed',
        reporterName: '최수리',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6시간 전
        actionTaken: '냉각수 펌프 교체',
      },
      {
        id: '5',
        type: 'breakdown',
        equipmentType: 'CNC 선반',
        equipmentNumber: 'CNC-005',
        status: 'in_progress',
        reporterName: '정현장',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8시간 전
        symptoms: '척 클램핑 압력 부족',
      },
    ];

    return mockActivities.slice(0, limit);
  }
  /**
   * 대시보드 통계 데이터 조회
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // 개발 환경에서는 모의 데이터 반환
      if (process.env.NODE_ENV === 'development') {
        return this.getMockDashboardStats();
      }

      // 현재 사용자의 plant_id 조회
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('인증되지 않은 사용자입니다.');

      const { data: userData } = await supabase
        .from('users')
        .select('plant_id')
        .eq('id', user.id)
        .single();

      if (!userData) throw new Error('사용자 정보를 찾을 수 없습니다.');

      const plantId = userData.plant_id;

      // 오늘 날짜 범위 설정
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      // 어제 날짜 범위 설정
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayEnd = todayStart;

      // 총 고장 건수 조회
      const { count: totalBreakdowns } = await supabase
        .from('breakdowns')
        .select('*', { count: 'exact', head: true })
        .eq('plant_id', plantId);

      // 진행 중인 고장 건수 조회
      const { count: inProgressBreakdowns } = await supabase
        .from('breakdowns')
        .select('*', { count: 'exact', head: true })
        .eq('plant_id', plantId)
        .in('status', ['in_progress', 'under_repair']);

      // 완료된 수리 건수 조회
      const { count: completedRepairs } = await supabase
        .from('repairs')
        .select('breakdown:breakdowns!inner(*)', { count: 'exact', head: true })
        .eq('breakdown.plant_id', plantId);

      // 전일 통계 조회 (트렌드 계산용)
      const { count: yesterdayTotalBreakdowns } = await supabase
        .from('breakdowns')
        .select('*', { count: 'exact', head: true })
        .eq('plant_id', plantId)
        .lt('created_at', yesterdayEnd.toISOString());

      const { count: yesterdayInProgressBreakdowns } = await supabase
        .from('breakdowns')
        .select('*', { count: 'exact', head: true })
        .eq('plant_id', plantId)
        .in('status', ['in_progress', 'under_repair'])
        .lt('created_at', yesterdayEnd.toISOString());

      const { count: yesterdayCompletedRepairs } = await supabase
        .from('repairs')
        .select('breakdown:breakdowns!inner(*)', { count: 'exact', head: true })
        .eq('breakdown.plant_id', plantId)
        .lt('created_at', yesterdayEnd.toISOString());

      return {
        totalBreakdowns: totalBreakdowns || 0,
        inProgressBreakdowns: inProgressBreakdowns || 0,
        completedRepairs: completedRepairs || 0,
        previousDayStats: {
          totalBreakdowns: yesterdayTotalBreakdowns || 0,
          inProgressBreakdowns: yesterdayInProgressBreakdowns || 0,
          completedRepairs: yesterdayCompletedRepairs || 0,
        },
      };
    } catch (error) {
      console.error('대시보드 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 최근 활동 목록 조회
   */
  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    try {
      // 개발 환경에서는 모의 데이터 반환
      if (process.env.NODE_ENV === 'development') {
        return this.getMockRecentActivities(limit);
      }

      // 현재 사용자의 plant_id 조회
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('인증되지 않은 사용자입니다.');

      const { data: userData } = await supabase
        .from('users')
        .select('plant_id')
        .eq('id', user.id)
        .single();

      if (!userData) throw new Error('사용자 정보를 찾을 수 없습니다.');

      const plantId = userData.plant_id;

      // 최근 고장 등록 활동 조회
      const { data: breakdownActivities } = await supabase
        .from('breakdowns')
        .select(`
          id,
          equipment_type,
          equipment_number,
          status,
          symptoms,
          created_at,
          reporter:users!reporter_id(name)
        `)
        .eq('plant_id', plantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      // 최근 수리 완료 활동 조회
      const { data: repairActivities } = await supabase
        .from('repairs')
        .select(`
          id,
          action_taken,
          created_at,
          technician:users!technician_id(name),
          breakdown:breakdowns!breakdown_id(
            id,
            equipment_type,
            equipment_number,
            status,
            plant_id
          )
        `)
        .eq('breakdown.plant_id', plantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      // 활동 데이터 변환 및 병합
      const activities: RecentActivity[] = [];

      // 고장 등록 활동 추가
      if (breakdownActivities) {
        activities.push(
          ...breakdownActivities.map((breakdown) => ({
            id: breakdown.id,
            type: 'breakdown' as const,
            equipmentType: breakdown.equipment_type,
            equipmentNumber: breakdown.equipment_number,
            status: breakdown.status as 'in_progress' | 'under_repair' | 'completed',
            reporterName: (breakdown.reporter as any)?.name || '알 수 없음',
            createdAt: breakdown.created_at,
            symptoms: breakdown.symptoms,
          }))
        );
      }

      // 수리 완료 활동 추가
      if (repairActivities) {
        activities.push(
          ...repairActivities
            .filter((repair) => repair.breakdown) // breakdown이 존재하는 경우만
            .map((repair) => ({
              id: repair.id,
              type: 'repair' as const,
              equipmentType: (repair.breakdown as any).equipment_type,
              equipmentNumber: (repair.breakdown as any).equipment_number,
              status: (repair.breakdown as any).status as 'in_progress' | 'under_repair' | 'completed',
              reporterName: (repair.technician as any)?.name || '알 수 없음',
              createdAt: repair.created_at,
              actionTaken: repair.action_taken,
            }))
        );
      }

      // 시간순으로 정렬하고 제한된 개수만 반환
      return activities
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('최근 활동 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 실시간 대시보드 데이터 구독
   */
  subscribeToDashboardUpdates(callback: () => void) {
    // breakdowns 테이블 변경 구독
    const breakdownsSubscription = supabase
      .channel('dashboard-breakdowns')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'breakdowns',
        },
        callback
      )
      .subscribe();

    // repairs 테이블 변경 구독
    const repairsSubscription = supabase
      .channel('dashboard-repairs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'repairs',
        },
        callback
      )
      .subscribe();

    // 구독 해제 함수 반환
    return () => {
      breakdownsSubscription.unsubscribe();
      repairsSubscription.unsubscribe();
    };
  }
}

export const dashboardService = new DashboardService();