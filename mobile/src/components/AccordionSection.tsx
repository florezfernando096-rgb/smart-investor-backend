import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

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
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <View className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-md my-2 overflow-hidden">
      {/* Header del Acordeón */}
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
        className="flex-row justify-between items-center p-3.5 bg-slate-900/80"
      >
        <View className="flex-row items-center flex-1 mr-1 flex-wrap">
          <Text className="text-xs font-black text-white tracking-wide mr-1.5">
            {title}
          </Text>
          {badgeText && (
            <View className="bg-indigo-500/20 px-1.5 py-0.5 rounded-md border border-indigo-500/30">
              <Text className="text-[9px] font-extrabold text-indigo-300">
                {badgeText}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center">
          {rightControl}
          <View className="w-5 h-5 rounded-full bg-slate-800 items-center justify-center ml-1.5">
            <Text className="text-slate-400 text-[10px] font-bold">
              {isOpen ? '▲' : '▼'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Contenido Desplegable */}
      {isOpen && (
        <View className="p-3 pt-2.5 border-t border-slate-800/80">
          {children}
        </View>
      )}
    </View>
  );
};
