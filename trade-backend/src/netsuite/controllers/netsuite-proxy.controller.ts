import { Controller, Post, Body, Res } from '@nestjs/common';
import axios from 'axios';
import type { Response } from 'express';

@Controller('proxy/netsuite')
export class NetsuiteProxyController {
  @Post('token')
  async proxyToken(@Body() body: any, @Res() res: Response) {
    try {
      const url = 'https://7548958-sb1.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token';

      const client_id     = body.client_id     || process.env.NETSUITE_CLIENT_ID     || '';
      const client_secret = body.client_secret || process.env.NETSUITE_CLIENT_SECRET || '';
      const grant_type    = body.grant_type    || 'client_credentials';

      console.log('Proxying NetSuite token request with client_id:', client_id ? '***set***' : 'EMPTY');

      const params = new URLSearchParams();
      params.append('grant_type',    grant_type);
      params.append('client_id',     client_id);
      params.append('client_secret', client_secret);

      const response = await axios.post(url, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      res.status(response.status).json(response.data);
    } catch (err: any) {
      console.error('NetSuite token error:', err?.response?.data || err?.message);
      res.status(err?.response?.status || 500).json({
        message: err?.response?.data || err?.message || 'Proxy error',
      });
    }
  }
}