import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { TokenService } from './token.service';
import { CreateTokenDto } from './dto/create-token.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { validate } from 'class-validator';

@ApiTags('Token')
@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Post('auto-create')
  @ApiOperation({ summary: 'Automated token creation' })
  @ApiResponse({ status: 201, description: 'Token creation process triggered' })
  @ApiBody({ type: CreateTokenDto })
  async autoCreate(@Body() params: CreateTokenDto) {
    // Manual parameter validation (optional, global ValidationPipe is available)
    const errors = await validate(params);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
    return this.tokenService.autoCreateToken(params);
  }

  @Post('batch-auto-create')
  @ApiOperation({ summary: 'Batch automated token creation' })
  @ApiResponse({ status: 201, description: 'Batch token creation process triggered' })
  @ApiBody({ type: [CreateTokenDto] })
  async batchAutoCreate(@Body() paramsList: CreateTokenDto[]) {
    if (!Array.isArray(paramsList)) {
      throw new BadRequestException('Request body must be an array');
    }
    const results = [];
    for (const params of paramsList) {
      const errors = await validate(params);
      if (errors.length > 0) {
        results.push({ success: false, errors });
        continue;
      }
      try {
        const res = await this.tokenService.autoCreateToken(params);
        results.push(res);
      } catch (e) {
        results.push({ success: false, error: e.message });
      }
    }
    return results;
  }
} 