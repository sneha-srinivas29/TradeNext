// export default () => ({
//   webhookSecret: process.env.WEBHOOK_SECRET,
//   netsuite: {
//     accountId: process.env.NETSUITE_ACCOUNT_ID,
//     consumerKey: process.env.NETSUITE_CONSUMER_KEY,
//     consumerSecret: process.env.NETSUITE_CONSUMER_SECRET,
//     tokenId: process.env.NETSUITE_TOKEN_ID,
//     tokenSecret: process.env.NETSUITE_TOKEN_SECRET,
//     restletUrl: process.env.NETSUITE_RESTLET_URL,
//     penaltyRestletUrl: process.env.NETSUITE_PENALTY_RESTLET_URL,
//     penaltyInvoiceRestletUrl: process.env.NETSUITE_PENALTY_INVOICE_RESTLET_URL, // NEW
//     penaltyBillCreditRestletUrl: process.env.NETSUITE_PENALTY_BILLCREDIT_RESTLET_URL, // NEW
//     reconciliationRestletUrl: process.env.NETSUITE_RESTLET_RECONCILIATION_URL,
//     penaltyInvoiceBackendRestletUrl: process.env.NETSUITE_RESTLET_PENALTY_INVOICE_BACKEND_URL,
//     penaltyBillCreditBackendRestletUrl: process.env.NETSUITE_RESTLET_PENALTY_BILLCREDIT_BACKEND_URL,
//   },
// });


// export default () => ({
//   port: parseInt(process.env.PORT || '8080', 10),
//   nodeEnv: process.env.NODE_ENV || 'development',

//   database: {
//     // Ensuring this is never undefined for Mongoose
//     uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trade-tech-uatdb',
//   },

//   jwt: {
//     secret: process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
//     expiresIn: process.env.JWT_EXPIRATION || '7d',
//     refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
//     refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d',
//   },

//   webhook: {
//     secret: process.env.WEBHOOK_SECRET || '',
//   },

//   netsuite: {
//     accountId: process.env.NETSUITE_ACCOUNT_ID || '',
//     consumerKey: process.env.NETSUITE_CONSUMER_KEY || '',
//     consumerSecret: process.env.NETSUITE_CONSUMER_SECRET || '',
//     tokenId: process.env.NETSUITE_TOKEN_ID || '',
//     tokenSecret: process.env.NETSUITE_TOKEN_SECRET || '',

//     restletUrl: process.env.NETSUITE_RESTLET_URL || '',
//     tokenUrl: process.env.NETSUITE_TOKEN_URL || '',
//     reconciliationUrl: process.env.NETSUITE_RESTLET_RECONCILIATION_URL || '',
//     penaltyInvoiceUrl: process.env.NETSUITE_RESTLET_PENALTY_INVOICE_BACKEND_URL || '',
//   },

//   basicAuth: {
//     username: process.env.USERNAME || 'admin',
//     password: process.env.PASSWORD || 'password',
//   },

//   urls: {
//     frontendLocal: process.env.FRONTEND_URL_LOCAL || 'http://localhost:8080',
//     frontendNetwork: process.env.FRONTEND_URL_NETWORK || 'http://192.168.12.98:8080',
//   },

//   cors: {
//     allowedOrigins: [
//       process.env.FRONTEND_URL_LOCAL || 'http://localhost:8080',
//       process.env.FRONTEND_URL_NETWORK || 'http://192.168.12.98:8080',
//     ].filter(Boolean) as string[],
//   },
// });

export default () => ({
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trade-tech-uatdb',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
    expiresIn: process.env.JWT_EXPIRATION || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d',
  },

  webhook: {
    secret: process.env.WEBHOOK_SECRET || '',
  },

  netsuite: {
    accountId: process.env.NETSUITE_ACCOUNT_ID || '',
    consumerKey: process.env.NETSUITE_CONSUMER_KEY || '',
    consumerSecret: process.env.NETSUITE_CONSUMER_SECRET || '',
    tokenId: process.env.NETSUITE_TOKEN_ID || '',
    tokenSecret: process.env.NETSUITE_TOKEN_SECRET || '',
    restletUrl: process.env.NETSUITE_RESTLET_URL || '',
    tokenUrl: process.env.NETSUITE_TOKEN_URL || '',
    reconciliationUrl:
      process.env.NETSUITE_RESTLET_RECONCILIATION_URL || '',
    penaltyInvoiceUrl:
      process.env.NETSUITE_RESTLET_PENALTY_INVOICE_BACKEND_URL || '',
  },

  // ✅ ADD THIS
  tradeApi: {
    baseUrl:
      process.env.TRADE_API_BASE_URL || 'https://nonprodapi.samunnati.com',
    subscriptionKey: process.env.TRADE_API_SUBSCRIPTION_KEY || '',
  },

  basicAuth: {
    username: process.env.USERNAME || 'admin',
    password: process.env.PASSWORD || 'password',
  },

  urls: {
    frontendLocal: process.env.FRONTEND_URL_LOCAL || 'http://localhost:8080',
    frontendNetwork:
      process.env.FRONTEND_URL_NETWORK || 'http://192.168.12.98:8080',
  },

  cors: {
    allowedOrigins: [
      process.env.FRONTEND_URL_LOCAL || 'http://localhost:8080',
      process.env.FRONTEND_URL_NETWORK || 'http://192.168.12.98:8080',
    ].filter(Boolean) as string[],
  },
});