import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings, useUpdateSiteSettings, uploadSiteImage } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Save, Upload, Settings, User, Image, DollarSign, Palette, Camera, CreditCard, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentCredential {
  id: string;
  domain: string;
  sync_client_id: string;
  sync_client_secret: string;
  is_active: boolean;
}

const Admin = () => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();
  
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    profile_name: '',
    profile_username: '',
    profile_bio: '',
    button_text: '',
    subscription_price: 0,
    subscription_original_price: 0,
    discount_percent: 0,
    primary_button_color: '#f97316',
    secondary_button_color: '#fdba74',
    page_background_color: '#fefefe',
    footer_button_text: 'Veja tudo por apenas',
    footer_button_price: 'R$ 9,90',
    plan_30_days_price: 'R$ 9,90',
    plan_3_months_price: 'R$ 19,90',
    plan_1_year_price: 'R$ 49,90',
    plan_lifetime_price: 'R$ 89,90',
    banner_url: '',
    avatar_url: '',
    stats_photos: 354,
    stats_videos: 148,
    stats_likes: '20.2K',
  });

  const [uploading, setUploading] = useState<string | null>(null);
  
  // Payment credentials state
  const [credentials, setCredentials] = useState<PaymentCredential[]>([]);
  const [newCredential, setNewCredential] = useState({ domain: '', sync_client_id: '', sync_client_secret: '' });
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  // Load payment credentials
  useEffect(() => {
    if (isAdmin) {
      loadCredentials();
    }
  }, [isAdmin]);

  const loadCredentials = async () => {
    setLoadingCredentials(true);
    const { data, error } = await supabase
      .from('payment_credentials')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setCredentials(data as PaymentCredential[]);
    }
    setLoadingCredentials(false);
  };

  const addCredential = async () => {
    if (!newCredential.domain || !newCredential.sync_client_id || !newCredential.sync_client_secret) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('payment_credentials')
      .insert([newCredential]);

    if (error) {
      toast({ title: 'Erro ao adicionar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Credencial adicionada!' });
      setNewCredential({ domain: '', sync_client_id: '', sync_client_secret: '' });
      loadCredentials();
    }
  };

  const deleteCredential = async (id: string) => {
    const { error } = await supabase
      .from('payment_credentials')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Credencial removida!' });
      loadCredentials();
    }
  };

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
        primary_button_color: settings.primary_button_color || '#f97316',
        secondary_button_color: settings.secondary_button_color || '#fdba74',
        page_background_color: settings.page_background_color || '#fefefe',
        footer_button_text: settings.footer_button_text || 'Veja tudo por apenas',
        footer_button_price: settings.footer_button_price || 'R$ 9,90',
        plan_30_days_price: settings.plan_30_days_price || 'R$ 9,90',
        plan_3_months_price: settings.plan_3_months_price || 'R$ 19,90',
        plan_1_year_price: settings.plan_1_year_price || 'R$ 49,90',
        plan_lifetime_price: settings.plan_lifetime_price || 'R$ 89,90',
        banner_url: settings.banner_url || '',
        avatar_url: settings.avatar_url || '',
        stats_photos: settings.stats_photos || 354,
        stats_videos: settings.stats_videos || 148,
        stats_likes: settings.stats_likes || '20.2K',
      });
    }
  }, [settings]);

  const handleImageUpload = async (file: File, type: 'banner' | 'avatar') => {
    setUploading(type);
    try {
      const url = await uploadSiteImage(file, type);
      const key = type === 'banner' ? 'banner_url' : 'avatar_url';
      setFormData(prev => ({ ...prev, [key]: url }));
      toast({
        title: 'Upload concluído!',
        description: `${type === 'banner' ? 'Banner' : 'Avatar'} atualizado.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
    }
  };

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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stats_photos">Fotos</Label>
                  <Input
                    id="stats_photos"
                    type="number"
                    value={formData.stats_photos}
                    onChange={(e) => setFormData({ ...formData, stats_photos: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stats_videos">Vídeos</Label>
                  <Input
                    id="stats_videos"
                    type="number"
                    value={formData.stats_videos}
                    onChange={(e) => setFormData({ ...formData, stats_videos: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stats_likes">Likes</Label>
                  <Input
                    id="stats_likes"
                    value={formData.stats_likes}
                    onChange={(e) => setFormData({ ...formData, stats_likes: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Image className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Imagens</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banner</Label>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'banner');
                  }}
                />
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploading === 'banner'}
                  className="w-full border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary transition-colors relative overflow-hidden"
                >
                  {formData.banner_url ? (
                    <img src={formData.banner_url} alt="Banner" className="w-full h-20 object-cover rounded-lg" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">
                        {uploading === 'banner' ? 'Enviando...' : 'Clique para enviar'}
                      </p>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2">
                <Label>Avatar</Label>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'avatar');
                  }}
                />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading === 'avatar'}
                  className="w-full border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary transition-colors relative overflow-hidden"
                >
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Avatar" className="w-16 h-16 object-cover rounded-full mx-auto" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">
                        {uploading === 'avatar' ? 'Enviando...' : 'Clique para enviar'}
                      </p>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Colors Section */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Palette className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Cores</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_button_color">Cor Principal dos Botões</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_button_color"
                      type="color"
                      value={formData.primary_button_color}
                      onChange={(e) => setFormData({ ...formData, primary_button_color: e.target.value })}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.primary_button_color}
                      onChange={(e) => setFormData({ ...formData, primary_button_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_button_color">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_button_color"
                      type="color"
                      value={formData.secondary_button_color}
                      onChange={(e) => setFormData({ ...formData, secondary_button_color: e.target.value })}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.secondary_button_color}
                      onChange={(e) => setFormData({ ...formData, secondary_button_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="page_background_color">Cor de Fundo da Página</Label>
                <div className="flex gap-2">
                  <Input
                    id="page_background_color"
                    type="color"
                    value={formData.page_background_color}
                    onChange={(e) => setFormData({ ...formData, page_background_color: e.target.value })}
                    className="w-14 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.page_background_color}
                    onChange={(e) => setFormData({ ...formData, page_background_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Botões e Preços</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="button_text">Texto do Botão Principal</Label>
                <Input
                  id="button_text"
                  value={formData.button_text}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  placeholder="ASSINAR AGORA"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan_30_days_price">Preço 30 Dias</Label>
                  <Input
                    id="plan_30_days_price"
                    value={formData.plan_30_days_price}
                    onChange={(e) => setFormData({ ...formData, plan_30_days_price: e.target.value })}
                    placeholder="R$ 9,90"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan_3_months_price">Preço 3 Meses</Label>
                  <Input
                    id="plan_3_months_price"
                    value={formData.plan_3_months_price}
                    onChange={(e) => setFormData({ ...formData, plan_3_months_price: e.target.value })}
                    placeholder="R$ 19,90"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan_1_year_price">Preço 1 Ano</Label>
                  <Input
                    id="plan_1_year_price"
                    value={formData.plan_1_year_price}
                    onChange={(e) => setFormData({ ...formData, plan_1_year_price: e.target.value })}
                    placeholder="R$ 49,90"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan_lifetime_price">Preço Vitalício</Label>
                  <Input
                    id="plan_lifetime_price"
                    value={formData.plan_lifetime_price}
                    onChange={(e) => setFormData({ ...formData, plan_lifetime_price: e.target.value })}
                    placeholder="R$ 89,90"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Botão do Rodapé</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="footer_button_text">Texto</Label>
                    <Input
                      id="footer_button_text"
                      value={formData.footer_button_text}
                      onChange={(e) => setFormData({ ...formData, footer_button_text: e.target.value })}
                      placeholder="Veja tudo por apenas"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footer_button_price">Preço</Label>
                    <Input
                      id="footer_button_price"
                      value={formData.footer_button_price}
                      onChange={(e) => setFormData({ ...formData, footer_button_price: e.target.value })}
                      placeholder="R$ 9,90"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Credentials Section */}
          {isAdmin && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Credenciais de Pagamento por Domínio</h2>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Configure credenciais Sync Payments diferentes para cada domínio. Cada site usará suas próprias credenciais.
              </p>

              {/* Add new credential */}
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold mb-3">Adicionar Nova Credencial</h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Domínio (ex: meusite.com.br)"
                    value={newCredential.domain}
                    onChange={(e) => setNewCredential({ ...newCredential, domain: e.target.value })}
                  />
                  <Input
                    placeholder="Client ID"
                    value={newCredential.sync_client_id}
                    onChange={(e) => setNewCredential({ ...newCredential, sync_client_id: e.target.value })}
                  />
                  <Input
                    placeholder="Client Secret"
                    type="password"
                    value={newCredential.sync_client_secret}
                    onChange={(e) => setNewCredential({ ...newCredential, sync_client_secret: e.target.value })}
                  />
                  <Button onClick={addCredential} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Credencial
                  </Button>
                </div>
              </div>

              {/* List credentials */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Credenciais Cadastradas</h3>
                {loadingCredentials ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : credentials.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma credencial cadastrada. O sistema usará as credenciais padrão.</p>
                ) : (
                  <div className="space-y-2">
                    {credentials.map((cred) => (
                      <div key={cred.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                        <div>
                          <p className="font-medium text-sm">{cred.domain}</p>
                          <p className="text-xs text-muted-foreground">ID: {cred.sync_client_id.substring(0, 20)}...</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteCredential(cred.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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
