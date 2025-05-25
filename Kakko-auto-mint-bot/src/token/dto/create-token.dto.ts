import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTokenDto {
  @ApiProperty({ description: 'Token name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Token symbol' })
  @IsString()
  symbol: string;

  @ApiProperty({ description: 'Token description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Migration target' })
  @IsOptional()
  @IsString()
  migrationTarget?: string;

  @ApiPropertyOptional({ description: 'Twitter link' })
  @IsOptional()
  @IsUrl()
  twitterLink?: string;

  @ApiPropertyOptional({ description: 'Telegram link' })
  @IsOptional()
  @IsUrl()
  telegramLink?: string;

  @ApiPropertyOptional({ description: 'Website link' })
  @IsOptional()
  @IsUrl()
  websiteLink?: string;
} 