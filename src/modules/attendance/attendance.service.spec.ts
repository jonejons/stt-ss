import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceRepository } from './attendance.repository';
import { LoggerService } from '../../core/logger/logger.service';
import { CreateAttendanceDto } from '../../shared/dto';
import { DataScope } from '../../shared/interfaces';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceRepository: jest.Mocked<AttendanceRepository>;
  let loggerService: jest.Mocked<LoggerService>;

  const mockDataScope: DataScope = {
    organizationId: 'org-123',
    branchIds: ['branch-123'],
  };

  const mockAttendanceRecord = {
    id: 'attendance-123',
    organizationId: 'org-123',
    branchId: 'branch-123',
    employeeId: 'emp-123',
    guestId: null,
    deviceId: 'device-123',
    eventType: 'CHECK_IN',
    timestamp: new Date('2024-01-15T09:00:00Z'),
    meta: { location: 'main_entrance' },
    createdAt: new Date(),
    employee: {
      id: 'emp-123',
      firstName: 'John',
      lastName: 'Doe',
      employeeCode: 'EMP001',
    },
  };

  beforeEach(async () => {
    const mockAttendanceRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      findLastAttendanceForEmployee: jest.fn(),
      delete: jest.fn(),
      getAttendanceStats: jest.fn(),
      getAttendanceByDateRange: jest.fn(),
    };

    const mockLoggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: AttendanceRepository,
          useValue: mockAttendanceRepository,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    attendanceRepository = module.get(AttendanceRepository);
    loggerService = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAttendanceRecord', () => {
    it('should create an attendance record successfully', async () => {
      const createDto: CreateAttendanceDto = {
        employeeId: 'emp-123',
        deviceId: 'device-123',
        eventType: 'CHECK_IN',
        timestamp: new Date('2024-01-15T09:00:00Z'),
        organizationId: 'org-123',
        branchId: 'branch-123',
        metadata: { location: 'main_entrance' },
      };

      attendanceRepository.create.mockResolvedValue(mockAttendanceRecord as any);

      const result = await service.createAttendanceRecord(createDto, mockDataScope);

      expect(attendanceRepository.create).toHaveBeenCalledWith(createDto, mockDataScope);
      expect(loggerService.log).toHaveBeenCalledWith('Attendance record created', expect.any(Object));
      expect(result).toEqual(mockAttendanceRecord);
    });

    it('should handle errors and log them', async () => {
      const createDto: CreateAttendanceDto = {
        employeeId: 'emp-123',
        deviceId: 'device-123',
        eventType: 'CHECK_IN',
        timestamp: new Date('2024-01-15T09:00:00Z'),
        organizationId: 'org-123',
        branchId: 'branch-123',
        metadata: { location: 'main_entrance' },
      };

      const error = new Error('Database error');
      attendanceRepository.create.mockRejectedValue(error);

      await expect(service.createAttendanceRecord(createDto, mockDataScope)).rejects.toThrow('Database error');
      expect(loggerService.error).toHaveBeenCalledWith('Failed to create attendance record', error, expect.any(Object));
    });
  });

  describe('getLastAttendanceForEmployee', () => {
    it('should return the last attendance record for an employee', async () => {
      const date = new Date('2024-01-15');
      attendanceRepository.findLastAttendanceForEmployee.mockResolvedValue(mockAttendanceRecord as any);

      const result = await service.getLastAttendanceForEmployee('emp-123', date, mockDataScope);

      expect(attendanceRepository.findLastAttendanceForEmployee).toHaveBeenCalledWith('emp-123', date, mockDataScope);
      expect(result).toEqual(mockAttendanceRecord);
    });
  });

  describe('getAttendanceRecords', () => {
    it('should return attendance records with filters', async () => {
      const filters = {
        employeeId: 'emp-123',
        branchId: 'branch-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      attendanceRepository.findMany.mockResolvedValue([mockAttendanceRecord] as any);

      const result = await service.getAttendanceRecords(filters, mockDataScope);

      expect(attendanceRepository.findMany).toHaveBeenCalledWith(filters, mockDataScope);
      expect(result).toEqual([mockAttendanceRecord]);
    });
  });

  describe('getAttendanceById', () => {
    it('should return attendance record by ID', async () => {
      attendanceRepository.findById.mockResolvedValue(mockAttendanceRecord as any);

      const result = await service.getAttendanceById('attendance-123', mockDataScope);

      expect(attendanceRepository.findById).toHaveBeenCalledWith('attendance-123', mockDataScope);
      expect(result).toEqual(mockAttendanceRecord);
    });

    it('should throw NotFoundException when record not found', async () => {
      attendanceRepository.findById.mockResolvedValue(null);

      await expect(service.getAttendanceById('attendance-123', mockDataScope)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAttendanceSummary', () => {
    it('should calculate attendance summary correctly', async () => {
      const checkInRecord = {\n        ...mockAttendanceRecord,\n        eventType: 'CHECK_IN',\n        timestamp: new Date('2024-01-15T09:00:00Z'),\n      };\n      const checkOutRecord = {\n        ...mockAttendanceRecord,\n        id: 'attendance-124',\n        eventType: 'CHECK_OUT',\n        timestamp: new Date('2024-01-15T17:00:00Z'),\n      };\n\n      attendanceRepository.findMany.mockResolvedValue([checkInRecord, checkOutRecord] as any);\n\n      const result = await service.getAttendanceSummary(\n        'emp-123',\n        new Date('2024-01-01'),\n        new Date('2024-01-31'),\n        mockDataScope,\n      );\n\n      expect(result.employeeId).toBe('emp-123');\n      expect(result.totalHours).toBe(8);\n      expect(result.presentDays).toBe(1);\n      expect(result.dailySummary).toHaveLength(1);\n      expect(result.dailySummary[0].status).toBe('present');\n      expect(result.dailySummary[0].totalHours).toBe(8);\n    });\n\n    it('should handle partial days (check-in without check-out)', async () => {\n      const checkInRecord = {\n        ...mockAttendanceRecord,\n        eventType: 'CHECK_IN',\n        timestamp: new Date('2024-01-15T09:00:00Z'),\n      };\n\n      attendanceRepository.findMany.mockResolvedValue([checkInRecord] as any);\n\n      const result = await service.getAttendanceSummary(\n        'emp-123',\n        new Date('2024-01-01'),\n        new Date('2024-01-31'),\n        mockDataScope,\n      );\n\n      expect(result.partialDays).toBe(1);\n      expect(result.presentDays).toBe(0);\n      expect(result.dailySummary[0].status).toBe('partial');\n    });\n  });\n\n  describe('deleteAttendanceRecord', () => {\n    it('should delete attendance record successfully', async () => {\n      attendanceRepository.findById.mockResolvedValue(mockAttendanceRecord as any);\n      attendanceRepository.delete.mockResolvedValue(undefined);\n\n      await service.deleteAttendanceRecord('attendance-123', mockDataScope);\n\n      expect(attendanceRepository.findById).toHaveBeenCalledWith('attendance-123', mockDataScope);\n      expect(attendanceRepository.delete).toHaveBeenCalledWith('attendance-123', mockDataScope);\n      expect(loggerService.log).toHaveBeenCalledWith('Attendance record deleted', expect.any(Object));\n    });\n\n    it('should throw NotFoundException when record not found', async () => {\n      attendanceRepository.findById.mockResolvedValue(null);\n\n      await expect(service.deleteAttendanceRecord('attendance-123', mockDataScope)).rejects.toThrow(NotFoundException);\n    });\n  });\n\n  describe('getAttendanceStats', () => {\n    it('should return attendance statistics', async () => {\n      const mockStats = {\n        totalRecords: 100,\n        eventsByType: [\n          { eventType: 'CHECK_IN', count: 50 },\n          { eventType: 'CHECK_OUT', count: 50 },\n        ],\n        recordsByEmployee: [\n          { employeeId: 'emp-123', employeeName: 'John Doe (EMP001)', count: 20 },\n        ],\n      };\n\n      attendanceRepository.getAttendanceStats.mockResolvedValue(mockStats);\n\n      const result = await service.getAttendanceStats({}, mockDataScope);\n\n      expect(attendanceRepository.getAttendanceStats).toHaveBeenCalledWith({}, mockDataScope);\n      expect(result).toEqual(mockStats);\n    });\n  });\n\n  describe('getDailyAttendanceReport', () => {\n    it('should generate daily attendance report', async () => {\n      const date = new Date('2024-01-15');\n      const checkInRecord = {\n        ...mockAttendanceRecord,\n        eventType: 'CHECK_IN',\n        timestamp: new Date('2024-01-15T09:00:00Z'),\n      };\n      const checkOutRecord = {\n        ...mockAttendanceRecord,\n        id: 'attendance-124',\n        eventType: 'CHECK_OUT',\n        timestamp: new Date('2024-01-15T17:00:00Z'),\n      };\n\n      attendanceRepository.findMany.mockResolvedValue([checkInRecord, checkOutRecord] as any);\n\n      const result = await service.getDailyAttendanceReport(date, 'branch-123', mockDataScope);\n\n      expect(result.date).toEqual(date);\n      expect(result.branchId).toBe('branch-123');\n      expect(result.totalEmployees).toBe(1);\n      expect(result.presentEmployees).toBe(1);\n      expect(result.employeeDetails).toHaveLength(1);\n      expect(result.employeeDetails[0].status).toBe('present');\n      expect(result.employeeDetails[0].totalHours).toBe(8);\n    });\n\n    it('should handle employees with only check-in', async () => {\n      const date = new Date('2024-01-15');\n      const checkInRecord = {\n        ...mockAttendanceRecord,\n        eventType: 'CHECK_IN',\n        timestamp: new Date('2024-01-15T09:00:00Z'),\n      };\n\n      attendanceRepository.findMany.mockResolvedValue([checkInRecord] as any);\n\n      const result = await service.getDailyAttendanceReport(date, 'branch-123', mockDataScope);\n\n      expect(result.partialEmployees).toBe(1);\n      expect(result.employeeDetails[0].status).toBe('partial');\n    });\n  });\n\n  describe('getWeeklyAttendanceReport', () => {\n    it('should generate weekly attendance report', async () => {\n      const startDate = new Date('2024-01-15');\n      \n      // Mock the getDailyAttendanceReport method\n      jest.spyOn(service, 'getDailyAttendanceReport').mockResolvedValue({\n        date: new Date('2024-01-15'),\n        branchId: 'branch-123',\n        totalEmployees: 10,\n        presentEmployees: 8,\n        partialEmployees: 1,\n        absentEmployees: 1,\n        totalHours: 64,\n        averageHours: 8,\n        employeeDetails: [],\n      });\n\n      const result = await service.getWeeklyAttendanceReport(startDate, 'branch-123', mockDataScope);\n\n      expect(result.startDate).toEqual(startDate);\n      expect(result.branchId).toBe('branch-123');\n      expect(result.dailyReports).toHaveLength(7);\n      expect(result.totalHours).toBeGreaterThan(0);\n    });\n  });\n\n  describe('getMonthlyAttendanceReport', () => {\n    it('should generate monthly attendance report', async () => {\n      const year = 2024;\n      const month = 1;\n      const attendanceRecords = [\n        {\n          ...mockAttendanceRecord,\n          timestamp: new Date('2024-01-15T09:00:00Z'),\n        },\n        {\n          ...mockAttendanceRecord,\n          id: 'attendance-124',\n          timestamp: new Date('2024-01-16T09:00:00Z'),\n        },\n      ];\n\n      attendanceRepository.findMany.mockResolvedValue(attendanceRecords as any);\n\n      const result = await service.getMonthlyAttendanceReport(year, month, 'branch-123', mockDataScope);\n\n      expect(result.year).toBe(year);\n      expect(result.month).toBe(month);\n      expect(result.branchId).toBe('branch-123');\n      expect(result.totalEmployees).toBe(1);\n      expect(result.employeeReports).toHaveLength(1);\n    });\n  });\n});"