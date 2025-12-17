import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { networkInterfaces } from 'os';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS 配置
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('Lourd Game API')
    .setDescription('Lourd Game Backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  // 获取本机 IP 地址
  const getLocalIP = () => {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
    return 'localhost';
  };

  const localIP = getLocalIP();
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Application is running on: http://${localIP}:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api`);
  console.log(`Swagger documentation: http://${localIP}:${port}/api`);
}
void bootstrap();
