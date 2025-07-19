import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { repairService } from '../services/RepairService';
import { breakdownService } from '@/domains/breakdown/services/BreakdownService';
import type { CreateRepairRequest, Repair } from '../types';

interface UseRepairCompletionReturn {
  completing: boolean;
  error: string | null;
  completeRepair: (repairData: CreateRepairRequest) => Promise<Repair>;
  clearError: () => void;
}

/**
 * 수리 완료 처리를 위한 통합 훅
 * - 수리 데이터 생성
 * - 고장 상태를 '수리 완료'로 업데이트
 * - 수리 완료 실시간 알림 발송
 */
export function useRepairCompletion(): UseRepairCompletionReturn {
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeRepair = useCallback(async (repairData: CreateRepairRequest): Promise<Repair> => {
    try {
      setCompleting(true);
      setError(null);

      // 1. 수리 기록 생성
      const repair = await repairService.createRepair(repairData);

      // 2. 고장 상태를 '수리 완료'로 업데이트
      await breakdownService.updateBreakdownStatus(repairData.breakdown_id, 'completed');

      // 3. 수리 완료 실시간 알림 발송
      await sendRepairCompletionNotification(repair);

      return repair;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '수리 완료 처리 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('수리 완료 처리 오류:', err);
      throw err;
    } finally {
      setCompleting(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    completing,
    error,
    completeRepair,
    clearError
  };
}

/**
 * 수리 완료 실시간 알림 발송
 */
async function sendRepairCompletionNotification(repair: Repair): Promise<void> {
  try {
    const channel = supabase.channel('repair-notifications');
    
    await channel.send({
      type: 'broadcast',
      event: 'repair-completed',
      payload: {
        repair_id: repair.id,
        breakdown_id: repair.breakdown_id,
        equipment_type: repair.breakdown?.equipment_type,
        equipment_number: repair.breakdown?.equipment_number,
        technician_name: repair.technician?.name,
        completed_at: repair.completed_at,
        total_cost: repair.total_cost,
        action_taken: repair.action_taken
      }
    });

    console.log('수리 완료 알림 발송 완료:', repair.id);
  } catch (error) {
    // 알림 발송 실패는 전체 프로세스를 중단시키지 않음
    console.error('수리 완료 알림 발송 실패:', error);
  }
}