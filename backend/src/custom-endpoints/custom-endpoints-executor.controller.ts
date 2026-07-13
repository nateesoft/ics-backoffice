import { All, Body, Controller, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { HttpMethod } from './entities/custom-endpoint.entity';
import { CustomEndpointsService } from './custom-endpoints.service';

@Controller('api/v2')
export class CustomEndpointsExecutorController {
  constructor(
    private readonly customEndpointsService: CustomEndpointsService,
  ) {}

  @All('*splat')
  async handle(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Param('splat') splat: string | string[],
    @Body() body: Record<string, unknown>,
  ) {
    const subPath = Array.isArray(splat) ? splat.join('/') : (splat ?? '');
    const { status, data } = await this.customEndpointsService.execute(
      req.method as HttpMethod,
      subPath,
      body ?? {},
      req.headers.authorization,
      {
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
      },
    );
    res.status(status);
    return data;
  }
}
