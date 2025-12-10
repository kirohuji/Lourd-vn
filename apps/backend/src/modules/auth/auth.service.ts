import {
  EmailLoginDto,
  JwtPayload,
  LoginResponseDto,
  UserRole,
  WechatLoginDto,
} from '@lourd-game/shared';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async wechatLogin(dto: WechatLoginDto): Promise<LoginResponseDto> {
    let userInfo: any;

    if (dto.type === 'miniprogram') {
      // 小程序登录
      userInfo = await this.wechatMiniProgramLogin(dto.code);
    } else {
      // 网页登录
      userInfo = await this.wechatWebLogin(dto.code);
    }

    // 查找或创建用户
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { wechatOpenId: userInfo.openid },
          { wechatUnionId: userInfo.unionid },
        ],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          wechatOpenId: userInfo.openid,
          wechatUnionId: userInfo.unionid,
          role: UserRole.USER,
        },
      });
    } else {
      // 更新 openid 和 unionid（如果之前没有）
      if (!user.wechatOpenId && userInfo.openid) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { wechatOpenId: userInfo.openid },
        });
      }
      if (!user.wechatUnionId && userInfo.unionid) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { wechatUnionId: userInfo.unionid },
        });
      }
    }

    // 生成 JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email || undefined,
      role: user.role as UserRole,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email || undefined,
        role: user.role as UserRole,
      },
    };
  }

  private async wechatWebLogin(code: string): Promise<any> {
    // 这里需要调用微信 API 获取 access_token 和用户信息
    // 由于需要实际的微信 AppID 和 Secret，这里提供一个示例实现
    const appId = process.env.WECHAT_APPID;
    const secret = process.env.WECHAT_SECRET;

    if (!appId || !secret) {
      throw new UnauthorizedException('WeChat configuration is missing');
    }

    // 1. 通过 code 获取 access_token
    const tokenResponse = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${secret}&code=${code}&grant_type=authorization_code`,
    );

    if (!tokenResponse.ok) {
      throw new UnauthorizedException('Failed to get WeChat access token');
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.errcode) {
      throw new UnauthorizedException(`WeChat API error: ${tokenData.errmsg}`);
    }

    // 2. 通过 access_token 获取用户信息
    const userInfoResponse = await fetch(
      `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`,
    );

    if (!userInfoResponse.ok) {
      throw new UnauthorizedException('Failed to get WeChat user info');
    }

    const userInfo = await userInfoResponse.json();

    if (userInfo.errcode) {
      throw new UnauthorizedException(`WeChat API error: ${userInfo.errmsg}`);
    }

    return {
      openid: tokenData.openid,
      unionid: tokenData.unionid || userInfo.unionid,
    };
  }

  private async wechatMiniProgramLogin(code: string): Promise<any> {
    const appId = process.env.WECHAT_MINI_PROGRAM_APPID;
    const secret = process.env.WECHAT_MINI_PROGRAM_SECRET;

    if (!appId || !secret) {
      throw new UnauthorizedException(
        'WeChat MiniProgram configuration is missing',
      );
    }

    // 小程序登录：通过 code 获取 openid 和 session_key
    const response = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`,
    );

    if (!response.ok) {
      throw new UnauthorizedException(
        'Failed to get WeChat MiniProgram session',
      );
    }

    const data = await response.json();

    if (data.errcode) {
      throw new UnauthorizedException(`WeChat API error: ${data.errmsg}`);
    }

    return {
      openid: data.openid,
      unionid: data.unionid,
      sessionKey: data.session_key,
    };
  }

  async emailLogin(dto: EmailLoginDto): Promise<LoginResponseDto> {
    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 检查是否有密码
    if (!user.password) {
      throw new UnauthorizedException('该用户未设置密码，请使用其他登录方式');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 允许 ADMIN 和 USER 角色登录
    // 生成 JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email || undefined,
      role: user.role as UserRole,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email || undefined,
        role: user.role as UserRole,
      },
    };
  }

  async validateUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
