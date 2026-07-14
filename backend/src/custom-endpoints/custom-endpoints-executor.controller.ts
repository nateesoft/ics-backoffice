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
    // GET requests carry no body — let 'findBy'/'validate' (and any future GET-configured action
    // that reads inputMapping) read their fields from the query string instead, e.g.
    // GET /api/v2/users/find?email=foo@bar.com.
    const effectiveBody =
      req.method === 'GET'
        ? { ...(req.query as Record<string, unknown>), ...(body ?? {}) }
        : (body ?? {});
    const { status, data } = await this.customEndpointsService.execute(
      req.method as HttpMethod,
      subPath,
      effectiveBody,
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
