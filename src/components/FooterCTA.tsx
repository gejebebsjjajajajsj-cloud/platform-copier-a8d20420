import { useState } from 'react';
import { motion } from 'framer-motion';
import { SiteSettings } from '@/hooks/useSiteSettings';
import { PixPaymentModal } from './PixPaymentModal';

interface FooterCTAProps {
  settings?: SiteSettings | null;
}

const FooterCTA = ({ settings }: FooterCTAProps) => {
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const primaryColor = settings?.primary_button_color || '#f97316';
  const secondaryColor = settings?.secondary_button_color || '#ea580c';

  const parsePrice = (priceStr: string): number => {
    const cleaned = priceStr.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const amount = parsePrice(settings?.footer_button_price || 'R$ 9,90');

  return (
    <div className="py-6">
      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setPixModalOpen(true)}
        className="relative w-full text-white rounded-xl p-4 flex items-center justify-between shadow-lg hover:shadow-xl transition-shadow overflow-hidden animate-pulse-glow"
        style={{ 
          background: `linear-gradient(to bottom, ${primaryColor}, ${secondaryColor})` 
        }}
      >
        {/* Shimmer Effect */}
        <div className="absolute top-0 -left-[60%] w-[40%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] animate-shimmer pointer-events-none" />
        
        <span className="text-base font-bold z-10">
          {settings?.footer_button_text || 'Veja tudo por apenas'}
        </span>
        <span className="text-xl font-extrabold z-10 flex items-center gap-1">
          {settings?.footer_button_price || 'R$ 9,90'} <span className="font-black">→</span>
        </span>
      </motion.button>

      <PixPaymentModal
        open={pixModalOpen}
        onClose={() => setPixModalOpen(false)}
        planName="Promocional"
        amount={amount}
        buttonColor={primaryColor}
      />

      {/* Legal Links */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
        <a href="#" className="hover:text-primary transition-colors">Termos de Uso</a>
        <span>•</span>
        <a href="#" className="hover:text-primary transition-colors">Política de Privacidade</a>
      </div>
    </div>
  );
};

export default FooterCTA;
