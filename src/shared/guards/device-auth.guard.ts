import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../core/logger/logger.service';

@Injectable()
export class DeviceAuthGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private readonly logger: LoggerService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // Get device authentication headers
        const deviceId = request.headers['x-device-id'];
        const signature = request.headers['x-device-signature'];
        const timestamp = request.headers['x-timestamp'];

        if (!deviceId) {
            this.logger.warn('Device authentication failed: Missing device ID', {
                ip: request.ip,
                userAgent: request.headers['user-agent'],
            });
            throw new UnauthorizedException('Device ID is required');
        }

        if (!signature) {
            this.logger.warn('Device authentication failed: Missing signature', {
                deviceId,
                ip: request.ip,
            });
            throw new UnauthorizedException('Device signature is required');
        }

        // Validate timestamp if provided (prevent replay attacks)
        if (timestamp) {
            const requestTime = new Date(timestamp);
            const now = new Date();
            const timeDiff = Math.abs(now.getTime() - requestTime.getTime());

            // Allow 5 minutes tolerance
            if (timeDiff > 5 * 60 * 1000) {
                this.logger.warn('Device authentication failed: Request too old', {
                    deviceId,
                    timestamp,
                    timeDiff,
                });
                throw new UnauthorizedException('Request timestamp is too old');
            }
        }

        // Basic signature validation (in real implementation, this would be more sophisticated)
        if (!this.isValidSignature(deviceId, signature, request.body, timestamp)) {
            this.logger.warn('Device authentication failed: Invalid signature', {
                deviceId,
                signature: `${signature.substring(0, 10)}...`,
            });
            throw new UnauthorizedException('Invalid device signature');
        }

        // Add device info to request for use in controllers
        request.device = {
            id: deviceId,
            signature,
            timestamp,
            authenticated: true,
        };

        this.logger.log('Device authenticated successfully', {
            deviceId,
            endpoint: request.url,
            method: request.method,
        });

        return true;
    }

    private isValidSignature(
        deviceId: string,
        signature: string,
        body: any,
        timestamp?: string
    ): boolean {
        // In a real implementation, this would:
        // 1. Look up the device's shared secret or public key
        // 2. Recreate the expected signature using the same algorithm
        // 3. Compare with the provided signature

        // For development/testing, allow signatures starting with 'dev-'
        if (signature.startsWith('dev-')) {
            return true;
        }

        // Mock validation - in production this would be much more secure
        const crypto = require('crypto');
        const payload = JSON.stringify({
            deviceId,
            body,
            timestamp,
        });

        const expectedSignature = crypto
            .createHash('sha256')
            .update(`${payload}mock-device-secret`)
            .digest('hex')
            .substring(0, 32);

        return signature === expectedSignature;
    }
}
