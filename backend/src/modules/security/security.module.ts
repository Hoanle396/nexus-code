import { Module } from '@nestjs/common';
import { SecurityScannerService } from './security-scanner.service';

@Module({
  providers: [SecurityScannerService],
  exports: [SecurityScannerService],
})
export class SecurityModule {}
