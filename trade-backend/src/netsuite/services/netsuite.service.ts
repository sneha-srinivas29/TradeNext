// import { Injectable, Logger } from '@nestjs/common';
// import { HttpService } from '@nestjs/axios';
// import { ConfigService } from '@nestjs/config';
// import { firstValueFrom } from 'rxjs';
// import * as crypto from 'crypto';

// @Injectable()
// export class NetsuiteService {
//   private readonly logger = new Logger(NetsuiteService.name);

//   constructor(
//     private readonly http: HttpService,
//     private readonly config: ConfigService,
//   ) {}
  
//     /**
//    * CREATE PENALTY INVOICE
//    */
//   async createPenaltyInvoice(data: any): Promise<any> {
//     const url = this.config.get('netsuite.penaltyInvoiceRestletUrl');
//     const headers = this.getOAuth(url);

//     this.logger.log(`Creating penalty invoice from PNC: ${data.pncId}`);

//     try {
//       const response = await firstValueFrom(
//         this.http.post(url, data, { headers }),
//       );

//       if (response.data && response.data.success === false) {
//         this.logger.error(` NetSuite Error: ${response.data.error}`);
//         throw new Error(response.data.error || 'Penalty invoice creation failed');
//       }

//       return response.data;
//     } catch (error: any) {
//       this.logger.error(` Penalty Invoice RESTlet Error: ${error.message}`);
//       if (error.response) {
//         this.logger.error(`Response Status: ${error.response.status}`);
//         this.logger.error(`Response Data: ${JSON.stringify(error.response.data)}`);
//       }
//       throw new Error(error.response?.data?.error || error.message);
//     }
//   }

//   /**
//    * CREATE PENALTY BILL CREDIT
//    */
//   async createPenaltyBillCredit(data: any): Promise<any> {
//     const url = this.config.get('netsuite.penaltyBillCreditRestletUrl');
//     const headers = this.getOAuth(url);

//     this.logger.log(` Creating penalty bill credit from Bill Credit Doc: ${data.billCreditDocId}`);

//     try {
//       const response = await firstValueFrom(
//         this.http.post(url, data, { headers }),
//       );

//       if (response.data && response.data.success === false) {
//         this.logger.error(`NetSuite Error: ${response.data.error}`);
//         throw new Error(response.data.error || 'Penalty bill credit creation failed');
//       }

//       return response.data;
//     } catch (error: any) {
//       this.logger.error(`Penalty Bill Credit RESTlet Error: ${error.message}`);
//       if (error.response) {
//         this.logger.error(`Response Status: ${error.response.status}`);
//         this.logger.error(`Response Data: ${JSON.stringify(error.response.data)}`);
//       }
//       throw new Error(error.response?.data?.error || error.message);
//     }
//   }
//   // generate OAuth 1.0 signature and makes HTTP POST to Netsuite RESTlet
//   async updateInvoice(data: any): Promise<any> {
//     const url = this.config.get('netsuite.restletUrl');
//     const headers = this.getOAuth(url);

//     this.logger.log(` Calling RESTlet for Invoice: ${data.invoiceId}`);

//     try {
//       const response = await firstValueFrom(
//         this.http.post(url, { operation: 'updateInvoice', ...data }, { headers }),
//       );
//       return response.data;
//     } catch (error: any) {
//       this.logger.error(` RESTlet Error: ${error.message}`);
//       if (error.response) {
//         this.logger.error(` Response Status: ${error.response.status}`);
//         this.logger.error(` Response Data: ${JSON.stringify(error.response.data)}`);
//       }
//       throw new Error(error.response?.data?.error || error.message);
//     }
//   }

//   /**
//  * Create Penalty Invoice (Backend - Buyer Originated)
//  */
// async createBackendPenaltyInvoice(data: {
//   customer_id: string;
//   original_invoice_number: string;
//   penalty_amount: number;
//   period_from: string;
//   period_to: string;
//   utr_reference: string;
//   memo: string;
// }): Promise<any> {
//   const url = this.config.get('netsuite.penaltyInvoiceBackendRestletUrl');
//   const headers = this.getOAuth(url);

//   this.logger.log(` Creating backend penalty invoice for ${data.original_invoice_number}`);

//   try {
//     const response = await firstValueFrom(
//       this.http.post(url, data, { headers }),
//     );

//     if (response.data && response.data.success === false) {
//       this.logger.error(` NetSuite Error: ${response.data.error}`);
//       throw new Error(response.data.error || 'Backend penalty invoice creation failed');
//     }

//     return response.data;
//   } catch (error: any) {
//     this.logger.error(` Backend Penalty Invoice Error: ${error.message}`);
//     throw error;
//   }
// }

// /**
//  * Reconcile Payment with UTR (Customer Payment Apply)
//  */
// async reconcilePaymentWithUTR(data: {
//   custid: string;
//   paymentdate: string;
//   utrno: string;
//   memo: string;
//   amount: number;
//   invoices: Array<{
//     invoiceId: string;
//     amount: number;
//   }>;
//   skip_penalty_generation?: boolean;
//   penalty_handled_by_backend?: Array<{
//     invoice_id: string;
//     penalty_amount: number;
//     utr: string;
//   }>;
// }): Promise<any> {
//   const url = this.config.get('netsuite.reconciliationRestletUrl');
//   const headers = this.getOAuth(url);

//   this.logger.log(` Reconciling payment with UTR: ${data.utrno}`);

//   try {
//     const response = await firstValueFrom(
//       this.http.post(url, data, { headers }),
//     );

//     if (response.data && response.data.success === false) {
//       this.logger.error(` NetSuite Error: ${response.data.data?.message || response.data.error}`);
//       throw new Error(response.data.data?.message || 'Payment reconciliation failed');
//     }

//     return response.data;
//   } catch (error: any) {
//     this.logger.error(` Payment Reconciliation Error: ${error.message}`);
//     if (error.response) {
//       this.logger.error(`Response Status: ${error.response.status}`);
//       this.logger.error(`Response Data: ${JSON.stringify(error.response.data)}`);
//     }
//     throw error;
//   }
// }

// /**
//  * Create Penalty Bill Credit (Backend - Supplier Originated)
//  */
// async createBackendPenaltyBillCredit(data: {
//   vendor_id: string;
//   original_invoice_number: string;
//   penalty_amount: number;
//   period_from: string;
//   period_to: string;
//   utr_reference: string;
//   memo: string;
//   customer_id: string;
// }): Promise<any> {
//   const url = this.config.get('netsuite.penaltyBillCreditBackendRestletUrl');
//   const headers = this.getOAuth(url);

//   this.logger.log(`📤 Creating backend penalty bill credit for ${data.original_invoice_number}`);

//   try {
//     const response = await firstValueFrom(
//       this.http.post(url, data, { headers }),
//     );

//     if (response.data && response.data.success === false) {
//       this.logger.error(` NetSuite Error: ${response.data.error}`);
//       throw new Error(response.data.error || 'Backend penalty bill credit creation failed');
//     }

//     return response.data;
//   } catch (error: any) {
//     this.logger.error(` Backend Penalty Bill Credit Error: ${error.message}`);
//     throw error;
//   }
// }

//   /**
//  * MANAGE PENALTY OPERATIONS
//  * Operations: checkPNC, createPNC, checkPenaltyInvoice, createPenaltyInvoice, 
//  *             checkPenaltyBillCredit, createPenaltyBillCredit,
//  *             getInvoiceDetails, getBillDetails
//  */
// async managePenalty(data: any): Promise<any> {
//   const url = this.config.get('netsuite.penaltyRestletUrl');
//   const headers = this.getOAuth(url);

//   this.logger.log(`📤 Penalty operation: ${data.operation}`);

//   try {
//     const response = await firstValueFrom(
//       this.http.post(url, data, { headers }),
//     );

//     if (response.data && response.data.success === false) {
//       this.logger.error(` NetSuite Error: ${response.data.error}`);
//       throw new Error(response.data.error || 'NetSuite penalty operation failed');
//     }

//     return response.data;
//   } catch (error: any) {
//     this.logger.error(` Penalty RESTlet Error: ${error.message}`);
//     if (error.response) {
//       this.logger.error(`Response Status: ${error.response.status}`);
//       this.logger.error(`Response Data: ${JSON.stringify(error.response.data)}`);
//     }
//     throw new Error(error.response?.data?.error || error.message);
//   }
// }

//   private getOAuth(url: string): Record<string, string> {
//     const netsuite = this.config.get('netsuite');
    
//     // Debug logging
//     this.logger.debug(`🔍 URL: ${url}`);
//     this.logger.debug(`🔍 Account ID: ${netsuite?.accountId || 'MISSING'}`);
//     this.logger.debug(`🔍 Consumer Key: ${netsuite?.consumerKey || 'MISSING'}`);
//     this.logger.debug(`🔍 Token ID: ${netsuite?.tokenId || 'MISSING'}`);
//     this.logger.debug(`🔍 Consumer Secret exists: ${!!netsuite?.consumerSecret}`);
//     this.logger.debug(`🔍 Token Secret exists: ${!!netsuite?.tokenSecret}`);
    
//     const timestamp = Math.floor(Date.now() / 1000).toString();
//     const nonce = crypto.randomBytes(16).toString('hex');

//     const params = {
//       oauth_consumer_key: netsuite.consumerKey,
//       oauth_token: netsuite.tokenId,
//       oauth_signature_method: 'HMAC-SHA256',
//       oauth_timestamp: timestamp,
//       oauth_nonce: nonce,
//       oauth_version: '1.0',
//     };

//     this.logger.debug(`🔍 Timestamp: ${timestamp}`);
//     this.logger.debug(`🔍 Nonce: ${nonce}`);

//     const signature = this.generateSignature(url, params, netsuite.consumerSecret, netsuite.tokenSecret);

//     const authHeader = [
//       `realm="${netsuite.accountId}"`,
//       `oauth_consumer_key="${params.oauth_consumer_key}"`,
//       `oauth_token="${params.oauth_token}"`,
//       `oauth_signature_method="${params.oauth_signature_method}"`,
//       `oauth_timestamp="${params.oauth_timestamp}"`,
//       `oauth_nonce="${params.oauth_nonce}"`,
//       `oauth_version="${params.oauth_version}"`,
//       `oauth_signature="${encodeURIComponent(signature)}"`,
//     ].join(',');

//     this.logger.debug(`🔍 Auth Header: OAuth ${authHeader}`);

//     return {
//       'Authorization': `OAuth ${authHeader}`,
//       'Content-Type': 'application/json',
//     };
//   }

//   private generateSignature(
//     url: string,
//     params: Record<string, string>,
//     consumerSecret: string,
//     tokenSecret: string,
//   ): string {
//     // Split URL and query parameters
//     const [baseUrl, queryString] = url.split('?');
    
//     // Combine OAuth params with query params for signature
//     const allParams = { ...params };
//     if (queryString) {
//       queryString.split('&').forEach(param => {
//         const [key, value] = param.split('=');
//         allParams[key] = value;
//       });
//     }

//     const sortedParams = Object.keys(allParams)
//       .sort()
//       .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
//       .join('&');

//     this.logger.debug(`🔍 Sorted Params (with query): ${sortedParams}`);

//     const baseString = [
//       'POST',
//       encodeURIComponent(baseUrl),  // Use base URL only
//       encodeURIComponent(sortedParams),
//     ].join('&');

//     this.logger.debug(`🔍 Base String: ${baseString.substring(0, 200)}...`);

//     const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
    
//     const signature = crypto
//       .createHmac('sha256', signingKey)
//       .update(baseString)
//       .digest('base64');

//     this.logger.debug(`🔍 Signature: ${signature}`);
    
//     return signature;
//   }

// }


import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios, { AxiosRequestHeaders } from 'axios';
import * as crypto from 'crypto';
import * as forge from 'node-forge';
import OAuth from 'oauth-1.0a';
import Redis from 'ioredis';

const REDIS_TOKEN_KEY = 'netsuite:oauth2:token';

@Injectable()
export class NetsuiteService {
  private readonly logger = new Logger(NetsuiteService.name);

  /* ============================================================
     TOKEN STORAGE — Redis (if enabled) or memory fallback
  ============================================================ */
  private redis?: Redis;
  private redisEnabled = false;

  private memoryToken: string | null = null;
  private memoryExpiry = 0; // unix timestamp

  /* ============================================================
     OAUTH 1.0a
  ============================================================ */
  private readonly oauth: OAuth;

  constructor() {
    /* ---------- OAuth 1.0a ---------- */
    this.oauth = new OAuth({
      consumer: {
        key:    process.env.NETSUITE_CONSUMER_KEY    || '',
        secret: process.env.NETSUITE_CONSUMER_SECRET || '',
      },
      signature_method: 'HMAC-SHA256',
      hash_function(baseString, key) {
        return crypto.createHmac('sha256', key).update(baseString).digest('base64');
      },
    });

    /* ---------- Redis (OPTIONAL) ----------
       Only initialised when USE_REDIS=true in .env.
       App works without Redis — falls back to in-memory cache.
    ---------------------------------------- */
    if (process.env.USE_REDIS === 'true') {
      try {
        this.redis = new Redis({
          host:        process.env.REDIS_HOST     || 'localhost',
          port:        Number(process.env.REDIS_PORT || 6379),
          password:    process.env.REDIS_PASSWORD  || undefined,
          lazyConnect: true,
        });

        // Suppress ioredis internal error spam
        this.redis.on('error', () => {});

        this.redis
          .connect()
          .then(() => {
            this.redisEnabled = true;
            this.logger.log('✅ Redis connected — token cache enabled');
          })
          .catch(() => {
            this.logger.warn('⚠️  Redis unavailable — falling back to memory cache');
          });

      } catch {
        this.logger.warn('⚠️  Redis init failed — using memory cache');
      }
    } else {
      this.logger.log(
        'ℹ️  Redis disabled — using in-memory token cache. Set USE_REDIS=true in .env to enable Redis.'
      );
    }
  }

  /* ============================================================
     PRIVATE KEY HELPERS
  ============================================================ */

  private normalizePemKey(raw: string): string {
    return raw?.replace(/\r/g, '').trim();
  }

  private parsePrivateKey(pem: string): forge.pki.PrivateKey {
    if (!pem.includes('BEGIN PRIVATE KEY')) {
      throw new Error('NetSuite requires a PKCS#8 private key (BEGIN PRIVATE KEY)');
    }

    if (pem.includes('ENCRYPTED')) {
      const passphrase = process.env.NETSUITE_CERTIFICATE_PASSPHRASE || '';
      if (!passphrase) {
        throw new Error(
          'Encrypted private key found but NETSUITE_CERTIFICATE_PASSPHRASE is missing in .env'
        );
      }
      const decrypted = forge.pki.decryptRsaPrivateKey(pem, passphrase);
      if (!decrypted) {
        throw new Error('Failed to decrypt private key — check your passphrase');
      }
      return decrypted;
    }

    return forge.pki.privateKeyFromPem(pem);
  }

  /* ============================================================
     PS256 JWT SIGNER (RSA-PSS)
  ============================================================ */

  private signPS256JWT(header: object, payload: object, pemKey: string): string {
    const b64url = (v: string) =>
      Buffer.from(v)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    const encodedHeader  = b64url(JSON.stringify(header));
    const encodedPayload = b64url(JSON.stringify(payload));
    const signingInput   = `${encodedHeader}.${encodedPayload}`;

    const privateKey = this.parsePrivateKey(pemKey);

    const md = forge.md.sha256.create();
    md.update(signingInput, 'utf8');

    const pss = forge.pss.create({
      md:         forge.md.sha256.create(),
      mgf:        forge.mgf.mgf1.create(forge.md.sha256.create()),
      saltLength: 32,
    });

    const signature = Buffer.from(
      (privateKey as any).sign(md, pss),
      'binary'
    ).toString('base64url');

    return `${signingInput}.${signature}`;
  }

  /* ============================================================
     TOKEN GENERATION — hits NetSuite directly
     INTERNAL ONLY. Always use getValidToken() from outside.
  ============================================================ */

  private async generateToken(): Promise<string> {
    const consumerKey   = process.env.NETSUITE_CONSUMER_KEY_OAUTH2       || '';
    const certificateId = process.env.NETSUITE_CERTIFICATE_ID             || '';
    const rawKey        = process.env.NETSUITE_CERTIFICATE_PRIVATE_KEY    || '';
    const accountId     = process.env.NETSUITE_ACCOUNT_ID                 || '';

    if (!consumerKey || !certificateId || !rawKey || !accountId) {
      throw new Error(
        'Missing NetSuite OAuth2 config — check these .env keys: ' +
        'NETSUITE_CONSUMER_KEY_OAUTH2, NETSUITE_CERTIFICATE_ID, ' +
        'NETSUITE_CERTIFICATE_PRIVATE_KEY, NETSUITE_ACCOUNT_ID'
      );
    }

    const tokenUrl =
      process.env.NETSUITE_TOKEN_URL ||
      `https://${accountId.toLowerCase().replace(/_/g, '-')}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`;

    const now = Math.floor(Date.now() / 1000);

    const jwt = this.signPS256JWT(
      { alg: 'PS256', typ: 'JWT', kid: certificateId },
      {
        iss:   consumerKey,
        scope: ['restlets', 'rest_webservices'],
        iat:   now,
        exp:   now + 3600,
        aud:   tokenUrl,
      },
      this.normalizePemKey(rawKey)
    );

    const res = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type:            'client_credentials',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion:      jwt,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken: string = res.data.access_token;
    const expiresIn:   number = res.data.expires_in ?? 3600;

    /* Store with 5-min buffer before real expiry */
    if (this.redisEnabled && this.redis) {
      await this.redis.set(REDIS_TOKEN_KEY, accessToken, 'EX', expiresIn - 300);
      this.logger.log(`✅ NetSuite token generated & cached in Redis (TTL: ${expiresIn - 300}s)`);
    } else {
      this.memoryToken  = accessToken;
      this.memoryExpiry = now + expiresIn;
      this.logger.log('✅ NetSuite token generated & stored in memory cache');
    }

    return accessToken;
  }

  /* ============================================================
     GET VALID TOKEN ← call this everywhere
     Priority: Redis → Memory → Generate fresh
  ============================================================ */

  async getValidToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    /* 1. Try Redis */
    if (this.redisEnabled && this.redis) {
      try {
        const cached = await this.redis.get(REDIS_TOKEN_KEY);
        if (cached) {
          this.logger.debug('✅ Token served from Redis cache');
          return cached;
        }
      } catch (err: any) {
        this.logger.warn(`Redis read failed (${err.message}) — falling back to memory`);
      }
    }

    /* 2. Try memory (5-min buffer before expiry) */
    if (this.memoryToken && now < this.memoryExpiry - 300) {
      this.logger.debug('✅ Token served from memory cache');
      return this.memoryToken;
    }

    /* 3. Generate fresh */
    this.logger.log('🔄 No valid cached token — generating new NetSuite token');
    return this.generateToken();
  }

  /* ============================================================
     INVALIDATE CACHE — force refresh on next call
  ============================================================ */

  async invalidateToken(): Promise<void> {
    this.memoryToken  = null;
    this.memoryExpiry = 0;

    if (this.redisEnabled && this.redis) {
      await this.redis.del(REDIS_TOKEN_KEY);
      this.logger.warn('⚠️  NetSuite token cleared from Redis');
    } else {
      this.logger.warn('⚠️  NetSuite token cleared from memory');
    }
  }

  /* ============================================================
     CRON — proactive refresh every 50 min (before 60 min expiry)
     Prevents any request from waiting on cold-start generation
  ============================================================ */

  @Cron('0 */50 * * * *')
  async refreshTokenCron(): Promise<void> {
    try {
      this.logger.log('⏱️  Proactive token refresh running...');
      await this.generateToken();
    } catch (err: any) {
      this.logger.error(`Proactive token refresh failed: ${err.message}`);
    }
  }

  /* ============================================================
     PUBLIC — getNetsuiteToken
     Returns full token metadata (used by controller for testing)
  ============================================================ */

  async getNetsuiteToken(): Promise<{
    success:              boolean;
    access_token:         string;
    expires_in:           number;
    authorization_header: string;
  }> {
    const token = await this.getValidToken();
    return {
      success:              true,
      access_token:         token,
      expires_in:           3600,
      authorization_header: `Bearer ${token}`,
    };
  }

  /* ============================================================
     OAUTH 1.0a — RESTLET HEADERS
  ============================================================ */

  private getOAuthHeaders(url: string): AxiosRequestHeaders {
    const token = {
      key:    process.env.NETSUITE_TOKEN_ID     || '',
      secret: process.env.NETSUITE_TOKEN_SECRET || '',
    };

    const accountId = process.env.NETSUITE_ACCOUNT_ID || '';
    const auth = this.oauth.toHeader(
      this.oauth.authorize({ url, method: 'POST' }, token)
    );

    return {
      'Content-Type': 'application/json',
      Authorization:  `OAuth realm="${accountId.trim()}",${auth.Authorization.replace('OAuth ', '')}`,
    } as any;
  }

  /* ============================================================
     REST CALLERS
  ============================================================ */

  /**
   * OAuth 1.0a — for RESTlet endpoints (existing NetSuite scripts)
   * Returns res.data directly (not the full axios response)
   */
  async callRestlet(url: string, data: any): Promise<any> {
    if (!url) throw new Error('NetSuite RESTlet URL is missing');
    const res = await axios.post(url, data, {
      headers: this.getOAuthHeaders(url),
    });
    return res.data;
  }

  /**
   * OAuth 2.0 — for REST API endpoints (uses cached Bearer token)
   * Returns res.data directly
   */
  async callRestApi(url: string, data: any): Promise<any> {
    if (!url) throw new Error('NetSuite REST API URL is missing');
    const token = await this.getValidToken();
    const res = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return res.data;
  }

  /* ============================================================
     BUSINESS METHODS
  ============================================================ */

  async updateInvoice(data: any): Promise<any> {
    return this.callRestlet(
      process.env.NETSUITE_RESTLET_URL || '',
      { operation: 'updateInvoice', ...data }
    );
  }

  async createBackendPenaltyInvoice(data: any): Promise<any> {
    return this.callRestlet(
      process.env.NETSUITE_RESTLET_PENALTY_INVOICE_BACKEND_URL || '',
      data
    );
  }

  async reconcilePaymentWithUTR(data: any): Promise<any> {
    return this.callRestlet(
      process.env.NETSUITE_RESTLET_RECONCILIATION_URL || '',
      data
    );
  }
}