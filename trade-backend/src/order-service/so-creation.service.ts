// import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { SOCreation, SOCreationDocument } from './schemas/so-creation.schema';
// import { SOCreationDto } from './schemas/so-creation.dto';
// import axios from 'axios';
// import * as crypto from 'crypto';

// @Injectable()
// export class SOCreationService {
//   private readonly logger = new Logger(SOCreationService.name);

//   private readonly netsuiteConfig = {
//     accountId: process.env.NETSUITE_ACCOUNT_ID,
//     consumerKey: process.env.NETSUITE_CONSUMER_KEY,
//     consumerSecret: process.env.NETSUITE_CONSUMER_SECRET,
//     tokenId: process.env.NETSUITE_TOKEN_ID,
//     tokenSecret: process.env.NETSUITE_TOKEN_SECRET,
//     soRestletUrl: process.env.NETSUITE_SO_URL, // e.g. https://7548958-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=12614&deploy=1
//   };

//   constructor(
//     @InjectModel(SOCreation.name) private soModel: Model<SOCreationDocument>,
//   ) {}

//   async createSO(payload: SOCreationDto): Promise<any> {
//     const middlewareId = `MW-${crypto.randomUUID()}`;
//     this.logger.log(`[${middlewareId}] Received SO creation request`);

//     // Save to DB immediately
//     let soDoc: SOCreationDocument;
//     try {
//       soDoc = new this.soModel({
//         middlewareId,
//         status: 'pending',
//         originalPayload: payload,
//       });
//       await soDoc.save();
//       this.logger.log(`[${middlewareId}] Saved to DB with status: pending`);
//     } catch (err) {
//       this.logger.error(`[${middlewareId}] DB save failed`, err);
//       throw new HttpException('DB save failed', HttpStatus.INTERNAL_SERVER_ERROR);
//     }

//     // Forward to NetSuite with OAuth
//     try {
//       const url = this.netsuiteConfig.soRestletUrl!;
//       const headers = this.generateOAuthHeaders(url);

//       this.logger.log(`[${middlewareId}] Forwarding to NetSuite: ${url}`);

//       const netsuiteResponse = await axios.post(url, payload, {
//         headers,
//         timeout: 120000,
//       });

//       this.logger.log(`[${middlewareId}] NetSuite responded: ${netsuiteResponse.status}`);

//       const nsData = netsuiteResponse.data;

//       // Update DB with NetSuite SO details
//       await this.soModel.findByIdAndUpdate(soDoc._id, {
//         status: 'so_created',
//         netsuiteSOId: nsData?.id?.toString() || nsData?.soId?.toString() || '',
//         netsuiteSONumber: nsData?.tranid || nsData?.soNumber || '',
//         netsuiteResponse: nsData,
//       });

//       this.logger.log(`[${middlewareId}] DB updated with NetSuite SO details`);

//       // Return NetSuite response unchanged + middlewareId
//       return {
//         ...nsData,
//         middlewareId,
//       };

//     } catch (error) {
//       this.logger.error(`[${middlewareId}] NetSuite call failed: ${error.message}`);

//       await this.soModel.findByIdAndUpdate(soDoc._id, {
//         status: 'so_failed',
//         errorMessage: error.message,
//         netsuiteResponse: error.response?.data || null,
//       }).catch(() => {});

//       throw new HttpException(
//         error.response?.data || { message: error.message },
//         error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
//       );
//     }
//   }

//   async updateWithPODetails(params: {
//     salesOrderId: string;
//     poExists: boolean;
//     poId?: string;
//     poNumber?: string;
//     poPayload?: any;
//     status: string;
//   }): Promise<void> {
//     try {
//       const result = await this.soModel.findOneAndUpdate(
//         { netsuiteSOId: params.salesOrderId },
//         {
//           status: params.status,
//           poExists: params.poExists,
//           poId: params.poId,
//           poNumber: params.poNumber,
//           poPayload: params.poPayload,
//         },
//         { new: true },
//       );

//       if (result) {
//         this.logger.log(`Updated SO doc [middlewareId: ${result.middlewareId}] with PO details. Status: ${params.status}`);
//       } else {
//         this.logger.warn(`No SO doc found for netsuiteSOId: ${params.salesOrderId} — PO update skipped`);
//       }
//     } catch (err) {
//       this.logger.error(`Failed to update SO doc with PO details`, err);
//     }
//   }

//   // Same OAuth implementation as OrderService
//   private generateOAuthHeaders(url: string): Record<string, string> {
//     const netsuite = this.netsuiteConfig;

//     const timestamp = Math.floor(Date.now() / 1000).toString();
//     const nonce = crypto.randomBytes(16).toString('hex');

//     const params: Record<string, string> = {
//       oauth_consumer_key: netsuite.consumerKey!,
//       oauth_token: netsuite.tokenId!,
//       oauth_signature_method: 'HMAC-SHA256',
//       oauth_timestamp: timestamp,
//       oauth_nonce: nonce,
//       oauth_version: '1.0',
//     };

//     const [baseUrl, queryString] = url.split('?');
//     if (queryString) {
//       queryString.split('&').forEach(p => {
//         const [k, v] = p.split('=');
//         params[k] = v;
//       });
//     }

//     const sortedParams = Object.keys(params)
//       .sort()
//       .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
//       .join('&');

//     const baseString = [
//       'POST',
//       encodeURIComponent(baseUrl),
//       encodeURIComponent(sortedParams),
//     ].join('&');

//     const signingKey =
//       `${encodeURIComponent(netsuite.consumerSecret!)}&` +
//       `${encodeURIComponent(netsuite.tokenSecret!)}`;

//     const signature = crypto
//       .createHmac('sha256', signingKey)
//       .update(baseString)
//       .digest('base64');

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

//     return {
//       Authorization: `OAuth ${authHeader}`,
//       'Content-Type': 'application/json',
//     };
//   }
// }


import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SOCreation, SOCreationDocument } from './schemas/so-creation.schema';
import { SOCreationDto } from './schemas/so-creation.dto';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class SOCreationService {
  private readonly logger = new Logger(SOCreationService.name);

  private readonly netsuiteConfig = {
    accountId: process.env.NETSUITE_ACCOUNT_ID,
    consumerKey: process.env.NETSUITE_CONSUMER_KEY,
    consumerSecret: process.env.NETSUITE_CONSUMER_SECRET,
    tokenId: process.env.NETSUITE_TOKEN_ID,
    tokenSecret: process.env.NETSUITE_TOKEN_SECRET,
    soRestletUrl: process.env.NETSUITE_SO_URL,
  };

  constructor(
    @InjectModel(SOCreation.name) private soModel: Model<SOCreationDocument>,
  ) {}

  async createSO(payload: SOCreationDto): Promise<any> {
    const middlewareId = `MW-${crypto.randomUUID()}`;
    const requestStart = Date.now();

    this.logger.log(`[${middlewareId}] ═══════════════════════════════════════`);
    this.logger.log(`[${middlewareId}] Incoming SO Creation Request`);
    this.logger.log(`[${middlewareId}] Entity: ${payload.entity} | Vendor: ${payload['custbody_btst_supplier']} | Date: ${payload.trandate}`);
    this.logger.log(`[${middlewareId}] Items count: ${payload.item?.length ?? 0}`);

    // Step 1: Save to DB
    let soDoc: SOCreationDocument;
    const dbStart = Date.now();
    try {
      soDoc = new this.soModel({
        middlewareId,
        status: 'pending',
        originalPayload: payload,
      });
      await soDoc.save();
      this.logger.log(`[${middlewareId}] ✓ DB save completed in ${Date.now() - dbStart}ms | status: pending`);
    } catch (err) {
      this.logger.error(`[${middlewareId}] ✗ DB save failed after ${Date.now() - dbStart}ms | ${err.message}`);
      throw new HttpException('DB save failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Step 2: Forward to NetSuite with OAuth
    const netsuiteStart = Date.now();
    try {
      const url = this.netsuiteConfig.soRestletUrl!;
      const headers = this.generateOAuthHeaders(url);

      this.logger.log(`[${middlewareId}] → Forwarding to NetSuite: ${url}`);

      const netsuiteResponse = await axios.post(url, payload, {
        headers,
        timeout: 120000,
      });

      const netsuiteDuration = Date.now() - netsuiteStart;
      this.logger.log(`[${middlewareId}] ✓ NetSuite responded in ${netsuiteDuration}ms | HTTP ${netsuiteResponse.status}`);
      this.logger.log(`[${middlewareId}] NetSuite raw response: ${JSON.stringify(netsuiteResponse.data)}`);

      const nsData = netsuiteResponse.data;

      // ✅ FIX: NetSuite returns { success, data: { tranid, id } }
      const netsuiteSOId = (nsData?.data?.id ?? nsData?.id ?? '').toString();
      const netsuiteSONumber = nsData?.data?.tranid ?? nsData?.tranid ?? '';

      this.logger.log(`[${middlewareId}] Parsed → SO ID: ${netsuiteSOId} | SO Number: ${netsuiteSONumber}`);

      if (!netsuiteSOId) {
        this.logger.warn(`[${middlewareId}] ⚠ NetSuite SO ID is empty — PO update won't be able to link later!`);
      }

      // Step 3: Update DB with NetSuite response
      const dbUpdateStart = Date.now();
      await this.soModel.findByIdAndUpdate(soDoc._id, {
        status: 'so_created',
        netsuiteSOId,
        netsuiteSONumber,
        netsuiteResponse: nsData,
      });
      this.logger.log(`[${middlewareId}] ✓ DB updated in ${Date.now() - dbUpdateStart}ms | netsuiteSOId: ${netsuiteSOId} | netsuiteSONumber: ${netsuiteSONumber}`);

      const totalDuration = Date.now() - requestStart;
      this.logger.log(`[${middlewareId}] ✓ SO Creation complete | Total time: ${totalDuration}ms`);
      this.logger.log(`[${middlewareId}] ═══════════════════════════════════════`);

      return {
        ...nsData,
        middlewareId,
      };

    } catch (error) {
      const netsuiteDuration = Date.now() - netsuiteStart;
      this.logger.error(`[${middlewareId}] ✗ NetSuite call failed after ${netsuiteDuration}ms | ${error.message}`);

      if (error.response) {
        this.logger.error(`[${middlewareId}] NetSuite error response: HTTP ${error.response.status} | ${JSON.stringify(error.response.data)}`);
      }

      await this.soModel.findByIdAndUpdate(soDoc._id, {
        status: 'so_failed',
        errorMessage: error.message,
        netsuiteResponse: error.response?.data || null,
      }).catch((dbErr) => {
        this.logger.error(`[${middlewareId}] ✗ DB error-status update also failed: ${dbErr.message}`);
      });

      const totalDuration = Date.now() - requestStart;
      this.logger.error(`[${middlewareId}] ✗ Request failed | Total time: ${totalDuration}ms`);
      this.logger.log(`[${middlewareId}] ═══════════════════════════════════════`);

      throw new HttpException(
        error.response?.data || { message: error.message },
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateWithPODetails(params: {
    salesOrderId: string;
    poExists: boolean;
    poId?: string;
    poNumber?: string;
    poPayload?: any;
    status: string;
  }): Promise<void> {
    const start = Date.now();
    this.logger.log(`[PO-UPDATE] Looking up SO doc for netsuiteSOId: ${params.salesOrderId}`);

    try {
      const result = await this.soModel.findOneAndUpdate(
        { netsuiteSOId: params.salesOrderId },
        {
          status: params.status,
          poExists: params.poExists,
          poId: params.poId,
          poNumber: params.poNumber,
          poPayload: params.poPayload,
        },
        { new: true },
      );

      if (result) {
        this.logger.log(`[PO-UPDATE] ✓ SO doc updated in ${Date.now() - start}ms | middlewareId: ${result.middlewareId} | status: ${params.status} | poId: ${params.poId} | poNumber: ${params.poNumber}`);
      } else {
        this.logger.warn(`[PO-UPDATE] ⚠ No SO doc found for netsuiteSOId: ${params.salesOrderId} in ${Date.now() - start}ms — was SO created via middleware?`);
      }
    } catch (err) {
      this.logger.error(`[PO-UPDATE] ✗ DB update failed after ${Date.now() - start}ms | ${err.message}`);
    }
  }

  private generateOAuthHeaders(url: string): Record<string, string> {
    const netsuite = this.netsuiteConfig;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    const params: Record<string, string> = {
      oauth_consumer_key: netsuite.consumerKey!,
      oauth_token: netsuite.tokenId!,
      oauth_signature_method: 'HMAC-SHA256',
      oauth_timestamp: timestamp,
      oauth_nonce: nonce,
      oauth_version: '1.0',
    };

    const [baseUrl, queryString] = url.split('?');
    if (queryString) {
      queryString.split('&').forEach(p => {
        const [k, v] = p.split('=');
        params[k] = v;
      });
    }

    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');

    const baseString = [
      'POST',
      encodeURIComponent(baseUrl),
      encodeURIComponent(sortedParams),
    ].join('&');

    const signingKey =
      `${encodeURIComponent(netsuite.consumerSecret!)}&` +
      `${encodeURIComponent(netsuite.tokenSecret!)}`;

    const signature = crypto
      .createHmac('sha256', signingKey)
      .update(baseString)
      .digest('base64');

    const authHeader = [
      `realm="${netsuite.accountId}"`,
      `oauth_consumer_key="${params.oauth_consumer_key}"`,
      `oauth_token="${params.oauth_token}"`,
      `oauth_signature_method="${params.oauth_signature_method}"`,
      `oauth_timestamp="${params.oauth_timestamp}"`,
      `oauth_nonce="${params.oauth_nonce}"`,
      `oauth_version="${params.oauth_version}"`,
      `oauth_signature="${encodeURIComponent(signature)}"`,
    ].join(',');

    return {
      Authorization: `OAuth ${authHeader}`,
      'Content-Type': 'application/json',
    };
  }
}