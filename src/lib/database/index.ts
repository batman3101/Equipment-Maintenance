// Database module exports
// Provides clean interface for database operations following SOLID principles

// Type exports
export type {
  // Core types
  Tables,
  Plant,
  User,
  Equipment,
  Breakdown,
  BreakdownAttachment,
  Repair,
  RepairPart,
  DashboardStats,
  
  // Insert types
  PlantInsert,
  UserInsert,
  EquipmentInsert,
  BreakdownInsert,
  BreakdownAttachmentInsert,
  RepairInsert,
  RepairPartInsert,
  
  // Update types
  PlantUpdate,
  UserUpdate,
  EquipmentUpdate,
  BreakdownUpdate,
  BreakdownAttachmentUpdate,
  RepairUpdate,
  RepairPartUpdate,
  
  // Extended types
  BreakdownWithDetails,
  RepairWithDetails,
  EquipmentWithStats,
  
  // Filter types
  BreakdownFilters,
  RepairFilters,
  EquipmentFilters,
  
  // Pagination types
  PaginationOptions,
  PaginatedResult,
  
  // Repository interfaces
  IReadRepository,
  IWriteRepository,
  IRepository,
  IPlantRepository,
  IUserRepository,
  IEquipmentRepository,
  IBreakdownRepository,
  IBreakdownAttachmentRepository,
  IRepairRepository,
  IRepairPartRepository,
  IDashboardRepository,
  
  // Service interfaces
  IBreakdownService,
  IRepairService,
  IEquipmentService,
  IDashboardService,
  IFileStorageService,
  
  // Error types
  DatabaseError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from './types';

// Repository exports
export { BaseRepository } from './base-repository';
export { BreakdownRepository } from './repositories/breakdown-repository';

// Factory exports
export { 
  DatabaseFactory, 
  createDatabaseFactory, 
  databaseFactory,
  breakdownRepository,
  // repairRepository,
  // equipmentRepository,
  // dashboardRepository,
  // breakdownService,
  // repairService,
  // equipmentService,
  // dashboardService,
} from './database-factory';

// Convenience re-exports from main supabase module
export { supabase } from '../supabase';
// Database 타입 정의 (Supabase 타입 정의 파일이 없는 경우 대체)
export type Database = any;