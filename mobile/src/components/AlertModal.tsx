import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  StockAlert,
  fetchStockAlerts,
  createStockAlert,
  deleteStockAlert,
} from '../services/alertService';

interface Props {
  visible: boolean;
  onClose: () => void;
  symbol: string;
  companyName?: string;
  currentPrice: number;
  onAlertCreated?: () => void;
}

export const AlertModal: React.FC<Props> = ({
  visible,
  onClose,
  symbol,
  companyName,
  currentPrice,
  onAlertCreated,
}) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [mode, setMode] = useState<'price' | 'percent'>('price');
  const [priceDirection, setPriceDirection] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState(
    currentPrice > 0 ? (currentPrice * 1.05).toFixed(2) : ''
  );
  const [percentDirection, setPercentDirection] = useState<'above' | 'below'>('above');
  const [targetPercent, setTargetPercent] = useState('5.0');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingAlerts, setExistingAlerts] = useState<StockAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const loadAlerts = async () => {
    if (!user?.id || !symbol) return;
    setLoadingAlerts(true);
    try {
      const alerts = await fetchStockAlerts(user.id, symbol);
      setExistingAlerts(alerts);
    } catch {
      // Ignorar
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    if (visible && symbol) {
      if (currentPrice > 0) {
        setTargetPrice((currentPrice * 1.05).toFixed(2));
      }
      loadAlerts();
    }
  }, [visible, symbol, currentPrice]);

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Inicia Sesión', 'Debes iniciar sesión para configurar alertas.');
      return;
    }

    let conditionType: StockAlert['condition_type'] = 'price_above';
    let pVal: number | null = null;
    let pctVal: number | null = null;

    if (mode === 'price') {
      const parsedP = parseFloat(targetPrice);
      if (isNaN(parsedP) || parsedP <= 0) {
        Alert.alert('Valor inválido', 'Por favor ingresa un precio objetivo válido.');
        return;
      }
      conditionType = priceDirection === 'above' ? 'price_above' : 'price_below';
      pVal = parsedP;
    } else {
      const parsedPct = parseFloat(targetPercent);
      if (isNaN(parsedPct) || parsedPct <= 0) {
        Alert.alert('Valor inválido', 'Por favor ingresa un porcentaje válido.');
        return;
      }
      conditionType = percentDirection === 'above' ? 'change_pct_above' : 'change_pct_below';
      pctVal = parsedPct;
    }

    setSubmitting(true);
    const res = await createStockAlert({
      user_id: user.id,
      symbol: symbol.toUpperCase(),
      condition_type: conditionType,
      target_price: pVal,
      target_change_percent: pctVal,
      notes: notes.trim(),
      status: 'active',
    });
    setSubmitting(false);

    if (res.success) {
      setNotes('');
      loadAlerts();
      if (onAlertCreated) onAlertCreated();
      Alert.alert('¡Alerta Creada!', `Te notificaremos cuando ${symbol} cumpla la condición.`);
    } else {
      Alert.alert('Error', res.error || 'No se pudo guardar la alerta.');
    }
  };

  const handleDeleteAlert = async (alertId?: string) => {
    if (!alertId || !user?.id) return;
    setExistingAlerts((prev) => prev.filter((a) => a.id !== alertId));
    await deleteStockAlert(alertId, user.id);
    if (onAlertCreated) onAlertCreated();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/70"
      >
        <View
          style={{
            backgroundColor: colors.cardBg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderColor: colors.cardBorder,
            borderTopWidth: 1,
            maxHeight: '90%',
          }}
          className="p-5"
        >
          {/* Barra de Arrastre Superior */}
          <View className="items-center mb-3">
            <View
              style={{ backgroundColor: colors.gridLine }}
              className="w-12 h-1.5 rounded-full"
            />
          </View>

          {/* Header con Ticker, Precio y Botón Cerrar */}
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center mb-1">
                <Text className="text-xl mr-2">🔔</Text>
                <Text
                  style={{ color: colors.textPrimary }}
                  className="text-xl font-black font-mono tracking-tight"
                >
                  {symbol}
                </Text>
                <Text
                  style={{ color: colors.textSecondary }}
                  className="text-xs ml-2 font-semibold"
                  numberOfLines={1}
                >
                  {companyName || ''}
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary }} className="text-xs">
                Precio actual de referencia:{' '}
                <Text style={{ color: colors.textPrimary }} className="font-extrabold">
                  ${currentPrice.toFixed(2)}
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: colors.pillBg,
                borderColor: colors.pillBorder,
              }}
              className="w-8 h-8 rounded-full items-center justify-center border"
            >
              <Text style={{ color: colors.textSecondary }} className="text-xs font-bold">
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Tabs de Modo: Por Precio vs Por % */}
            <View
              style={{
                backgroundColor: colors.pillBg,
                borderColor: colors.pillBorder,
              }}
              className="flex-row rounded-2xl p-1 border mb-4"
            >
              <TouchableOpacity
                onPress={() => setMode('price')}
                className={`flex-1 py-2 rounded-xl items-center ${
                  mode === 'price' ? 'bg-indigo-600' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    mode === 'price' ? 'text-white' : colors.textSecondary
                  }`}
                >
                  💵 Por Precio ($)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMode('percent')}
                className={`flex-1 py-2 rounded-xl items-center ${
                  mode === 'percent' ? 'bg-indigo-600' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    mode === 'percent' ? 'text-white' : colors.textSecondary
                  }`}
                >
                  📈 Por Variación (%)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Configuración Modo Precio */}
            {mode === 'price' ? (
              <View className="mb-4">
                <Text style={{ color: colors.textSecondary }} className="text-xs font-bold uppercase mb-2">
                  Condición de Disparo
                </Text>
                <View className="flex-row mb-3">
                  <TouchableOpacity
                    onPress={() => setPriceDirection('above')}
                    style={{
                      backgroundColor: priceDirection === 'above' ? colors.positiveBg : colors.inputBg,
                      borderColor: priceDirection === 'above' ? colors.positive : colors.inputBorder,
                    }}
                    className="flex-1 py-2.5 rounded-xl border mr-2 items-center"
                  >
                    <Text
                      style={{
                        color: priceDirection === 'above' ? colors.positive : colors.textSecondary,
                        fontWeight: 'bold',
                      }}
                      className="text-xs"
                    >
                      ≥ Sube a o por encima
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setPriceDirection('below')}
                    style={{
                      backgroundColor: priceDirection === 'below' ? colors.negativeBg : colors.inputBg,
                      borderColor: priceDirection === 'below' ? colors.negative : colors.inputBorder,
                    }}
                    className="flex-1 py-2.5 rounded-xl border items-center"
                  >
                    <Text
                      style={{
                        color: priceDirection === 'below' ? colors.negative : colors.textSecondary,
                        fontWeight: 'bold',
                      }}
                      className="text-xs"
                    >
                      ≤ Cae a o por debajo
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ color: colors.textSecondary }} className="text-xs font-bold uppercase mb-1.5">
                  Precio Objetivo ($)
                </Text>
                <View
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                  }}
                  className="rounded-2xl px-4 py-3 border flex-row items-center"
                >
                  <Text style={{ color: colors.textMuted }} className="text-sm font-bold mr-1">
                    $
                  </Text>
                  <TextInput
                    style={{ color: colors.textPrimary }}
                    value={targetPrice}
                    onChangeText={setTargetPrice}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    className="flex-1 text-base font-extrabold font-mono"
                  />
                </View>
              </View>
            ) : (
              /* Configuración Modo Porcentaje */
              <View className="mb-4">
                <Text style={{ color: colors.textSecondary }} className="text-xs font-bold uppercase mb-2">
                  Variación Diaria
                </Text>
                <View className="flex-row mb-3">
                  <TouchableOpacity
                    onPress={() => setPercentDirection('above')}
                    style={{
                      backgroundColor: percentDirection === 'above' ? colors.positiveBg : colors.inputBg,
                      borderColor: percentDirection === 'above' ? colors.positive : colors.inputBorder,
                    }}
                    className="flex-1 py-2.5 rounded-xl border mr-2 items-center"
                  >
                    <Text
                      style={{
                        color: percentDirection === 'above' ? colors.positive : colors.textSecondary,
                        fontWeight: 'bold',
                      }}
                      className="text-xs"
                    >
                      ▲ Subida diaria (+%)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setPercentDirection('below')}
                    style={{
                      backgroundColor: percentDirection === 'below' ? colors.negativeBg : colors.inputBg,
                      borderColor: percentDirection === 'below' ? colors.negative : colors.inputBorder,
                    }}
                    className="flex-1 py-2.5 rounded-xl border items-center"
                  >
                    <Text
                      style={{
                        color: percentDirection === 'below' ? colors.negative : colors.textSecondary,
                        fontWeight: 'bold',
                      }}
                      className="text-xs"
                    >
                      ▼ Caída diaria (-%)
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ color: colors.textSecondary }} className="text-xs font-bold uppercase mb-1.5">
                  Porcentaje de Cambio (%)
                </Text>
                <View
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                  }}
                  className="rounded-2xl px-4 py-3 border flex-row items-center"
                >
                  <TextInput
                    style={{ color: colors.textPrimary }}
                    value={targetPercent}
                    onChangeText={setTargetPercent}
                    placeholder="5.0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    className="flex-1 text-base font-extrabold font-mono"
                  />
                  <Text style={{ color: colors.textMuted }} className="text-sm font-bold ml-1">
                    %
                  </Text>
                </View>
              </View>
            )}

            {/* Campo Nota Opcional */}
            <Text style={{ color: colors.textSecondary }} className="text-xs font-bold uppercase mb-1.5">
              Nota o Recordatorio (Opcional)
            </Text>
            <View
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
              }}
              className="rounded-2xl px-4 py-2.5 border mb-5"
            >
              <TextInput
                style={{ color: colors.textPrimary }}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ej. Comprar si toca soporte clave..."
                placeholderTextColor={colors.textMuted}
                multiline={true}
                numberOfLines={2}
                className="text-xs"
              />
            </View>

            {/* Botón Crear Alerta */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={submitting}
              className="bg-indigo-600 py-3.5 rounded-2xl items-center shadow-lg active:bg-indigo-700 mb-6"
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white text-xs font-black uppercase tracking-wider">
                  🔔 Guardar Alerta en Supabase
                </Text>
              )}
            </TouchableOpacity>

            {/* Lista de Alertas Activas para esta acción */}
            {existingAlerts.length > 0 && (
              <View className="border-t pt-4 mb-4" style={{ borderTopColor: colors.gridLine }}>
                <Text style={{ color: colors.textPrimary }} className="text-xs font-black uppercase mb-2">
                  Alertas Activas ({existingAlerts.length})
                </Text>
                {existingAlerts.map((a, idx) => (
                  <View
                    key={a.id || `alert-${idx}`}
                    style={{
                      backgroundColor: colors.cardBgSubtle,
                      borderColor: colors.gridLine,
                    }}
                    className="flex-row justify-between items-center p-3 rounded-xl border mb-2"
                  >
                    <View className="flex-1 mr-2">
                      <Text style={{ color: colors.textPrimary }} className="text-xs font-extrabold">
                        {a.condition_type === 'price_above'
                          ? `Precio ≥ $${a.target_price}`
                          : a.condition_type === 'price_below'
                          ? `Precio ≤ $${a.target_price}`
                          : a.condition_type === 'change_pct_above'
                          ? `Subida ≥ +${a.target_change_percent}%`
                          : `Caída ≥ -${a.target_change_percent}%`}
                      </Text>
                      {a.notes ? (
                        <Text style={{ color: colors.textSecondary }} className="text-[10px] mt-0.5" numberOfLines={1}>
                          "{a.notes}"
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteAlert(a.id)}
                      className="p-1 rounded-lg active:bg-rose-500/20"
                    >
                      <Text className="text-slate-400 text-xs">🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
