// src/netsuite/netsuite.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { POCreationDto } from './dto/po-creation.dto';
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
export class NetsuiteService {
  private readonly logger = new Logger(NetsuiteService.name);
  
  private readonly netsuiteConfig = {
    accountId: process.env.NETSUITE_ACCOUNT_ID,
    consumerKey: process.env.NETSUITE_CONSUMER_KEY,
    consumerSecret: process.env.NETSUITE_CONSUMER_SECRET,
    tokenId: process.env.NETSUITE_TOKEN_ID,
    tokenSecret: process.env.NETSUITE_TOKEN_SECRET,
    restletUrl: process.env.NETSUITE_RESTLET_URL
  };

  /**
   * Main method to ensure PO creation
   */
  async ensurePOCreation(soData: POCreationDto) {
    try {
      // If PO already exists, just log and return
      this.logger.log("netsuite env config", this.netsuiteConfig);
      if (soData.poExists) {
        this.logger.log(`✓ PO already exists for SO: ${soData.salesOrderNumber}`);
        this.logger.log(`  PO Number: ${soData.existingPoNumber}`);
        this.logger.log(`  PO ID: ${soData.existingPoId}`);
        
        return {
          status: 'exists',
          message: 'Purchase Order already exists',
          soId: soData.salesOrderId,
          soNumber: soData.salesOrderNumber,
          poId: soData.existingPoId,
          poNumber: soData.existingPoNumber
        };
      }

      // PO doesn't exist, create it
      this.logger.log(`⚙ Creating new PO for SO: ${soData.salesOrderNumber}`);
      const newPO = await this.createPO(soData);

      this.logger.log(`✓ PO created successfully`);
      this.logger.log(`  PO Number: ${newPO.poNumber}`);
      this.logger.log(`  PO ID: ${newPO.poId}`);
      
      // Send notification (non-blocking)
      this.sendPONotification(newPO.poId)
        .then(() => {
          this.logger.log(`✓ PO notification sent for PO: ${newPO.poNumber}`);
        })
        .catch((error) => {
          this.logger.error(`✗ PO notification failed: ${error.message}`);
          // Don't throw - notification failure shouldn't fail the entire process
        });

      return {
        status: 'created',
        message: 'Purchase Order created successfully',
        poId: newPO.poId,
        poNumber: newPO.poNumber,
        soId: soData.salesOrderId,
        soNumber: soData.salesOrderNumber
      };

    } catch (error) {
      this.logger.error(`✗ Error in PO creation workflow: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create PO in NetSuite via RESTlet
   */
  private async createPO(soData: POCreationDto): Promise<{ poId: any; poNumber: any }> {
    try {
      this.logger.log(`Calling NetSuite RESTlet to create PO...`);
      
      const response = await this.callNetsuiteRestlet({
        action: 'createPO',
        data: soData
      });

      const result: NetsuiteResponse = response.data;

      if (!result.success) {
        throw new Error(`NetSuite PO creation failed: ${result.error}`);
      }

      return {
        poId: result.poId,
        poNumber: result.poNumber
      };
    } catch (error) {
      this.logger.error(`Error calling NetSuite for PO creation: ${error.message}`);
      
      if (error.response) {
        this.logger.error(`NetSuite Response Status: ${error.response.status}`);
        this.logger.error(`NetSuite Response Data: ${JSON.stringify(error.response.data)}`);
      }
      
      throw error;
    }
  }

  /**
   * Send PO notification to vendor
   */
  private async sendPONotification(poId: string): Promise<any> {
    try {
      this.logger.log(`Fetching PO details for notification...`);
      
      // Get PO details from NetSuite
      const response = await this.callNetsuiteRestlet({
        action: 'getPODetails',
        poId: poId
      });

      const poDetails: PODetails = response.data;

      if (!poDetails.vendorEmail) {
        throw new Error('Vendor email not found in PO details');
      }

      const notificationPayload = {
        poInternalId: poId,
        loginId: poDetails.vendorEmail,
        type: 'POGeneration',
        timestamp: new Date().toISOString(),
        isProduction: process.env.NODE_ENV === 'production',
        poDocId: poDetails.poNumber
      };

      this.logger.log(`Sending notification to vendor: ${poDetails.vendorEmail}`);
      
      const notificationResponse = await axios.post(
        'https://ae.samunnati.digital/v2/profiles/fcm-notification',
        notificationPayload,
        {
          headers: {
            'username': process.env.NOTIFICATION_USERNAME || '+9101tse80',
            'password': process.env.NOTIFICATION_PASSWORD || '123456789',
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      this.logger.log(`Notification sent successfully. Response: ${notificationResponse.status}`);
      return notificationResponse.data;
      
    } catch (error) {
      this.logger.error(`Error in PO notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Call NetSuite RESTlet with OAuth 1.0 authentication
   */
  private async callNetsuiteRestlet(payload: any): Promise<AxiosResponse> {
    try {

      if (!this.netsuiteConfig.restletUrl) {
        throw new Error('NETSUITE_RESTLET_URL is not configured');
      }
    //   const headers = this.generateOAuthHeaders('POST', this.netsuiteConfig.restletUrl);
    //   this.logger.log("netsuite env config inside callNetsuiteRestlet", this.netsuiteConfig);
    const headers = this.generateOAuthHeaders(this.netsuiteConfig.restletUrl!);
    
      this.logger.log("Generated OAuth Headers", headers);
      this.logger.debug(`RESTlet URL: ${this.netsuiteConfig.restletUrl}`);
      this.logger.debug(`Payload: ${JSON.stringify(payload)}`);
       
      const response = await axios.post(
        this.netsuiteConfig.restletUrl!,
        payload,
        { 
          headers,
          timeout: 100000 // 30 second timeout
        }
      );

      return response;
    } catch (error) {
      this.logger.error(`RESTlet call failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate OAuth 1.0 headers for NetSuite authentication
   */
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

  // 🔥 INCLUDE QUERY PARAMS (script & deploy)
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

  // 🔥 REALM MUST BE INSIDE Authorization header
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