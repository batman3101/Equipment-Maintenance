// Database factory following SOLID principles
// Creates and manages database service instances with proper dependency injection

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../supabase';
import { supabase } from '../supabase';

// Repository imports
import { BreakdownRepository } from './repositories/breakdown-repository';

// Service imports (to be created)
// import { BreakdownService } from './services/breakdown-service';
// import { RepairService } from './services/repair-service';
// import { EquipmentService } from './services/equipment-service';
// import { DashboardService } from './services/dashboard-service';

// Type imports
import {
  IBreakdownRepository,
  // IRepairRepository,
  // IEquipmentRepository,
  // IDashboardRepository,
  // IBreakdownService,
  // IRepairService,
  // IEquipmentService,
  // IDashboardService,
} from './types';

/**
 * Database factory class following the Factory pattern and Dependency Inversion Principle
 * Provides centralized creation and management of database services and repositories
 */
export class DatabaseFactory {
  private static instance: DatabaseFactory;
  private supabaseClient: SupabaseClient<Database>;

  // Repository instances (lazy-loaded)
  private _breakdownRepository?: IBreakdownRepository;
  // private _repairRepository?: IRepairRepository;
  // private _equipmentRepository?: IEquipmentRepository;
  // private _dashboardRepository?: IDashboardRepository;

  // Service instances (lazy-loaded)
  // private _breakdownService?: IBreakdownService;
  // private _repairService?: IRepairService;
  // private _equipmentService?: IEquipmentService;
  // private _dashboardService?: IDashboardService;

  private constructor(supabaseClient?: SupabaseClient<Database>) {
    this.supabaseClient = supabaseClient || supabase;
  }

  /**
   * Get singleton instance of DatabaseFactory
   * Follows Singleton pattern for consistent database connections
   */
  public static getInstance(supabaseClient?: SupabaseClient<Database>): DatabaseFactory {
    if (!DatabaseFactory.instance) {
      DatabaseFactory.instance = new DatabaseFactory(supabaseClient);
    }
    return DatabaseFactory.instance;
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    DatabaseFactory.instance = undefined as any;
  }

  // Repository getters (lazy-loaded for performance)
  public get breakdownRepository(): IBreakdownRepository {
    if (!this._breakdownRepository) {
      this._breakdownRepository = new BreakdownRepository(this.supabaseClient);
    }
    return this._breakdownRepository;
  }

  // Uncomment as repositories are implemented
  // public get repairRepository(): IRepairRepository {
  //   if (!this._repairRepository) {
  //     this._repairRepository = new RepairRepository(this.supabaseClient);
  //   }
  //   return this._repairRepository;
  // }

  // public get equipmentRepository(): IEquipmentRepository {
  //   if (!this._equipmentRepository) {
  //     this._equipmentRepository = new EquipmentRepository(this.supabaseClient);
  //   }
  //   return this._equipmentRepository;
  // }

  // public get dashboardRepository(): IDashboardRepository {
  //   if (!this._dashboardRepository) {
  //     this._dashboardRepository = new DashboardRepository(this.supabaseClient);
  //   }
  //   return this._dashboardRepository;
  // }

  // Service getters (lazy-loaded and with dependency injection)
  // public get breakdownService(): IBreakdownService {
  //   if (!this._breakdownService) {
  //     this._breakdownService = new BreakdownService(
  //       this.breakdownRepository,
  //       this.equipmentRepository,
  //       // file storage service would be injected here
  //     );
  //   }
  //   return this._breakdownService;
  // }

  // public get repairService(): IRepairService {
  //   if (!this._repairService) {
  //     this._repairService = new RepairService(
  //       this.repairRepository,
  //       this.breakdownRepository
  //     );
  //   }
  //   return this._repairService;
  // }

  // public get equipmentService(): IEquipmentService {
  //   if (!this._equipmentService) {
  //     this._equipmentService = new EquipmentService(
  //       this.equipmentRepository
  //     );
  //   }
  //   return this._equipmentService;
  // }

  // public get dashboardService(): IDashboardService {
  //   if (!this._dashboardService) {
  //     this._dashboardService = new DashboardService(
  //       this.dashboardRepository,
  //       this.breakdownRepository,
  //       this.repairRepository
  //     );
  //   }
  //   return this._dashboardService;
  // }

  /**
   * Get the underlying Supabase client
   * Useful for direct database operations when needed
   */
  public getSupabaseClient(): SupabaseClient<Database> {
    return this.supabaseClient;
  }

  /**
   * Test database connection
   * Useful for health checks and initialization
   */
  public async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.supabaseClient
        .from('plants')
        .select('id')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Close database connections (if needed)
   * Useful for cleanup in tests or application shutdown
   */
  public async close(): Promise<void> {
    // Supabase client doesn't require explicit closing
    // This method is here for interface consistency
    // and potential future cleanup needs
  }
}

/**
 * Convenience function to get database factory instance
 * Follows the Factory pattern for easy access
 */
export function createDatabaseFactory(
  supabaseClient?: SupabaseClient<Database>
): DatabaseFactory {
  return DatabaseFactory.getInstance(supabaseClient);
}

/**
 * Default database factory instance
 * Uses the default Supabase client configuration
 */
export const databaseFactory = createDatabaseFactory();

// Export individual repositories and services for direct use
export const breakdownRepository = databaseFactory.breakdownRepository;
// export const repairRepository = databaseFactory.repairRepository;
// export const equipmentRepository = databaseFactory.equipmentRepository;
// export const dashboardRepository = databaseFactory.dashboardRepository;

// export const breakdownService = databaseFactory.breakdownService;
// export const repairService = databaseFactory.repairService;
// export const equipmentService = databaseFactory.equipmentService;
// export const dashboardService = databaseFactory.dashboardService;