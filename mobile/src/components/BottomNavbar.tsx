import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export type MainTabType = 'search' | 'watchlist';

interface Props {
  activeTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  watchlistCount?: number;
}

export const BottomNavbar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  watchlistCount = 0,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.cardBg,
        borderTopColor: colors.cardBorder,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: isDark ? 0.3 : 0.06,
        shadowRadius: 6,
        elevation: 10,
      }}
      className="flex-row justify-around items-center py-2 px-4 border-t"
    >
      {/* Pestaña 1: Búsqueda */}
      <TouchableOpacity
        onPress={() => onSelectTab('search')}
        activeOpacity={0.7}
        className="flex-1 items-center py-1.5"
      >
        <View
          style={{
            backgroundColor:
              activeTab === 'search'
                ? isDark
                  ? 'rgba(99, 102, 241, 0.2)'
                  : 'rgba(99, 102, 241, 0.12)'
                : 'transparent',
          }}
          className="px-4 py-1 rounded-full items-center mb-0.5"
        >
          <Text className="text-lg">🔍</Text>
        </View>
        <Text
          style={{
            color: activeTab === 'search' ? '#6366F1' : colors.textSecondary,
            fontWeight: activeTab === 'search' ? 'bold' : '600',
          }}
          className="text-[11px]"
        >
          Búsqueda
        </Text>
      </TouchableOpacity>

      {/* Pestaña 2: Watchlist */}
      <TouchableOpacity
        onPress={() => onSelectTab('watchlist')}
        activeOpacity={0.7}
        className="flex-1 items-center py-1.5"
      >
        <View
          style={{
            backgroundColor:
              activeTab === 'watchlist'
                ? isDark
                  ? 'rgba(99, 102, 241, 0.2)'
                  : 'rgba(99, 102, 241, 0.12)'
                : 'transparent',
          }}
          className="px-4 py-1 rounded-full items-center mb-0.5 relative"
        >
          <Text className="text-lg">📌</Text>
          {watchlistCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-indigo-600 px-1.5 py-0.2 rounded-full">
              <Text className="text-[9px] font-black text-white">
                {watchlistCount}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={{
            color: activeTab === 'watchlist' ? '#6366F1' : colors.textSecondary,
            fontWeight: activeTab === 'watchlist' ? 'bold' : '600',
          }}
          className="text-[11px]"
        >
          Watchlist
        </Text>
      </TouchableOpacity>
    </View>
  );
};
