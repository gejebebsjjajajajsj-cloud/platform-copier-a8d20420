import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Zap, ChevronDown, Crown } from 'lucide-react';
import { SiteSettings } from '@/hooks/useSiteSettings';

interface Plan {
  id: string;
  name: string;
  price: string;
  badge?: string;
  badgeType?: 'popular' | 'best' | 'premium';
  featured?: boolean;
}

interface SubscriptionCardProps {
  settings?: SiteSettings | null;
}

const SubscriptionCard = ({ settings }: SubscriptionCardProps) => {
  const [showPromos, setShowPromos] = useState(true);

  const plans: Plan[] = [
    { 
      id: '3months', 
      name: '3 Meses', 
      price: settings?.plan_3_months_price || 'R$ 19,90', 
      badge: 'Mais popular 🔥', 
      badgeType: 'popular', 
      featured: true 
    },
    { 
      id: '1year', 
      name: '1 Ano', 
      price: settings?.plan_1_year_price || 'R$ 49,90', 
      badge: 'Melhor oferta', 
      badgeType: 'best' 
    },
    { 
      id: 'lifetime', 
      name: 'Vitalício', 
      price: settings?.plan_lifetime_price || 'R$ 89,90', 
      badge: 'Exclusivo', 
      badgeType: 'premium' 
    },
  ];

  const getBadgeStyles = (type?: string) => {
    switch (type) {
      case 'popular':
        return 'bg-secondary text-secondary-foreground';
      case 'best':
        return 'bg-secondary text-secondary-foreground';
      case 'premium':
        return 'bg-blue-50 text-blue-700';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const primaryColor = settings?.primary_button_color || '#f97316';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-card border border-border rounded-xl p-4 shadow-sm"
    >
      <h3 className="text-lg font-bold text-foreground mb-2">Assinaturas</h3>
      
      {/* Tag Popular */}
      <div className="inline-flex items-center gap-2 mb-3">
        <span className="bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-full">
          VEJA TUDO AGORA 🔥🔥
        </span>
        <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-1 rounded-full">
          Promocional
        </span>
      </div>

      {/* Primary Plan */}
      <motion.button 
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.99 }}
        className="relative w-full text-white rounded-xl p-4 flex items-center justify-between shadow-lg hover:shadow-xl transition-shadow overflow-hidden group"
        style={{ 
          background: `linear-gradient(to bottom, ${primaryColor}, ${settings?.secondary_button_color || '#ea580c'})` 
        }}
      >
        {/* Shimmer Effect */}
        <div className="absolute top-0 -left-[60%] w-[40%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] animate-shimmer pointer-events-none" />
        
        <span className="text-base font-bold z-10">30 Dias</span>
        <span className="text-xl font-extrabold z-10 flex items-center gap-1">
          {settings?.plan_30_days_price || 'R$ 9,90'} <span className="font-black">→</span>
        </span>
      </motion.button>

      {/* Perk Chip */}
      <div className="bg-secondary text-secondary-foreground text-xs font-extrabold px-3 py-1.5 rounded-full inline-block mt-3">
        + CHAMADA DE VÍDEO COMIGO HOJE!
      </div>

      {/* Trust Inline */}
      <div className="flex items-center gap-3 mt-3 text-muted-foreground text-xs font-semibold">
        <span className="flex items-center gap-1">
          <Lock className="w-3.5 h-3.5 text-success" />
          Pagamento 100% seguro
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5" style={{ color: primaryColor }} />
          Acesso imediato
        </span>
      </div>

      {/* Promotions Section */}
      <div className="mt-5">
        <button 
          onClick={() => setShowPromos(!showPromos)}
          className="flex items-center justify-between w-full text-left"
        >
          <h4 className="text-sm font-medium text-foreground">Promoções</h4>
          <ChevronDown 
            className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${showPromos ? 'rotate-0' : '-rotate-90'}`} 
          />
        </button>

        <AnimatePresence>
          {showPromos && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="space-y-2.5 mt-3">
                {plans.map((plan) => (
                  <motion.button
                    key={plan.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      plan.featured 
                        ? 'border-primary bg-orange-50 shadow-md' 
                        : 'border-orange-200 bg-card hover:border-primary hover:shadow-sm'
                    }`}
                    style={plan.featured ? { borderColor: primaryColor } : {}}
                  >
                    <span className="flex items-center gap-2 font-bold text-foreground">
                      {plan.featured && <Crown className="w-4 h-4" style={{ color: primaryColor }} />}
                      <span>{plan.name}</span>
                      {plan.badge && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getBadgeStyles(plan.badgeType)}`}>
                          {plan.badge}
                        </span>
                      )}
                    </span>
                    <span className="font-extrabold text-foreground">{plan.price}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SubscriptionCard;
