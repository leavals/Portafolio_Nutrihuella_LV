// src/services/transbank.ts
// ---------------------------------------------------------
// Servicio de integración con Transbank Webpay Plus (REST)
// - Import correcto para CJS en runtime ESM
// - Soporta Integration y Production vía env
// - Expone helpers: webpayInitPlus, webpayCommitPlus
// ---------------------------------------------------------
import crypto from "node:crypto";
import { env } from "../env.ts";

// IMPORTANTE: transbank-sdk es CommonJS -> importar default y desestructurar
import tbk from "transbank-sdk";
const {
  WebpayPlus,
  Options,
  Environment,
  IntegrationCommerceCodes,
  IntegrationApiKeys,
} = tbk as typeof import("transbank-sdk");

// Construye Options según ambiente
function buildOptions(): InstanceType<typeof Options> {
  if (env.TBK_ENV === "integration") {
    const commerceCode = env.TBK_COMMERCE_CODE || IntegrationCommerceCodes.WEBPAY_PLUS;
    const apiKey       = env.TBK_API_KEY      || IntegrationApiKeys.WEBPAY;
    return new Options(commerceCode, apiKey, Environment.Integration);
  }
  // Producción: requiere credenciales reales
  if (!env.TBK_COMMERCE_CODE || !env.TBK_API_KEY) {
    throw new Error("Faltan TBK_COMMERCE_CODE / TBK_API_KEY para Production");
  }
  return new Options(env.TBK_COMMERCE_CODE, env.TBK_API_KEY, Environment.Production);
}

// Crea transacción Webpay Plus (monto entero en CLP)
export async function webpayInitPlus(params: {
  userId: string;
  amount: number; // CLP
}) {
  const { userId, amount } = params;

  // buyOrder <= 26 chars recomendado
  const buyOrder = `NH-${Date.now().toString().slice(-10)}-${crypto.randomInt(1000, 9999)}`;
  const sessionId = `${userId}-${Date.now()}`;
  const returnUrl = env.TBK_RETURN_URL; // Donde TBK redirige con token_ws

  const tx = new WebpayPlus.Transaction(buildOptions());
  const resp = await tx.create(buyOrder, sessionId, amount, returnUrl);
  // resp: { token, url }

  return {
    buyOrder,
    sessionId,
    amount,
    token: resp.token,
    url: resp.url,
    returnUrl,
  };
}

// Confirma transacción usando token_ws
export async function webpayCommitPlus(token: string) {
  const tx = new WebpayPlus.Transaction(buildOptions());
  const resp = await tx.commit(token);
  // resp típico: {
  //   vci, amount, status, buy_order, session_id,
  //   card_detail: { card_number }, accounting_date, transaction_date,
  //   authorization_code, payment_type_code, response_code, installments_number
  // }
  return resp;
}
