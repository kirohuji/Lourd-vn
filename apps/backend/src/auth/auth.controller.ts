import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { WechatLoginDto, LoginResponseDto } from '@lourd-game/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('wechat/login')
  @ApiOperation({ summary: '微信登录' })
  @ApiResponse({ status: 200, description: '登录成功', type: LoginResponseDto })
  async wechatLogin(@Body() dto: WechatLoginDto): Promise<LoginResponseDto> {
    return this.authService.wechatLogin(dto);
  }
}

