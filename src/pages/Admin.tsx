import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings, useUpdateSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Save, Upload, Settings, User, Image, DollarSign } from 'lucide-react';

const Admin = () => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();

  const [formData, setFormData] = useState({
    profile_name: '',
    profile_username: '',
    profile_bio: '',
    button_text: '',
    subscription_price: 0,
    subscription_original_price: 0,
    discount_percent: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (settings) {
      setFormData({
        profile_name: settings.profile_name || '',
        profile_username: settings.profile_username || '',
        profile_bio: settings.profile_bio || '',
        button_text: settings.button_text || '',
        subscription_price: settings.subscription_price || 0,
        subscription_original_price: settings.subscription_original_price || 0,
        discount_percent: settings.discount_percent || 0,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData);
      toast({
        title: 'Salvo!',
        description: 'Configurações atualizadas com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Painel Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.email}
            </span>
            {!isAdmin && (
              <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                Não é admin
              </span>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Informações do Perfil</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile_name">Nome</Label>
                <Input
                  id="profile_name"
                  value={formData.profile_name}
                  onChange={(e) => setFormData({ ...formData, profile_name: e.target.value })}
                  placeholder="Nome do perfil"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile_username">Username</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <Input
                    id="profile_username"
                    value={formData.profile_username}
                    onChange={(e) => setFormData({ ...formData, profile_username: e.target.value })}
                    className="pl-8"
                    placeholder="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile_bio">Descrição / Bio</Label>
                <Textarea
                  id="profile_bio"
                  value={formData.profile_bio}
                  onChange={(e) => setFormData({ ...formData, profile_bio: e.target.value })}
                  placeholder="Descrição do perfil..."
                  rows={5}
                />
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Image className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Imagens</h2>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Para trocar banner e logo, envie as novas imagens pelo chat do Lovable.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Banner</p>
                <p className="text-xs text-muted-foreground">Via chat</p>
              </div>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Logo</p>
                <p className="text-xs text-muted-foreground">Via chat</p>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Assinatura</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="button_text">Texto do Botão</Label>
                <Input
                  id="button_text"
                  value={formData.button_text}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  placeholder="ASSINAR AGORA"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subscription_price">Preço (R$)</Label>
                  <Input
                    id="subscription_price"
                    type="number"
                    step="0.01"
                    value={formData.subscription_price}
                    onChange={(e) => setFormData({ ...formData, subscription_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subscription_original_price">Preço Original (R$)</Label>
                  <Input
                    id="subscription_original_price"
                    type="number"
                    step="0.01"
                    value={formData.subscription_original_price}
                    onChange={(e) => setFormData({ ...formData, subscription_original_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_percent">Desconto (%)</Label>
                <Input
                  id="discount_percent"
                  type="number"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            className="w-full gradient-primary-vertical text-primary-foreground font-bold h-12"
            disabled={updateSettings.isPending}
          >
            <Save className="w-5 h-5 mr-2" />
            {updateSettings.isPending ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Admin;
