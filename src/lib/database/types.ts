// Database service types following SOLID principles
// These interfaces define contracts for database operations

import { Database } from '../supabase';

// Extract table types for easier use
export type Tables = Database['public']['Tables'];
export type Plant = Tables['plants']['Row'];
export type User = Tables['users']['Row'];
export type Equipment = Tables['equipment']['Row'];
export type Breakdown = Tables['breakdowns']['Row'];
export type BreakdownAttachment = Tables['breakdown_attachments']['Row'];
export type Repair = Tables['repairs']['Row'];
export type RepairPart = Tables['repair_parts']['Row'];
export type DashboardStats = Tables['dashboard_stats']['Row'];

// Insert types
export type PlantInsert = Tables['plants']['Insert'];
export type UserInsert = Tables['users']['Insert'];
export type EquipmentInsert = Tables['equipment']['Insert'];
export type BreakdownInsert = Tables['breakdowns']['Insert'];
export type BreakdownAttachmentInsert = Tables['breakdown_attachments']['Insert'];
export type RepairInsert = Tables['repairs']['Insert'];
export type RepairPartInsert = Tables['repair_parts']['Insert'];

// Update types
export type PlantUpdate = Tables['plants']['Update'];
export type UserUpdate = Tables['users']['Update'];
export type EquipmentUpdate = Tables['equipment']['Update'];
export type BreakdownUpdate = Tables['breakdowns']['Update'];
export type BreakdownAttachmentUpdate = Tables['breakdown_attachments']['Update'];
export type RepairUpdate = Tables['repairs']['Update'];
export type RepairPartUpdate = Tables['repair_parts']['Update'];

// Extended types with relationships
export type BreakdownWithDetails = Breakdown & {
  equipment?: Equipment;
  reporter?: User;
  attachments?: BreakdownAttachment[];
  repairs?: (Repair & {
    technician?: User;
    parts?: RepairPart[];
  })[];
};

export type RepairWithDetails = Repair & {
  breakdown?: Breakdown;
  technician?: User;
  parts?: RepairPart[];
};

export type EquipmentWithStats = Equipment & {
  breakdown_count?: number;
  last_breakdown?: string;
  total_repair_cost?: number;
};

// Query filter types
export interface BreakdownFilters {
  plant_id?: string;
  equipment_id?: string;
  status?: Breakdown['status'];
  reporter_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface RepairFilters {
  plant_id?: string;
  breakdown_id?: string;
  technician_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface EquipmentFilters {
  plant_id?: string;
  equipment_type?: string;
  status?: Equipment['status'];
  search?: string;
}

// Pagination types
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Repository interfaces following Interface Segregation Principle
export interface IReadRepository<T, TFilters = Record<string, unknown>> {
  findById(id: string): Promise<T | null>;
  findMany(filters?: TFilters, pagination?: PaginationOptions): Promise<PaginatedResult<T>>;
  count(filters?: TFilters): Promise<number>;
}

export interface IWriteRepository<T, TInsert, TUpdate> {
  create(data: TInsert): Promise<T>;
  update(id: string, data: TUpdate): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface IRepository<T, TInsert, TUpdate, TFilters = Record<string, unknown>>
  extends IReadRepository<T, TFilters>, IWriteRepository<T, TInsert, TUpdate> {}

// Specific repository interfaces
export interface IPlantRepository extends IRepository<Plant, PlantInsert, PlantUpdate> {
  findByUserId(userId: string): Promise<Plant | null>;
}

export interface IUserRepository extends IRepository<User, UserInsert, UserUpdate> {
  findByEmail(email: string): Promise<User | null>;
  findByPlantId(plantId: string): Promise<User[]>;
}

export interface IEquipmentRepository extends IRepository<Equipment, EquipmentInsert, EquipmentUpdate, EquipmentFilters> {
  findByPlantId(plantId: string): Promise<Equipment[]>;
  findByEquipmentNumber(equipmentNumber: string, plantId: string): Promise<Equipment | null>;
  findWithStats(filters?: EquipmentFilters): Promise<EquipmentWithStats[]>;
}

export interface IBreakdownRepository extends IRepository<Breakdown, BreakdownInsert, BreakdownUpdate, BreakdownFilters> {
  findWithDetails(id: string): Promise<BreakdownWithDetails | null>;
  findManyWithDetails(filters?: BreakdownFilters, pagination?: PaginationOptions): Promise<PaginatedResult<BreakdownWithDetails>>;
  findByEquipmentId(equipmentId: string): Promise<Breakdown[]>;
  updateStatus(id: string, status: Breakdown['status']): Promise<Breakdown>;
}

export interface IBreakdownAttachmentRepository extends IRepository<BreakdownAttachment, BreakdownAttachmentInsert, BreakdownAttachmentUpdate> {
  findByBreakdownId(breakdownId: string): Promise<BreakdownAttachment[]>;
  deleteByBreakdownId(breakdownId: string): Promise<void>;
}

export interface IRepairRepository extends IRepository<Repair, RepairInsert, RepairUpdate, RepairFilters> {
  findWithDetails(id: string): Promise<RepairWithDetails | null>;
  findManyWithDetails(filters?: RepairFilters, pagination?: PaginationOptions): Promise<PaginatedResult<RepairWithDetails>>;
  findByBreakdownId(breakdownId: string): Promise<Repair[]>;
}

export interface IRepairPartRepository extends IRepository<RepairPart, RepairPartInsert, RepairPartUpdate> {
  findByRepairId(repairId: string): Promise<RepairPart[]>;
  deleteByRepairId(repairId: string): Promise<void>;
  bulkCreate(parts: RepairPartInsert[]): Promise<RepairPart[]>;
}

export interface IDashboardRepository {
  getStatsByPlantId(plantId: string): Promise<DashboardStats | null>;
  refreshStats(): Promise<void>;
}

// Service interfaces following Dependency Inversion Principle
export interface IBreakdownService {
  createBreakdown(data: BreakdownInsert, attachments?: File[]): Promise<BreakdownWithDetails>;
  updateBreakdown(id: string, data: BreakdownUpdate): Promise<BreakdownWithDetails>;
  getBreakdown(id: string): Promise<BreakdownWithDetails | null>;
  getBreakdowns(filters?: BreakdownFilters, pagination?: PaginationOptions): Promise<PaginatedResult<BreakdownWithDetails>>;
  deleteBreakdown(id: string): Promise<void>;
}

export interface IRepairService {
  createRepair(data: RepairInsert, parts?: RepairPartInsert[]): Promise<RepairWithDetails>;
  updateRepair(id: string, data: RepairUpdate, parts?: RepairPartInsert[]): Promise<RepairWithDetails>;
  getRepair(id: string): Promise<RepairWithDetails | null>;
  getRepairs(filters?: RepairFilters, pagination?: PaginationOptions): Promise<PaginatedResult<RepairWithDetails>>;
  deleteRepair(id: string): Promise<void>;
}

export interface IEquipmentService {
  createEquipment(data: EquipmentInsert): Promise<Equipment>;
  updateEquipment(id: string, data: EquipmentUpdate): Promise<Equipment>;
  getEquipment(id: string): Promise<Equipment | null>;
  getEquipments(filters?: EquipmentFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Equipment>>;
  getEquipmentsWithStats(filters?: EquipmentFilters): Promise<EquipmentWithStats[]>;
  deleteEquipment(id: string): Promise<void>;
}

export interface IDashboardService {
  getDashboardStats(plantId: string): Promise<DashboardStats | null>;
  getRecentBreakdowns(plantId: string, limit?: number): Promise<BreakdownWithDetails[]>;
  getRecentRepairs(plantId: string, limit?: number): Promise<RepairWithDetails[]>;
}

// File storage interface
export interface IFileStorageService {
  uploadFile(file: File, path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
  getFileUrl(path: string): Promise<string>;
}

// Filter types
export interface BreakdownFilters extends Record<string, unknown> {
  plant_id?: string;
  equipment_id?: string;
  status?: Breakdown['status'];
  reporter_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface RepairFilters extends Record<string, unknown> {
  breakdown_id?: string;
  technician_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface EquipmentFilters extends Record<string, unknown> {
  plant_id?: string;
  equipment_type?: string;
  status?: Equipment['status'];
  search?: string;
}

// Error types
export class DatabaseError extends Error {
  constructor(message: string, public code?: string, public details?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}