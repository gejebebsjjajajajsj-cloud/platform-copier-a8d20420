import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYNC_API_BASE = "https://api.syncpayments.com.br";

interface CashInRequest {
  amount: number;
  description: string;
  webhook_url?: string;
  client: {
    name: string;
    cpf: string;
    email: string;
    phone: string;
  };
}

function getCredentials(): { sync_client_id: string; sync_client_secret: string } | null {
  const sync_client_id = Deno.env.get("SYNC_PAYMENTS_CLIENT_ID");
  const sync_client_secret = Deno.env.get("SYNC_PAYMENTS_CLIENT_SECRET");
  
  if (!sync_client_id || !sync_client_secret) {
    return null;
  }
  
  return { sync_client_id, sync_client_secret };
}

async function getAccessToken(credentials: { sync_client_id: string; sync_client_secret: string }): Promise<string> {
  const response = await fetch(`${SYNC_API_BASE}/api/partner/v1/auth-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: credentials.sync_client_id,
      client_secret: credentials.sync_client_secret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Auth error:", error);
    throw new Error("Falha na autenticação com Sync Payments");
  }

  const data = await response.json();
  return data.access_token;
}

async function createCashIn(token: string, request: CashInRequest) {
  const response = await fetch(`${SYNC_API_BASE}/api/partner/v1/cash-in`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: request.amount,
      description: request.description,
      webhook_url: request.webhook_url,
      client: request.client,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Cash-in error:", error);
    throw new Error("Falha ao criar cobrança PIX");
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, description, client } = await req.json();

    if (!amount || !client?.name || !client?.cpf || !client?.email || !client?.phone) {
      return new Response(
        JSON.stringify({ error: "Dados incompletos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Busca credenciais dos secrets
    const credentials = getCredentials();

    if (!credentials) {
      return new Response(
        JSON.stringify({ error: "Credenciais do Sync Payments não configuradas. Configure no painel admin." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get access token
    const token = await getAccessToken(credentials);

    // Create cash-in (PIX)
    const result = await createCashIn(token, {
      amount,
      description: description || "Assinatura Premium",
      client,
    });

    return new Response(
      JSON.stringify({
        success: true,
        pix_code: result.pix_code,
        identifier: result.identifier,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
