import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface Props {
  title: string;
  badgeText?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  rightControl?: React.ReactNode;
}

export const AccordionSection: React.FC<Props> = ({
  title,
  badgeText,
  defaultOpen = false,
  children,
  rightControl,
}) => {
  const { colors, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <View
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.cardBorder,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
      className="rounded-2xl border my-2 overflow-hidden"
    >
      {/* Header del Acordeón */}
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
        style={{
          backgroundColor: colors.cardBgSubtle,
        }}
        className="flex-row justify-between items-center p-3.5"
      >
        <View className="flex-row items-center flex-1 mr-1 flex-wrap">
          <Text
            style={{ color: colors.textPrimary }}
            className="text-xs font-black tracking-wide mr-1.5"
          >
            {title}
          </Text>
          {badgeText && (
            <View className="bg-indigo-500/15 px-1.5 py-0.5 rounded-md border border-indigo-500/30">
              <Text className="text-[9px] font-extrabold text-indigo-600 dark:text-indigo-300">
                {badgeText}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center">
          {rightControl}
          <View
            style={{
              backgroundColor: isDark ? '#334155' : '#E2E8F0',
            }}
            className="w-5 h-5 rounded-full items-center justify-center ml-1.5"
          >
            <Text style={{ color: colors.textSecondary }} className="text-[10px] font-bold">
              {isOpen ? '▲' : '▼'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Contenido Desplegable */}
      {isOpen && (
        <View
          style={{
            borderTopColor: colors.gridLine,
          }}
          className="p-3 pt-2.5 border-t"
        >
          {children}
        </View>
      )}
    </View>
  );
};
