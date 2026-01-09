import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Loader2, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planPrice: string;
  primaryColor?: string;
}

const PaymentModal = ({ isOpen, onClose, planName, planPrice, primaryColor = '#f97316' }: PaymentModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pixCode, setPixCode] = useState('');
  const [error, setError] = useState(false);

  const parsePrice = (price: string): number => {
    const cleaned = price.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  useEffect(() => {
    if (isOpen) {
      generatePayment();
    }
  }, [isOpen]);

  const generatePayment = async () => {
    setLoading(true);
    setError(false);

    try {
      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          amount: parsePrice(planPrice),
          planName: planName,
        },
      });

      if (error) throw error;

      if (data?.pix_code) {
        setPixCode(data.pix_code);
      } else {
        throw new Error('PIX code not received');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(true);
      toast({
        title: "Erro",
        description: "Erro ao gerar pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para a área de transferência",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o código",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setPixCode('');
    setLoading(true);
    setError(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className="p-4 text-white flex items-center justify-between"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
          >
            <div>
              <h2 className="text-lg font-bold">Assinatura {planName}</h2>
              <p className="text-white/90 text-sm">{planPrice}</p>
            </div>
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {loading && (
              <div className="py-12 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin" style={{ color: primaryColor }} />
                <p className="mt-4 text-gray-600 font-medium">Gerando seu PIX...</p>
              </div>
            )}

            {error && !loading && (
              <div className="py-8 text-center">
                <p className="text-red-500 mb-4">Erro ao gerar pagamento</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generatePayment}
                  className="px-6 py-3 text-white font-bold rounded-xl"
                  style={{ background: primaryColor }}
                >
                  Tentar novamente
                </motion.button>
              </div>
            )}

            {!loading && !error && pixCode && (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="bg-gray-100 p-6 rounded-2xl">
                    <QrCode className="w-32 h-32 text-gray-800" />
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Copie o código PIX abaixo:</p>
                  <div className="bg-gray-100 p-3 rounded-xl text-xs break-all text-gray-700 max-h-24 overflow-y-auto">
                    {pixCode}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={copyPixCode}
                  className="w-full py-4 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                  style={{ background: copied ? '#22c55e' : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copiar código PIX
                    </>
                  )}
                </motion.button>

                <p className="text-center text-xs text-gray-500">
                  Após o pagamento, seu acesso será liberado automaticamente.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;
