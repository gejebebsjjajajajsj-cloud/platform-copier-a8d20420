-- Tabela para armazenar credenciais de pagamento por domínio
CREATE TABLE public.payment_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  sync_client_id TEXT NOT NULL,
  sync_client_secret TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS: Apenas admins podem gerenciar credenciais
ALTER TABLE public.payment_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment credentials"
ON public.payment_credentials
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role pode ler (para a edge function)
CREATE POLICY "Service role can read credentials"
ON public.payment_credentials
FOR SELECT
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_payment_credentials_updated_at
BEFORE UPDATE ON public.payment_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentário explicativo
COMMENT ON TABLE public.payment_credentials IS 'Armazena credenciais Sync Payments por domínio';