import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({ example: '+8801700000000', description: 'E.164 phone number' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'Phone must be E.164 format' })
  phone!: string;
}
