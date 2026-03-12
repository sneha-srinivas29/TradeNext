// import { Injectable, Logger } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { POCreation, POCreationDocument } from './schemas/po-creation.schema';
// import { POCreationDto } from './schemas/po-creation.dto';
// import axios, { AxiosResponse } from 'axios';
// import * as crypto from 'crypto';
// import { SOCreationService } from './so-creation.service';

// const OAuth = require('oauth-1.0a');

// interface NetsuiteResponse {
//   success: boolean;
//   poId?: string;
//   poNumber?: string;
//   error?: string;
// }

// interface PODetails {
//   poNumber: string;
//   vendorEmail: string;
//   vendor: string;
// }

// @Injectable()
// export class OrderService {
//   private readonly logger = new Logger(OrderService.name);
  
//   private readonly netsuiteConfig = {
//     accountId: process.env.NETSUITE_ACCOUNT_ID,
//     consumerKey: process.env.NETSUITE_CONSUMER_KEY,
//     consumerSecret: process.env.NETSUITE_CONSUMER_SECRET,
//     tokenId: process.env.NETSUITE_TOKEN_ID,
//     tokenSecret: process.env.NETSUITE_TOKEN_SECRET,
//     restletUrl: process.env.NETSUITE_RESTLET_URL
//   };

//   constructor(
//     @InjectModel(POCreation.name) private poModel: Model<POCreationDocument>,
//     private readonly soCreationService: SOCreationService,
//   ) {}

//   // New: save incoming PO payload to MongoDB (best-effort, won't fail flow)
//   private async savePOPayload(soData: POCreationDto, meta?: { status: string; poId?: string; poNumber?: string; }) {
//     try {
//       const doc = new this.poModel({
//         salesOrderId: soData.salesOrderId,
//         salesOrderNumber: soData.salesOrderNumber,
//         poExists: soData.poExists,
//         // store original payload plus a small meta block so you can query status later
//         payload: {
//           original: soData,
//           meta: {
//             status: meta?.status ?? (soData.poExists ? 'exists' : 'unknown'),
//             poId: meta?.poId,
//             poNumber: meta?.poNumber,
//             savedAt: new Date().toISOString()
//           }
//         }
//       });
//       await doc.save();

//     // 2. NEW: Also update the original SO creation document
//     await this.soCreationService.updateWithPODetails({
//       salesOrderId: soData.salesOrderId,
//       poExists: soData.poExists,
//       poId: meta?.poId,
//       poNumber: meta?.poNumber,
//       poPayload: soData,
//       status: meta?.status === 'exists' ? 'po_exists' : 'po_created',
//     });
//     } catch (err) {
//       this.logger.error('Failed to save PO payload to DB', err);
//       // don't throw, keep workflow resilient
//       return null;
//     }
//   }

//   /**
//    * Main method to ensure PO creation
//    */
//   async ensurePOCreation(soData: POCreationDto) {
//     try {
//       // If PO already exists, just log and return
//       this.logger.log("netsuite env config", this.netsuiteConfig);
//       if (soData.poExists) {
//         this.logger.log(`✓ PO already exists for SO: ${soData.salesOrderNumber}`);
//         this.logger.log(`  PO Number: ${soData.existingPoNumber}`);
//         this.logger.log(`  PO ID: ${soData.existingPoId}`);
        
//         // persist the incoming payload indicating PO already exists
//         try {
//           await this.savePOPayload(soData, {
//             status: 'exists',
//             poId: soData.existingPoId,
//             poNumber: soData.existingPoNumber
//           });
//           this.logger.log('Saved existing-PO payload to DB');
//         } catch (saveErr) {
//           this.logger.error('Error saving existing-PO payload', saveErr);
//         }
        
//         return {
//           status: 'exists',
//           message: 'Purchase Order already exists',
//           soId: soData.salesOrderId,
//           soNumber: soData.salesOrderNumber,
//           poId: soData.existingPoId,
//           poNumber: soData.existingPoNumber
//         };
//       }

//       // PO doesn't exist, create it
//       this.logger.log(`⚙ Creating new PO for SO: ${soData.salesOrderNumber}`);
//       const newPO = await this.createPO(soData);

//       this.logger.log(`✓ PO created successfully`);
//       this.logger.log(`  PO Number: ${newPO.poNumber}`);
//       this.logger.log(`  PO ID: ${newPO.poId}`);

//       // persist the incoming payload with created PO meta (best-effort)
//       try {
//         await this.savePOPayload(soData, {
//           status: 'created',
//           poId: newPO.poId,
//           poNumber: newPO.poNumber
//         });
//         this.logger.log('Saved created-PO payload to DB');
//       } catch (saveErr) {
//         this.logger.error('Error saving created-PO payload', saveErr);
//       }
      
//       // Send notification (non-blocking)
//       this.sendPONotification(newPO.poId)
//         .then(() => {
//           this.logger.log(`✓ PO notification sent for PO: ${newPO.poNumber}`);
//         })
//         .catch((error) => {
//           this.logger.error(`✗ PO notification failed: ${error.message}`);
//           // Don't throw - notification failure shouldn't fail the entire process
//         });

//       return {
//         status: 'created',
//         message: 'Purchase Order created successfully',
//         poId: newPO.poId,
//         poNumber: newPO.poNumber,
//         soId: soData.salesOrderId,
//         soNumber: soData.salesOrderNumber
//       };

//     } catch (error) {
//       this.logger.error(`✗ Error in PO creation workflow: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * Create PO in NetSuite via RESTlet
//    */
//   private async createPO(soData: POCreationDto): Promise<{ poId: any; poNumber: any }> {
//     try {
//       this.logger.log(`Calling NetSuite RESTlet to create PO...`);
      
//       const response = await this.callNetsuiteRestlet({
//         action: 'createPO',
//         data: soData
//       });

//       const result: NetsuiteResponse = response.data;

//       if (!result.success) {
//         throw new Error(`NetSuite PO creation failed: ${result.error}`);
//       }

//       return {
//         poId: result.poId,
//         poNumber: result.poNumber
//       };
//     } catch (error) {
//       this.logger.error(`Error calling NetSuite for PO creation: ${error.message}`);
      
//       if (error.response) {
//         this.logger.error(`NetSuite Response Status: ${error.response.status}`);
//         this.logger.error(`NetSuite Response Data: ${JSON.stringify(error.response.data)}`);
//       }
      
//       throw error;
//     }
//   }

//   /**
//    * Send PO notification to vendor
//    */
//   private async sendPONotification(poId: string): Promise<any> {
//     try {
//       this.logger.log(`Fetching PO details for notification...`);
      
//       // Get PO details from NetSuite
//       const response = await this.callNetsuiteRestlet({
//         action: 'getPODetails',
//         poId: poId
//       });

//       const poDetails: PODetails = response.data;

//       if (!poDetails.vendorEmail) {
//         throw new Error('Vendor email not found in PO details');
//       }

//       const notificationPayload = {
//         poInternalId: poId,
//         loginId: poDetails.vendorEmail,
//         type: 'POGeneration',
//         timestamp: new Date().toISOString(),
//         isProduction: process.env.NODE_ENV === 'production',
//         poDocId: poDetails.poNumber
//       };

//       this.logger.log(`Sending notification to vendor: ${poDetails.vendorEmail}`);
      
//       const notificationResponse = await axios.post(
//         'https://ae.samunnati.digital/v2/profiles/fcm-notification',
//         notificationPayload,
//         {
//           headers: {
//             'username': process.env.NOTIFICATION_USERNAME || '+9101tse80',
//             'password': process.env.NOTIFICATION_PASSWORD || '123456789',
//             'Content-Type': 'application/json'
//           },
//           timeout: 10000 // 10 second timeout
//         }
//       );

//       this.logger.log(`Notification sent successfully. Response: ${notificationResponse.status}`);
//       return notificationResponse.data;
      
//     } catch (error) {
//       this.logger.error(`Error in PO notification: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * Call NetSuite RESTlet with OAuth 1.0 authentication
//    */
//   private async callNetsuiteRestlet(payload: any): Promise<AxiosResponse> {
//     try {

//       if (!this.netsuiteConfig.restletUrl) {
//         throw new Error('NETSUITE_RESTLET_URL is not configured');
//       }
//     //   const headers = this.generateOAuthHeaders('POST', this.netsuiteConfig.restletUrl);
//     //   this.logger.log("netsuite env config inside callNetsuiteRestlet", this.netsuiteConfig);
//     const headers = this.generateOAuthHeaders(this.netsuiteConfig.restletUrl!);
    
//       this.logger.log("Generated OAuth Headers", headers);
//       this.logger.debug(`RESTlet URL: ${this.netsuiteConfig.restletUrl}`);
//       this.logger.debug(`Payload: ${JSON.stringify(payload)}`);
       
//       const response = await axios.post(
//         this.netsuiteConfig.restletUrl!,
//         payload,
//         { 
//           headers,
//           timeout: 100000 // 30 second timeout
//         }
//       );

//       return response;
//     } catch (error) {
//       this.logger.error(`RESTlet call failed: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * Generate OAuth 1.0 headers for NetSuite authentication
//    */
// private generateOAuthHeaders(url: string): Record<string, string> {
//   const netsuite = this.netsuiteConfig;

//   const timestamp = Math.floor(Date.now() / 1000).toString();
//   const nonce = crypto.randomBytes(16).toString('hex');

//   const params: Record<string, string> = {
//     oauth_consumer_key: netsuite.consumerKey!,
//     oauth_token: netsuite.tokenId!,
//     oauth_signature_method: 'HMAC-SHA256',
//     oauth_timestamp: timestamp,
//     oauth_nonce: nonce,
//     oauth_version: '1.0',
//   };

//   // 🔥 INCLUDE QUERY PARAMS (script & deploy)
//   const [baseUrl, queryString] = url.split('?');
//   if (queryString) {
//     queryString.split('&').forEach(p => {
//       const [k, v] = p.split('=');
//       params[k] = v;
//     });
//   }

//   const sortedParams = Object.keys(params)
//     .sort()
//     .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
//     .join('&');

//   const baseString = [
//     'POST',
//     encodeURIComponent(baseUrl),
//     encodeURIComponent(sortedParams),
//   ].join('&');

//   const signingKey =
//     `${encodeURIComponent(netsuite.consumerSecret!)}&` +
//     `${encodeURIComponent(netsuite.tokenSecret!)}`;

//   const signature = crypto
//     .createHmac('sha256', signingKey)
//     .update(baseString)
//     .digest('base64');

//   // 🔥 REALM MUST BE INSIDE Authorization header
//   const authHeader = [
//     `realm="${netsuite.accountId}"`,
//     `oauth_consumer_key="${params.oauth_consumer_key}"`,
//     `oauth_token="${params.oauth_token}"`,
//     `oauth_signature_method="${params.oauth_signature_method}"`,
//     `oauth_timestamp="${params.oauth_timestamp}"`,
//     `oauth_nonce="${params.oauth_nonce}"`,
//     `oauth_version="${params.oauth_version}"`,
//     `oauth_signature="${encodeURIComponent(signature)}"`,
//   ].join(',');

//   return {
//     Authorization: `OAuth ${authHeader}`,
//     'Content-Type': 'application/json',
//   };
// }

// }


import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { POCreation, POCreationDocument } from './schemas/po-creation.schema';
import { POCreationDto } from './schemas/po-creation.dto';
import { SOCreationService } from './so-creation.service';
import axios, { AxiosResponse } from 'axios';
import * as crypto from 'crypto';

const OAuth = require('oauth-1.0a');

interface NetsuiteResponse {
  success: boolean;
  poId?: string;
  poNumber?: string;
  error?: string;
}

interface PODetails {
  poNumber: string;
  vendorEmail: string;
  vendor: string;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  private readonly netsuiteConfig = {
    accountId: process.env.NETSUITE_ACCOUNT_ID,
    consumerKey: process.env.NETSUITE_CONSUMER_KEY,
    consumerSecret: process.env.NETSUITE_CONSUMER_SECRET,
    tokenId: process.env.NETSUITE_TOKEN_ID,
    tokenSecret: process.env.NETSUITE_TOKEN_SECRET,
    restletUrl: process.env.NETSUITE_RESTLET_URL,
  };

  constructor(
    @InjectModel(POCreation.name) private poModel: Model<POCreationDocument>,
    private readonly soCreationService: SOCreationService,
  ) {}

  private async savePOPayload(soData: POCreationDto, meta?: { status: string; poId?: string; poNumber?: string }) {
    const start = Date.now();
    try {
      const doc = new this.poModel({
        salesOrderId: soData.salesOrderId,
        salesOrderNumber: soData.salesOrderNumber,
        poExists: soData.poExists,
        payload: {
          original: soData,
          meta: {
            status: meta?.status ?? (soData.poExists ? 'exists' : 'unknown'),
            poId: meta?.poId,
            poNumber: meta?.poNumber,
            savedAt: new Date().toISOString(),
          },
        },
      });
      await doc.save();
      this.logger.log(`[PO-DB] ✓ POCreation doc saved in ${Date.now() - start}ms | SO: ${soData.salesOrderNumber} | status: ${meta?.status}`);

      // Update original SO doc
      await this.soCreationService.updateWithPODetails({
        salesOrderId: soData.salesOrderId,
        poExists: soData.poExists,
        poId: meta?.poId,
        poNumber: meta?.poNumber,
        poPayload: soData,
        status: meta?.status === 'exists' ? 'po_exists' : 'po_created',
      });

    } catch (err) {
      this.logger.error(`[PO-DB] ✗ Failed to save POCreation doc after ${Date.now() - start}ms | ${err.message}`);
      return null;
    }
  }

  async ensurePOCreation(soData: POCreationDto) {
    const requestStart = Date.now();

    this.logger.log(`═══════════════════════════════════════════════════`);
    this.logger.log(`[PO-WORKFLOW] Incoming PO Verification Request`);
    this.logger.log(`[PO-WORKFLOW] SO Number: ${soData.salesOrderNumber} | SO ID: ${soData.salesOrderId}`);
    this.logger.log(`[PO-WORKFLOW] PO Exists: ${soData.poExists}`);
    if (soData.poExists) {
      this.logger.log(`[PO-WORKFLOW] Existing PO → ID: ${soData.existingPoId} | Number: ${soData.existingPoNumber}`);
    } else {
      this.logger.log(`[PO-WORKFLOW] Vendor: ${soData.vendor} | Customer: ${soData.customer} | Location: ${soData.location}`);
      this.logger.log(`[PO-WORKFLOW] Items count: ${soData.items?.length ?? 0}`);
    }

    try {
      if (soData.poExists) {
        this.logger.log(`[PO-WORKFLOW] → PO already exists, skipping creation`);

        const dbStart = Date.now();
        await this.savePOPayload(soData, {
          status: 'exists',
          poId: soData.existingPoId,
          poNumber: soData.existingPoNumber,
        });
        this.logger.log(`[PO-WORKFLOW] ✓ DB persistence done in ${Date.now() - dbStart}ms`);

        const totalDuration = Date.now() - requestStart;
        this.logger.log(`[PO-WORKFLOW] ✓ Workflow complete (PO existed) | Total time: ${totalDuration}ms`);
        this.logger.log(`═══════════════════════════════════════════════════`);

        return {
          status: 'exists',
          message: 'Purchase Order already exists',
          soId: soData.salesOrderId,
          soNumber: soData.salesOrderNumber,
          poId: soData.existingPoId,
          poNumber: soData.existingPoNumber,
        };
      }

      // PO doesn't exist — create it
      this.logger.log(`[PO-WORKFLOW] → PO not found, initiating creation in NetSuite`);

      const poStart = Date.now();
      const newPO = await this.createPO(soData);
      this.logger.log(`[PO-WORKFLOW] ✓ PO created in NetSuite in ${Date.now() - poStart}ms | PO ID: ${newPO.poId} | PO Number: ${newPO.poNumber}`);

      const dbStart = Date.now();
      await this.savePOPayload(soData, {
        status: 'created',
        poId: newPO.poId,
        poNumber: newPO.poNumber,
      });
      this.logger.log(`[PO-WORKFLOW] ✓ DB persistence done in ${Date.now() - dbStart}ms`);

      // Send notification (non-blocking)
      const notifStart = Date.now();
      this.sendPONotification(newPO.poId)
        .then(() => {
          this.logger.log(`[PO-NOTIFY] ✓ Vendor notification sent in ${Date.now() - notifStart}ms | PO: ${newPO.poNumber}`);
        })
        .catch((error) => {
          this.logger.error(`[PO-NOTIFY] ✗ Vendor notification failed after ${Date.now() - notifStart}ms | ${error.message}`);
        });

      const totalDuration = Date.now() - requestStart;
      this.logger.log(`[PO-WORKFLOW] ✓ Workflow complete (PO created) | Total time: ${totalDuration}ms`);
      this.logger.log(`═══════════════════════════════════════════════════`);

      return {
        status: 'created',
        message: 'Purchase Order created successfully',
        poId: newPO.poId,
        poNumber: newPO.poNumber,
        soId: soData.salesOrderId,
        soNumber: soData.salesOrderNumber,
      };

    } catch (error) {
      const totalDuration = Date.now() - requestStart;
      this.logger.error(`[PO-WORKFLOW] ✗ Workflow failed after ${totalDuration}ms | ${error.message}`);
      this.logger.error(`[PO-WORKFLOW] Stack: ${error.stack}`);
      this.logger.log(`═══════════════════════════════════════════════════`);
      throw error;
    }
  }

  private async createPO(soData: POCreationDto): Promise<{ poId: any; poNumber: any }> {
    const start = Date.now();
    this.logger.log(`[PO-CREATE] → Calling NetSuite RESTlet to create PO for SO: ${soData.salesOrderNumber}`);

    try {
      const response = await this.callNetsuiteRestlet({
        action: 'createPO',
        data: soData,
      });

      const result: NetsuiteResponse = response.data;
      const duration = Date.now() - start;

      if (!result.success) {
        this.logger.error(`[PO-CREATE] ✗ NetSuite returned failure after ${duration}ms | error: ${result.error}`);
        throw new Error(`NetSuite PO creation failed: ${result.error}`);
      }

      this.logger.log(`[PO-CREATE] ✓ NetSuite PO creation successful in ${duration}ms | PO ID: ${result.poId} | PO Number: ${result.poNumber}`);

      return {
        poId: result.poId,
        poNumber: result.poNumber,
      };

    } catch (error) {
      const duration = Date.now() - start;
      this.logger.error(`[PO-CREATE] ✗ NetSuite RESTlet call failed after ${duration}ms | ${error.message}`);

      if (error.response) {
        this.logger.error(`[PO-CREATE] NetSuite HTTP ${error.response.status} | Response: ${JSON.stringify(error.response.data)}`);
      }

      throw error;
    }
  }

  private async sendPONotification(poId: string): Promise<any> {
    const start = Date.now();
    this.logger.log(`[PO-NOTIFY] → Fetching PO details for notification | PO ID: ${poId}`);

    try {
      const detailsStart = Date.now();
      const response = await this.callNetsuiteRestlet({
        action: 'getPODetails',
        poId: poId,
      });
      this.logger.log(`[PO-NOTIFY] ✓ PO details fetched in ${Date.now() - detailsStart}ms`);

      const poDetails: PODetails = response.data;

      if (!poDetails.vendorEmail) {
        throw new Error('Vendor email not found in PO details');
      }

      this.logger.log(`[PO-NOTIFY] → Sending FCM notification to vendor: ${poDetails.vendorEmail} | PO: ${poDetails.poNumber}`);

      const notifStart = Date.now();
      const notificationResponse = await axios.post(
        'https://ae.samunnati.digital/v2/profiles/fcm-notification',
        {
          poInternalId: poId,
          loginId: poDetails.vendorEmail,
          type: 'POGeneration',
          timestamp: new Date().toISOString(),
          isProduction: process.env.NODE_ENV === 'production',
          poDocId: poDetails.poNumber,
        },
        {
          headers: {
            username: process.env.NOTIFICATION_USERNAME || '+9101tse80',
            password: process.env.NOTIFICATION_PASSWORD || '123456789',
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      this.logger.log(`[PO-NOTIFY] ✓ FCM notification sent in ${Date.now() - notifStart}ms | HTTP ${notificationResponse.status} | Vendor: ${poDetails.vendorEmail}`);
      this.logger.log(`[PO-NOTIFY] ✓ Total notification flow: ${Date.now() - start}ms`);

      return notificationResponse.data;

    } catch (error) {
      this.logger.error(`[PO-NOTIFY] ✗ Notification failed after ${Date.now() - start}ms | ${error.message}`);
      if (error.response) {
        this.logger.error(`[PO-NOTIFY] HTTP ${error.response.status} | ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  private async callNetsuiteRestlet(payload: any): Promise<AxiosResponse> {
    const start = Date.now();
    this.logger.log(`[NETSUITE] → RESTlet call | action: ${payload.action} | URL: ${this.netsuiteConfig.restletUrl}`);

    try {
      if (!this.netsuiteConfig.restletUrl) {
        throw new Error('NETSUITE_RESTLET_URL is not configured');
      }

      const headers = this.generateOAuthHeaders(this.netsuiteConfig.restletUrl!);

      const response = await axios.post(
        this.netsuiteConfig.restletUrl!,
        payload,
        {
          headers,
          timeout: 300000,
        },
      );

      this.logger.log(`[NETSUITE] ✓ RESTlet responded in ${Date.now() - start}ms | HTTP ${response.status} | action: ${payload.action}`);

      return response;

    } catch (error) {
      this.logger.error(`[NETSUITE] ✗ RESTlet call failed after ${Date.now() - start}ms | action: ${payload.action} | ${error.message}`);
      throw error;
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
