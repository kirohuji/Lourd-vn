import type { LoginResponseDto, WechatLoginDto } from '@lourd-game/shared';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('wechat/login')
  @ApiOperation({ summary: '微信登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  async wechatLogin(@Body() dto: WechatLoginDto): Promise<LoginResponseDto> {
    return this.authService.wechatLogin(dto);
  }
}
