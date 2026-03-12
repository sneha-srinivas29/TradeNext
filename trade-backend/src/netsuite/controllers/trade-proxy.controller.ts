import {
  Controller,
  Get,
  Post,
  Req,
  Body,
  UploadedFiles,
  UseInterceptors,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NetsuiteService } from '../services/netsuite.service';
import axios from 'axios';
import type { Request } from 'express';
import https from 'https';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('proxy/trade')
export class TradeProxyController {
  private readonly httpsAgent = new https.Agent({
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  });

  constructor(
    private readonly configService: ConfigService,
    private readonly netsuiteService: NetsuiteService,
  ) {
    console.log(' TradeProxyController loaded');
  }

  // ─── Shared GET helper ────────────────────────────────────────────────────

  private async proxyGet(req: Request, apiUrl: string): Promise<any> {
    const subscriptionKey = (
      this.configService.get<string>('TRADE_API_SUBSCRIPTION_KEY') ?? ''
    ).trim();

    if (!subscriptionKey) {
      throw new HttpException(
        'Subscription key not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const accessToken = await this.netsuiteService.getValidToken();

    const params = new URLSearchParams(req.query as Record<string, string>);
    params.append('subscription-key', subscriptionKey);

    const finalUrl = `${apiUrl}?${params.toString()}`;
    console.log(' Final URL:', JSON.stringify(finalUrl));
    console.log(' Bearer token:', accessToken ? ' present' : ' missing');

    const response = await axios.get(finalUrl, {
      httpsAgent: this.httpsAgent,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    console.log(' Trade API response status:', response.status);
    return response.data;
  }

  // ─── Shared POST helper ───────────────────────────────────────────────────

  private async proxyPost(body: any, apiUrl: string): Promise<any> {
    const subscriptionKey = (
      this.configService.get<string>('TRADE_API_SUBSCRIPTION_KEY') ?? ''
    ).trim();

    if (!subscriptionKey) {
      throw new HttpException(
        'Subscription key not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const accessToken = await this.netsuiteService.getValidToken();

    const finalUrl = `${apiUrl}?subscription-key=${subscriptionKey}`;
    console.log(' POST Final URL:', JSON.stringify(finalUrl));
    console.log(' Bearer token:', accessToken ? ' present' : ' missing');
    console.log('POST body:', JSON.stringify(body, null, 2));

    const response = await axios.post(finalUrl, body, {
      httpsAgent: this.httpsAgent,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    console.log(' Trade API POST response status:', response.status);
    console.log(' Trade API POST response data:', JSON.stringify(response.data));
    return response.data;
  }

  // ─── Helper: is this a NetSuite "no data" error? ──────────────────────────
  // NetSuite restlets throw INVALID_RETURN_DATA_FORMAT when they have no
  // records to return instead of returning an empty array. We treat it as [].

  private isNetsuiteEmptyResult(err: any): boolean {
    const body = JSON.stringify(err?.response?.data || err?.message || '');
    return (
      body.includes('INVALID_RETURN_DATA_FORMAT') ||
      body.includes('SuiteScriptError')
    );
  }

  // ─── Contract Listing ─────────────────────────────────────────────────────

  @Get('v1/date-filter-api-for-contract-listing')
  async proxyContractListing(@Req() req: Request) {
    const apiUrl = (
      this.configService.get<string>('TRADE_CONTRACT_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_CONTRACT_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      return await this.proxyGet(req, apiUrl);
    } catch (err: any) {
      console.error('Contract listing error:', err?.response?.data || err.message);
      throw new HttpException(
        err?.response?.data || 'Contract listing error',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ─── SO Listing ───────────────────────────────────────────────────────────

  @Get('v1/so-listing')
  async proxySoListing(@Req() req: Request) {
    const apiUrl = (
      this.configService.get<string>('TRADE_SALES_ORDER_LISTING_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_SALES_ORDER_LISTING_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      return await this.proxyGet(req, apiUrl);
    } catch (err: any) {
      console.error('SO listing error:', err?.response?.data || err.message);
      throw new HttpException(
        err?.response?.data || 'SO listing error',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ─── Billing Address ──────────────────────────────────────────────────────

  @Get('v1/billing-address')
  async proxyBillingAddress(@Req() req: Request) {
    const apiUrl = (
      this.configService.get<string>('TRADE_SALES_ORDER_BILLING_ADDRESS_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_SALES_ORDER_BILLING_ADDRESS_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      return await this.proxyGet(req, apiUrl);
    } catch (err: any) {
      console.error(' Billing address error:', err?.response?.data || err.message);
      throw new HttpException(
        err?.response?.data || 'Billing address error',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ─── Shipping Address ─────────────────────────────────────────────────────

  @Get('v1/shipping-address')
  async proxyShippingAddress(@Req() req: Request) {
    const apiUrl = (
      this.configService.get<string>('TRADE_SALES_ORDER_SHIPPING_ADDRESS_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_SALES_ORDER_SHIPPING_ADDRESS_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      return await this.proxyGet(req, apiUrl);
    } catch (err: any) {
      console.error('Shipping address error:', err?.response?.data || err.message);
      throw new HttpException(
        err?.response?.data || 'Shipping address error',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ─── Contract Details ─────────────────────────────────────────────────────

  @Get('v1/contract-details')
  async proxyContractDetails(@Req() req: Request) {
    const apiUrl = (
      this.configService.get<string>('TRADE_SALES_ORDER_CONTRACT_DETAILS_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_SALES_ORDER_CONTRACT_DETAILS_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      return await this.proxyGet(req, apiUrl);
    } catch (err: any) {
      console.error('Contract details error:', err?.response?.data || err.message);
      throw new HttpException(
        err?.response?.data || 'Contract details error',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ─── Contract Item Details ────────────────────────────────────────────────

  @Get('v1/contract-item-details')
  async proxyContractItemDetails(@Req() req: Request) {
    const apiUrl = (
      this.configService.get<string>('TRADE_CONTRACT_ITEM_DETAILS_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_CONTRACT_ITEM_DETAILS_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      return await this.proxyGet(req, apiUrl);
    } catch (err: any) {
      console.error(' Contract item details error:', err?.response?.data || err.message);
      throw new HttpException(
        err?.response?.data || 'Contract item details error',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ─── Supplier Details ─────────────────────────────────────────────────────

  @Get('v1/supplier-details')
  async proxySupplierDetails(@Req() req: Request) {
    const apiUrl = (
      this.configService.get<string>('TRADE_SALES_ORDER_SUPPLIER_DETAILS_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_SALES_ORDER_SUPPLIER_DETAILS_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      return await this.proxyGet(req, apiUrl);
    } catch (err: any) {
      console.error('Supplier details error:', err?.response?.data || err.message);
      throw new HttpException(
        err?.response?.data || 'Supplier details error',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ─── Supplier Address ─────────────────────────────────────────────────────

  @Get('v1/supplier-address')
  async proxySupplierAddress(@Req() req: Request) {
    const apiUrl = (
      this.configService.get<string>('TRADE_SALES_ORDER_SUPPLIER_ADDRESS_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_SALES_ORDER_SUPPLIER_ADDRESS_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      return await this.proxyGet(req, apiUrl);
    } catch (err: any) {
      console.error('Supplier address error:', err?.response?.data || err.message);
      throw new HttpException(
        err?.response?.data || 'Supplier address error',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ─── HSN Code ─────────────────────────────────────────────────────────────

  @Get('v1/get-hsn-code-based-on-item')
  async proxyHsnCode(@Req() req: Request) {
    const apiUrl = (
      this.configService.get<string>('TRADE_SALES_ORDER_HSN_CODE_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_SALES_ORDER_HSN_CODE_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      return await this.proxyGet(req, apiUrl);
    } catch (err: any) {
      console.error('HSN code error:', err?.response?.data || err.message);
      throw new HttpException(
        err?.response?.data || 'HSN code error',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ─── Tax Registration ─────────────────────────────────────────────────────

  @Get('v1/tax-registration')
  async proxyTaxRegistration(@Req() req: Request) {
    const apiUrl = (
      this.configService.get<string>('TRADE_SALES_ORDER_TAX_REGISTRATION_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_SALES_ORDER_TAX_REGISTRATION_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      return await this.proxyGet(req, apiUrl);
    } catch (err: any) {
      console.error('Tax registration error:', err?.response?.data || err.message);
      throw new HttpException(
        err?.response?.data || 'Tax registration error',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ─── SO Summary ───────────────────────────────────────────────────────────

  @Get('v1/so-summary')
  async proxySoSummary(@Req() req: Request) {
    const apiUrl = (
      this.configService.get<string>('TRADE_SALES_ORDER_SUMMARY_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_SALES_ORDER_SUMMARY_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const soId = (req.query['SoID'] || req.query['id'] || '') as string;

    if (!soId) {
      throw new HttpException('SoID query param is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const subscriptionKey = (
        this.configService.get<string>('TRADE_API_SUBSCRIPTION_KEY') ?? ''
      ).trim();

      if (!subscriptionKey) {
        throw new HttpException(
          'Subscription key not configured',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const accessToken = await this.netsuiteService.getValidToken();

      const finalUrl = `${apiUrl}?SoID=${encodeURIComponent(soId)}&subscription-key=${encodeURIComponent(subscriptionKey)}`;
      console.log('SO Summary URL:', finalUrl);

      const response = await axios.get(finalUrl, {
        httpsAgent: this.httpsAgent,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      console.log(' SO Summary response status:', response.status);
      return response.data;
    } catch (err: any) {
      console.error('SO summary error:', err?.response?.data || err.message);
      throw new HttpException(
        err?.response?.data || 'SO summary error',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ─── UOM ──────────────────────────────────────────────────────────────────

  @Get('v1/get-uom')
  async proxyUom(@Req() req: Request) {
    const apiUrl = (
      this.configService.get<string>('TRADE_SALES_ORDER_UOM_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_SALES_ORDER_UOM_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      return await this.proxyGet(req, apiUrl);
    } catch (err: any) {
      console.error('UOM error:', err?.response?.data || err.message);
      throw new HttpException(
        err?.response?.data || 'UOM error',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ─── PO Listing ───────────────────────────────────────────────────────────

  @Get('v1/po-listing')
  async proxyPurchaseOrderListing(@Req() req: Request) {
    const apiUrl = (
      this.configService.get<string>('TRADE_PURCHASE_ORDER_LISTING_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_PURCHASE_ORDER_LISTING_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      return await this.proxyGet(req, apiUrl);
    } catch (err: any) {
      console.error('PO Listing error:', err?.response?.data || err.message);
      throw new HttpException(
        err?.response?.data || 'PO Listing error',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ─── Sales Order Creation (POST) ──────────────────────────────────────────

  @Post('v1/SalesOrderCreation')
  async proxyCreateSalesOrder(@Body() body: any) {
    const apiUrl = (
      this.configService.get<string>('TRADE_SALES_ORDER_CREATION_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_SALES_ORDER_CREATION_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const result = await this.proxyPost(body, apiUrl);

      if (result?.success && result?.data) {
        return result;
      }

      return { success: true, data: result };
    } catch (err: any) {
      console.error('Sales order creation error:', err?.response?.data || err.message);
      throw new HttpException(
        err?.response?.data || 'Sales order creation failed',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ─── PO Supplier Details (Vendor Master) ─────────────────────────────────

  @Get('v1/supplier-details-vendor-master')
  async proxyPurchaseOrderSupplierDetails(@Req() req: Request) {
    const apiUrl = (
      this.configService.get<string>('TRADE_PURCHASE_ORDER_SUPPLIER_DETAILS_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_PURCHASE_ORDER_SUPPLIER_DETAILS_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      return await this.proxyGet(req, apiUrl);
    } catch (err: any) {
      console.error('PO Supplier Details error:', err?.response?.data || err.message);
      throw new HttpException(
        err?.response?.data || 'PO Supplier Details error',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ─── Item Fulfillment Listing ─────────────────────────────────────────────

  @Get('v1/if-listing')
  async proxyItemFulfillmentListing(@Req() req: Request) {
    const apiUrl = (
      this.configService.get<string>('TRADE_ITEM_FULFILLMENT_LISTING_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_ITEM_FULFILLMENT_LISTING_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      return await this.proxyGet(req, apiUrl);
    } catch (err: any) {
      const errBody = JSON.stringify(err?.response?.data || err?.message || '');
      console.error('Item Fulfillment Listing error:', errBody);
      // NetSuite throws INVALID_RETURN_DATA_FORMAT when no records exist for the SO ID
      // Return [] so the frontend shows "no records" instead of an error
      if (this.isNetsuiteEmptyResult(err)) {
        return [];
      }
      throw new HttpException(
        err?.response?.data || 'Item Fulfillment Listing error',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ─── Sales Invoice Listing ────────────────────────────────────────────────

  @Get('v1/sales-invoice-listing')
  async proxySalesInvoiceListing(@Req() req: Request) {
    const apiUrl = (
      this.configService.get<string>('TRADE_SALES_INVOICE_LISTING_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_SALES_INVOICE_LISTING_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      return await this.proxyGet(req, apiUrl);
    } catch (err: any) {
      const errBody = JSON.stringify(err?.response?.data || err?.message || '');
      console.error('Sales Invoice Listing error:', errBody);
      // NetSuite throws INVALID_RETURN_DATA_FORMAT when no records exist
      if (this.isNetsuiteEmptyResult(err)) {
        return [];
      }
      throw new HttpException(
        err?.response?.data || 'Sales Invoice Listing error',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ─── Item Fulfillment Creation (POST) ─────────────────────────────────────

  // @Post('v1/ItemFulfillmentCreation')
  // async proxyCreateItemFulfillment(@Body() body: any) {
  //   const apiUrl = (
  //     this.configService.get<string>('TRADE_ITEM_FULLFILLMENT_CREATION_API_URL') ?? ''
  //   ).trim();

  //   if (!apiUrl) {
  //     throw new HttpException(
  //       'TRADE_ITEM_FULLFILLMENT_CREATION_API_URL not configured',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }

  //   try {
  //     const result = await this.proxyPost(body, apiUrl);

  //     if (result?.success && result?.data) {
  //       return result;
  //     }

  //     return { success: true, data: result };
  //   } catch (err: any) {
  //     console.error('Item Fulfillment creation error:', err?.response?.data || err.message);
  //     throw new HttpException(
  //       err?.response?.data || 'Item Fulfillment creation failed',
  //       err?.response?.status || HttpStatus.BAD_GATEWAY,
  //     );
  //   }
  // }




//   @Post('v1/ItemFulfillmentCreation')
// @UseInterceptors(
//   FileFieldsInterceptor([
//     { name: 'proofOfShipment', maxCount: 1 },
//     { name: 'supplierBillFile', maxCount: 1 },
//     { name: 'eWaybill', maxCount: 1 },
//   ])
// )
// async proxyCreateItemFulfillment(
//   @UploadedFiles() files: any,
//   @Body() body: any,
// ) {

//   const apiUrl = (
//     this.configService.get<string>('TRADE_ITEM_FULLFILLMENT_CREATION_API_URL') ?? ''
//   ).trim();

//   if (!apiUrl) {
//     throw new HttpException(
//       'TRADE_ITEM_FULLFILLMENT_CREATION_API_URL not configured',
//       HttpStatus.INTERNAL_SERVER_ERROR,
//     );
//   }

//   try {

//     // convert string → JSON
//     if (body.lineItems) {
//       body.lineItems = JSON.parse(body.lineItems);
//     }

//     console.log("BODY:", body);
//     console.log("FILES:", files);

//     const result = await this.proxyPost(body, apiUrl);

//     return result?.success ? result : { success: true, data: result };

//   } catch (err: any) {

//     console.error(
//       'Item Fulfillment creation error:',
//       err?.response?.data || err.message
//     );

//     throw new HttpException(
//       err?.response?.data || 'Item Fulfillment creation failed',
//       err?.response?.status || HttpStatus.BAD_GATEWAY,
//     );
//   }
// }

@Post('v1/ItemFulfillmentCreation')
async proxyCreateItemFulfillment(
  @Body() body: any,
) {
  const apiUrl = (
    this.configService.get<string>('TRADE_ITEM_FULLFILLMENT_CREATION_API_URL') ?? ''
  ).trim();

  if (!apiUrl) {
    throw new HttpException(
      'TRADE_ITEM_FULLFILLMENT_CREATION_API_URL not configured',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  try {
    // Body arrives as pure JSON — frontend builds the payload shape directly.
    // Just forward it straight to the Trade API.
    console.log('ItemFulfillment PAYLOAD →', JSON.stringify(body, null, 2));

    const result = await this.proxyPost(body, apiUrl);
    return result?.success ? result : { success: true, data: result };

  } catch (err: any) {
    console.error('Item Fulfillment creation error:', err?.response?.data || err.message);
    throw new HttpException(
      err?.response?.data || 'Item Fulfillment creation failed',
      err?.response?.status || HttpStatus.BAD_GATEWAY,
    );
  }
}
  // ─── GRN Listing ─────────────────────────────────────────────────────────
  // API: https://nonprodapi.samunnati.com/trade/v1/date-api-for-grn-listing
  // Params: fromdate, todate, contractID, className
  // .env: TRADE_GOODS_RECIEPT_NOTE_LISTING_API_URL=https://nonprodapi.samunnati.com/trade/v1/date-api-for-grn-listing

  @Get('v1/grn-listing')
  async proxyGrnListing(@Req() req: Request) {
    const apiUrl = (
      this.configService.get<string>('TRADE_GOODS_RECIEPT_NOTE_LISTING_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_GOODS_RECIEPT_NOTE_LISTING_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      return await this.proxyGet(req, apiUrl);
    } catch (err: any) {
      const errBody = JSON.stringify(err?.response?.data || err?.message || '');
      console.error('GRN Listing error:', errBody);
      if (this.isNetsuiteEmptyResult(err)) {
        return [];
      }
      throw new HttpException(
        err?.response?.data || 'GRN Listing error',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }


  // ─── Sales Order Summary ─────────────────────────────────────────────────
 @Get('v1/sales-order-summary')
async proxySalesOrderSummary(@Req() req: Request, @Query('SoID') soId: string) {
  const apiUrl = (
    this.configService.get<string>('TRADE_ITEM_FULFILLMENT_SALES_ORDER_SUMMARY') ?? ''
  ).trim();

  if (!apiUrl) {
    throw new HttpException(
      'TRADE_ITEM_FULFILLMENT_SALES_ORDER_SUMMARY not configured',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  if (!soId) {
    throw new HttpException('SoID query param is required', HttpStatus.BAD_REQUEST);
  }

  try {
    // Forward with SoID param to NetSuite restlet
    const result = await this.proxyGet(req, apiUrl);

    // result is array — extract items[] from matching SO
    const records = Array.isArray(result) ? result : [result];
    const soRecord = records.find((r: any) => r.InternalID === soId) ?? records[0];

    return {
      success: true,
      soRecord,
      items: soRecord?.items ?? [],       // ← items with item_unique_id
    };

  } catch (err: any) {
    const errBody = JSON.stringify(err?.response?.data || err?.message || '');
    console.error('Sales Order Summary error:', errBody);

    if (this.isNetsuiteEmptyResult(err)) {
      return { success: true, items: [] };
    }

    throw new HttpException(
      err?.response?.data || 'Sales Order Summary error',
      err?.response?.status || HttpStatus.BAD_GATEWAY,
    );
  }
}

  // ─── Purchase Bill Listing ────────────────────────────────────────────────

  @Get('v1/purchase-bill-listing')
  async proxyPurchaseBillListing(@Req() req: Request) {
    const apiUrl = (
      this.configService.get<string>('TRADE_PURCHASE_BILL_lISTING_API_URL') ?? ''
    ).trim();

    if (!apiUrl) {
      throw new HttpException(
        'TRADE_PURCHASE_BILL_lISTING_API_URL not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      return await this.proxyGet(req, apiUrl);
    } catch (err: any) {
      const errBody = JSON.stringify(err?.response?.data || err?.message || '');
      console.error('Purchase Bill Listing error:', errBody);
      if (this.isNetsuiteEmptyResult(err)) {
        return [];
      }
      throw new HttpException(
        err?.response?.data || 'Purchase Bill Listing error',
        err?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }
}