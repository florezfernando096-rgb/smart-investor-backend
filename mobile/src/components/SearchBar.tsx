import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import {
  searchStockSymbols,
  syncSymbolsInBackground,
  StockSymbolItem,
} from '../services/symbolSearchService';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onSearch: (symbol: string) => void;
  loading: boolean;
  activeSymbol: string;
}

const QUICK_TICKERS = ['MSFT', 'NVDA', 'AAPL', 'MELI', 'TSLA', 'AMZN', 'GOOGL', 'META'];

export const SearchBar: React.FC<Props> = ({ onSearch, loading, activeSymbol }) => {
  const { colors, isDark } = useTheme();
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<StockSymbolItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    syncSymbolsInBackground();
  }, []);

  const handleTextChange = (val: string) => {
    setText(val);
    if (val.trim().length > 0) {
      const results = searchStockSymbols(val, 7);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSelectSymbol = (selectedSymbol: string) => {
    setText(selectedSymbol);
    setShowDropdown(false);
    Keyboard.dismiss();
    onSearch(selectedSymbol);
  };

  const handleSearchSubmit = () => {
    if (text.trim()) {
      setShowDropdown(false);
      Keyboard.dismiss();
      onSearch(text.trim().toUpperCase());
    }
  };

  const handleClear = () => {
    setText('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <View className="mb-3 z-50">
      {/* Input de Búsqueda */}
      <View
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 3,
          elevation: 2,
        }}
        className="flex-row items-center rounded-2xl px-3.5 py-2.5 border"
      >
        <Text className="mr-2 text-base" style={{ color: colors.textSecondary }}>
          🔍
        </Text>
        <TextInput
          style={{ color: colors.textPrimary }}
          className="flex-1 font-semibold text-sm"
          placeholder="Buscar acción o empresa (ej. MSFT, Apple)..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={handleTextChange}
          onSubmitEditing={handleSearchSubmit}
          autoCapitalize="characters"
          returnKeyType="search"
          autoCorrect={false}
        />

        {text.length > 0 && !loading && (
          <TouchableOpacity onPress={handleClear} className="p-1 mr-1">
            <Text style={{ color: colors.textMuted }} className="text-xs font-bold">
              ✕
            </Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <ActivityIndicator size="small" color={colors.chartPrimary} />
        ) : (
          <TouchableOpacity
            onPress={handleSearchSubmit}
            className="bg-indigo-600 px-3.5 py-1.5 rounded-xl ml-1 active:bg-indigo-700"
          >
            <Text className="text-white text-xs font-bold">Buscar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista Desplegable de Autocompletado Instantáneo */}
      {showDropdown && suggestions.length > 0 && (
        <View
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
            shadowColor: colors.shadowColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.4 : 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}
          className="rounded-2xl border mt-1.5 overflow-hidden z-50"
        >
          {suggestions.map((item, idx) => (
            <TouchableOpacity
              key={`sug-${item.symbol}-${idx}`}
              onPress={() => handleSelectSymbol(item.symbol)}
              activeOpacity={0.7}
              style={{
                borderBottomColor: colors.gridLine,
              }}
              className={`flex-row items-center justify-between p-3 ${
                idx !== suggestions.length - 1 ? 'border-b' : ''
              }`}
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/25 mr-2">
                  <Text className="text-indigo-600 dark:text-indigo-300 font-extrabold text-xs font-mono">
                    {item.symbol}
                  </Text>
                </View>
                <Text
                  style={{ color: colors.textPrimary }}
                  className="text-xs font-semibold flex-1"
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </View>
              <Text style={{ color: colors.textMuted }} className="text-xs">
                ➔
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quick Pills */}
      <View className="flex-row flex-wrap mt-2">
        {QUICK_TICKERS.map((ticker) => {
          const isActive = activeSymbol === ticker;
          return (
            <TouchableOpacity
              key={ticker}
              onPress={() => handleSelectSymbol(ticker)}
              style={{
                backgroundColor: isActive ? 'rgba(79, 70, 229, 0.15)' : colors.pillBg,
                borderColor: isActive ? '#6366F1' : colors.pillBorder,
              }}
              className="px-3 py-1 rounded-full mr-2 mb-1 border"
            >
              <Text
                style={{
                  color: isActive ? '#4F46E5' : colors.textSecondary,
                  fontWeight: isActive ? 'bold' : '600',
                }}
                className="text-xs"
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
