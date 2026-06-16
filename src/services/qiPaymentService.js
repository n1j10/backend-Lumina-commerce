import axios from "axios";
import crypto from "crypto";

function generateRequestId() {
  return crypto.randomUUID();
}

export class QiPaymentService {
  constructor() {
    this.baseUrl =
      process.env.QICARD_BASE_URL || "https://uat-sandbox-3ds-api.qi.iq/api/v1";
    this.username = process.env.QICARD_USERNAME || "";
    this.password = process.env.QICARD_PASSWORD || "";
    this.terminalId = process.env.QICARD_TERMINAL_ID || "";
    this.currency = process.env.QICARD_CURRENCY || "USD";
    this.locale = process.env.QICARD_LOCALE || "en_US";
  }

  isConfigured() {
    return Boolean(this.username && this.password && this.terminalId);
  }

  async createPayment({ amount, orderId, finishUrl, notificationUrl }) {
    const requestId = generateRequestId();

    if (!this.isConfigured()) {
      return {
        requestId,
        paymentUrl: finishUrl,
        mock: true,
      };
    }

    const payload = {
      requestId,
      amount: Math.round(amount * 100),
      currency: this.currency,
      locale: this.locale,
      terminalId: this.terminalId,
      finishPaymentUrl: finishUrl,
      notificationUrl,
      additionalInfo: {
        orderId,
      },
    };

    const response = await axios.post(`${this.baseUrl}/payment`, payload, {
      auth: {
        username: this.username,
        password: this.password,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = response.data?.result || response.data;

    return {
      requestId,
      paymentUrl: result.formUrl || result.paymentUrl,
      raw: result,
    };
  }
}

export const qiPaymentService = new QiPaymentService();
