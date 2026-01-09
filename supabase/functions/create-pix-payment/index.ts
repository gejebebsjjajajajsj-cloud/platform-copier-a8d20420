import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYNC_PAYMENTS_BASE_URL = "https://api.syncpayments.com.br";

interface PaymentRequest {
  amount: number;
  planName: string;
  customerName: string;
  customerCpf: string;
  customerEmail: string;
  customerPhone: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("SYNC_PAYMENTS_CLIENT_ID");
    const clientSecret = Deno.env.get("SYNC_PAYMENTS_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      console.error("Missing Sync Payments credentials");
      return new Response(
        JSON.stringify({ error: "Payment configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Get auth token
    console.log("Getting auth token from Sync Payments...");
    const authResponse = await fetch(`${SYNC_PAYMENTS_BASE_URL}/api/partner/v1/auth-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error("Auth failed:", authResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Authentication failed with payment provider" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    console.log("Auth token obtained successfully");

    // Step 2: Get payment data from request
    const paymentData: PaymentRequest = await req.json();
    console.log("Creating payment for:", paymentData.planName, "Amount:", paymentData.amount);

    // Step 3: Create cash-in (PIX payment)
    const cashInResponse = await fetch(`${SYNC_PAYMENTS_BASE_URL}/api/partner/v1/cash-in`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: paymentData.amount,
        description: `Assinatura ${paymentData.planName}`,
        client: {
          name: paymentData.customerName,
          cpf: paymentData.customerCpf.replace(/\D/g, ""),
          email: paymentData.customerEmail,
          phone: paymentData.customerPhone.replace(/\D/g, ""),
        },
      }),
    });

    if (!cashInResponse.ok) {
      const errorText = await cashInResponse.text();
      console.error("Cash-in failed:", cashInResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create payment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cashInData = await cashInResponse.json();
    console.log("Payment created successfully:", cashInData.identifier);

    return new Response(
      JSON.stringify({
        success: true,
        pix_code: cashInData.pix_code,
        identifier: cashInData.identifier,
        message: cashInData.message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Payment error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
