import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface Props {
  onSearch: (symbol: string) => void;
  loading: boolean;
  activeSymbol: string;
}

const QUICK_TICKERS = ['MSFT', 'NVDA', 'AAPL', 'UBER', 'TSLA', 'DEMO'];

export const SearchBar: React.FC<Props> = ({ onSearch, loading, activeSymbol }) => {
  const [text, setText] = useState('');

  const handleSearchSubmit = () => {
    if (text.trim()) {
      onSearch(text.trim().toUpperCase());
    }
  };

  return (
    <View className="mb-4">
      {/* Input de Búsqueda */}
      <View className="flex-row items-center bg-[#0f172a] rounded-2xl px-4 py-2.5 border border-slate-800 shadow-md">
        <Text className="text-slate-400 mr-2 text-base">🔍</Text>
        <TextInput
          className="flex-1 text-white font-semibold text-base"
          placeholder="Buscar ticker (ej. MSFT, AAPL, NVDA)..."
          placeholderTextColor="#64748b"
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSearchSubmit}
          autoCapitalize="characters"
          returnKeyType="search"
        />
        {loading ? (
          <ActivityIndicator size="small" color="#38bdf8" />
        ) : (
          <TouchableOpacity
            onPress={handleSearchSubmit}
            className="bg-indigo-600 px-3 py-1.5 rounded-xl ml-2"
          >
            <Text className="text-white text-xs font-bold">Buscar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Pills */}
      <View className="flex-row flex-wrap mt-2">
        {QUICK_TICKERS.map((ticker) => {
          const isActive = activeSymbol === ticker;
          return (
            <TouchableOpacity
              key={ticker}
              onPress={() => onSearch(ticker)}
              className={`px-3 py-1 rounded-full mr-2 mb-1 border ${
                isActive
                  ? 'bg-indigo-600/30 border-indigo-500'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isActive ? 'text-indigo-400 font-bold' : 'text-slate-400'
                }`}
              >
                ${ticker}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
