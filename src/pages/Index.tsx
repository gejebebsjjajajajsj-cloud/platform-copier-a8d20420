import { useState } from 'react';
import PromoBanner from '@/components/PromoBanner';
import Header from '@/components/Header';
import ProfileSection from '@/components/ProfileSection';
import SubscriptionCard from '@/components/SubscriptionCard';
import ContentToggle from '@/components/ContentToggle';
import FeedCard from '@/components/FeedCard';
import FAQSection from '@/components/FAQSection';
import FooterCTA from '@/components/FooterCTA';
import NotificationToast from '@/components/NotificationToast';
import { useSiteSettings } from '@/hooks/useSiteSettings';

// Import fallback images
import coverImage from '@/assets/cover-image.png';
import perfil1 from '@/assets/perfil1.png';
import feedImage1 from '@/assets/feed-image-1.png';

const Index = () => {
  const [activeTab, setActiveTab] = useState('videos');
  const { data: settings } = useSiteSettings();

  const profileData = {
    name: settings?.profile_name || 'Kamylinha Santos',
    username: settings?.profile_username || 'eukamylinhasantos',
    bio: settings?.profile_bio || 'Oi, meus amores! 🔥💦 Sou a Kamylinha Santos...',
    coverImage: settings?.banner_url || coverImage,
    avatarImage: settings?.avatar_url || perfil1,
    stats: {
      photos: settings?.stats_photos || 354,
      videos: settings?.stats_videos || 148,
      likes: settings?.stats_likes || '20.2K'
    }
  };

  const feedItems = [
    {
      mediaUrl: '/videos/video1.mp4',
      isVideo: true,
      likes: '42.1K',
      comments: '3.2K'
    },
    {
      mediaUrl: '/videos/video2.mp4',
      isVideo: true,
      likes: '78.5K',
      comments: '5.6K'
    },
    {
      mediaUrl: '/videos/video3.mp4',
      isVideo: true,
      likes: '35.8K',
      comments: '2.1K'
    },
    {
      mediaUrl: '/videos/video4.mp4',
      isVideo: true,
      likes: '61.2K',
      comments: '4.3K'
    }
  ];

  // Apply dynamic colors from settings
  const dynamicStyles = settings ? {
    '--dynamic-primary': settings.primary_button_color || '#f97316',
    '--dynamic-secondary': settings.secondary_button_color || '#fdba74',
    '--dynamic-background': settings.page_background_color || '#fefefe',
  } as React.CSSProperties : {};

  return (
    <div 
      className="min-h-screen"
      style={{ 
        ...dynamicStyles,
        backgroundColor: settings?.page_background_color || undefined 
      }}
    >
      <PromoBanner />
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-lg">
        <div className="space-y-4">
          <ProfileSection {...profileData} />
          
          <SubscriptionCard settings={settings} />
          
          <ContentToggle activeTab={activeTab} onTabChange={setActiveTab} />
          
          {/* Feed Grid */}
          <div className="space-y-4">
            {feedItems.map((item, index) => (
              <FeedCard
                key={index}
                avatarImage={profileData.avatarImage}
                name={profileData.name}
                username={profileData.username}
                mediaUrl={item.mediaUrl}
                isVideo={item.isVideo}
                likes={item.likes}
                comments={item.comments}
                index={index}
              />
            ))}
          </div>
          
          <FAQSection />
          
          <FooterCTA settings={settings} />
        </div>
      </main>

      <NotificationToast />
    </div>
  );
};

export default Index;
