import React, { useState, useEffect } from 'react';
import { View, SafeAreaView } from 'react-native';
import { DashboardScreen } from './DashboardScreen';
import { WatchlistScreen } from './WatchlistScreen';
import { BottomNavbar, MainTabType } from '../components/BottomNavbar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchUserWatchlist } from '../services/watchlistService';

export const MainNavigator: React.FC = () => {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<MainTabType>('search');
  const [selectedStock, setSelectedStock] = useState('MSFT');
  const [watchlistCount, setWatchlistCount] = useState(0);

  const refreshWatchlistCount = async () => {
    if (!user?.id) return;
    try {
      const items = await fetchUserWatchlist(user.id);
      setWatchlistCount(items.length);
    } catch {
      // Ignorar
    }
  };

  useEffect(() => {
    refreshWatchlistCount();
  }, [user?.id]);

  const handleSelectFromWatchlist = (symbol: string) => {
    setSelectedStock(symbol);
    setActiveTab('search');
  };

  return (
    <SafeAreaView style={{ backgroundColor: colors.bg }} className="flex-1">
      <View className="flex-1">
        {activeTab === 'search' ? (
          <DashboardScreen
            selectedSymbol={selectedStock}
            onWatchlistChanged={refreshWatchlistCount}
          />
        ) : (
          <WatchlistScreen
            onSelectStock={handleSelectFromWatchlist}
            onNavigateToSearch={() => setActiveTab('search')}
          />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <BottomNavbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        watchlistCount={watchlistCount}
      />
    </SafeAreaView>
  );
};
