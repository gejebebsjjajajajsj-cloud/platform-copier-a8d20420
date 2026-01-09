import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Check, Loader2 } from 'lucide-react';

interface PixPaymentModalProps {
  open: boolean;
  onClose: () => void;
  planName: string;
  amount: number;
  buttonColor?: string;
}

export const PixPaymentModal = ({ open, onClose, planName, amount, buttonColor = '#f97316' }: PixPaymentModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pixCode, setPixCode] = useState('');

  // Gera o PIX automaticamente ao abrir o modal
  useEffect(() => {
    if (open && !pixCode && !loading) {
      generatePix();
    }
  }, [open]);

  const generatePix = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('sync-payments', {
        body: {
          amount,
          description: `Assinatura ${planName}`,
          client: {
            name: 'Cliente',
            cpf: '00000000000',
            email: 'cliente@email.com',
            phone: '11999999999',
          },
        },
      });

      if (error) throw error;

      if (data?.pix_code) {
        setPixCode(data.pix_code);
      } else {
        throw new Error('Código PIX não recebido');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Erro no pagamento',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast({ title: 'Código PIX copiado!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Erro ao copiar', variant: 'destructive' });
    }
  };

  const handleClose = () => {
    setPixCode('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Pague com PIX</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center text-2xl font-bold" style={{ color: buttonColor }}>
            R$ {amount.toFixed(2).replace('.', ',')}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: buttonColor }} />
              <p className="text-sm text-muted-foreground">Gerando código PIX...</p>
            </div>
          ) : pixCode ? (
            <>
              <div className="text-center text-sm text-muted-foreground">
                Copie o código abaixo e cole no app do seu banco
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-xs break-all font-mono">{pixCode}</p>
              </div>

              <Button
                onClick={copyPixCode}
                className="w-full text-white font-bold"
                style={{ backgroundColor: buttonColor }}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar código PIX
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                O pagamento será confirmado automaticamente
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <p className="text-sm text-muted-foreground">Erro ao gerar PIX</p>
              <Button onClick={generatePix} variant="outline">
                Tentar novamente
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};