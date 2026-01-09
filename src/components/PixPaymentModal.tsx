import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [step, setStep] = useState<'form' | 'pix'>('form');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pixCode, setPixCode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: '',
  });

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanCPF = formData.cpf.replace(/\D/g, '');
      const cleanPhone = formData.phone.replace(/\D/g, '');

      const { data, error } = await supabase.functions.invoke('sync-payments', {
        body: {
          amount,
          description: `Assinatura ${planName}`,
          client: {
            name: formData.name.trim(),
            cpf: cleanCPF,
            email: formData.email.trim(),
            phone: cleanPhone,
          },
        },
      });

      if (error) throw error;

      if (data?.pix_code) {
        setPixCode(data.pix_code);
        setStep('pix');
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
    setStep('form');
    setPixCode('');
    setFormData({ name: '', cpf: '', email: '', phone: '' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {step === 'form' ? `Assinar ${planName}` : 'Pague com PIX'}
          </DialogTitle>
        </DialogHeader>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center text-2xl font-bold" style={{ color: buttonColor }}>
              R$ {amount.toFixed(2).replace('.', ',')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                placeholder="000.000.000-00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full text-white font-bold"
              style={{ backgroundColor: buttonColor }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando PIX...
                </>
              ) : (
                'Gerar código PIX'
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
