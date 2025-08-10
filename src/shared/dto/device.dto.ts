import { IsString, IsOptional, IsNotEmpty, IsBoolean, MaxLength, IsIP } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  macAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;
}

export class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  type?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  branchId?: string;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  macAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class DeviceResponseDto {
  id: string;
  organizationId: string;
  branchId: string;
  name: string;
  type: string;
  ipAddress?: string;
  macAddress?: string;
  model?: string;
  status: string;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class DeviceCommandDto {
  @IsString()
  @IsNotEmpty()
  command: string;

  @IsOptional()
  parameters?: Record<string, any>;

  @IsOptional()
  timeout?: number;
}

export class DeviceDiscoveryResponseDto {
  totalDiscovered: number;
  newDevices: number;
  existingDevices: number;
  devices: Array<{
    identifier: string;
    name: string;
    type: string;
    ipAddress?: string;
    status: string;
  }>;
}