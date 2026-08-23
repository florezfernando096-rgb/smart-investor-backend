import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
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
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.94)',
        borderTopColor: colors.cardBorder,
        borderTopWidth: 1,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: isDark ? 0.35 : 0.08,
        shadowRadius: 8,
        elevation: 8,
      }}
      className="flex-row justify-around items-center py-1.5 px-6"
    >
      {/* Pestaña 1: Búsqueda */}
      <TouchableOpacity
        onPress={() => onSelectTab('search')}
        activeOpacity={0.7}
        className="flex-1 items-center py-1"
      >
        <View className="items-center justify-center">
          <Text
            style={{
              opacity: activeTab === 'search' ? 1 : 0.6,
              transform: [{ scale: activeTab === 'search' ? 1.08 : 1.0 }],
            }}
            className="text-xl mb-0.5"
          >
            🔍
          </Text>
          <Text
            style={{
              color: activeTab === 'search' ? (isDark ? '#818CF8' : '#4F46E5') : colors.textSecondary,
              fontWeight: activeTab === 'search' ? '800' : '600',
            }}
            className="text-[11px] tracking-tight"
          >
            Búsqueda
          </Text>
          {/* Indicador sutil de punto activo */}
          {activeTab === 'search' && (
            <View className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-0.5" />
          )}
        </View>
      </TouchableOpacity>

      {/* Pestaña 2: Watchlist */}
      <TouchableOpacity
        onPress={() => onSelectTab('watchlist')}
        activeOpacity={0.7}
        className="flex-1 items-center py-1"
      >
        <View className="items-center justify-center relative">
          <Text
            style={{
              opacity: activeTab === 'watchlist' ? 1 : 0.6,
              transform: [{ scale: activeTab === 'watchlist' ? 1.08 : 1.0 }],
            }}
            className="text-xl mb-0.5"
          >
            📌
          </Text>

          {/* Badge Numérico Minimalista */}
          {watchlistCount > 0 && (
            <View
              style={{
                top: -2,
                right: -8,
                backgroundColor: isDark ? '#6366F1' : '#4F46E5',
              }}
              className="absolute px-1.5 py-0.2 rounded-full shadow-sm"
            >
              <Text className="text-[8px] font-black text-white">
                {watchlistCount}
              </Text>
            </View>
          )}

          <Text
            style={{
              color: activeTab === 'watchlist' ? (isDark ? '#818CF8' : '#4F46E5') : colors.textSecondary,
              fontWeight: activeTab === 'watchlist' ? '800' : '600',
            }}
            className="text-[11px] tracking-tight"
          >
            Watchlist
          </Text>
          {/* Indicador sutil de punto activo */}
          {activeTab === 'watchlist' && (
            <View className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-0.5" />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};
