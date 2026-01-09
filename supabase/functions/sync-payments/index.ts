import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-origin-domain",
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

interface Credentials {
  sync_client_id: string;
  sync_client_secret: string;
}

async function getCredentialsByDomain(domain: string): Promise<Credentials | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Busca credenciais pelo domínio
  const { data, error } = await supabase
    .from("payment_credentials")
    .select("sync_client_id, sync_client_secret")
    .eq("domain", domain)
    .eq("is_active", true)
    .single();
  
  if (error || !data) {
    console.log(`No credentials found for domain: ${domain}`);
    return null;
  }
  
  return data;
}

async function getAccessToken(credentials: Credentials): Promise<string> {
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

    // Pega o domínio do header ou do referer
    let domain = req.headers.get("x-origin-domain");
    if (!domain) {
      const referer = req.headers.get("referer") || req.headers.get("origin");
      if (referer) {
        try {
          const url = new URL(referer);
          domain = url.hostname;
        } catch {
          domain = null;
        }
      }
    }

    console.log("Request domain:", domain);

    let credentials: Credentials | null = null;

    // Se tem domínio, tenta buscar credenciais específicas
    if (domain) {
      credentials = await getCredentialsByDomain(domain);
    }

    // Fallback para secrets globais se não encontrar no banco
    if (!credentials) {
      const clientId = Deno.env.get("SYNC_PAYMENTS_CLIENT_ID");
      const clientSecret = Deno.env.get("SYNC_PAYMENTS_CLIENT_SECRET");
      
      if (!clientId || !clientSecret) {
        throw new Error("Credenciais do Sync Payments não configuradas para este domínio");
      }
      
      credentials = {
        sync_client_id: clientId,
        sync_client_secret: clientSecret,
      };
      console.log("Using fallback global credentials");
    } else {
      console.log("Using domain-specific credentials for:", domain);
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
