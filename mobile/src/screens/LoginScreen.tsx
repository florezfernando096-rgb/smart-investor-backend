import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getSupabaseConfig, saveSupabaseConfig } from '../services/supabaseClient';

export const LoginScreen: React.FC = () => {
  const { signIn, signUp, loginAsDemo, loading: authLoading } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal para configurar credenciales Supabase
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const currentConfig = getSupabaseConfig();
  const [urlInput, setUrlInput] = useState(currentConfig.url);
  const [anonKeyInput, setAnonKeyInput] = useState(currentConfig.anonKey);

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setIsSubmitting(true);
    if (isRegister) {
      const res = await signUp(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Error registrando usuario');
      } else if (res.error) {
        Alert.alert('Registro', res.error);
      }
    } else {
      const res = await signIn(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Correo o contraseña incorrectos');
      }
    }
    setIsSubmitting(false);
  };

  const handleSaveConfig = async () => {
    if (!urlInput.trim() || !anonKeyInput.trim()) {
      Alert.alert('Error', 'Por favor ingresa la URL y la Anon Key de Supabase.');
      return;
    }
    await saveSupabaseConfig(urlInput.trim(), anonKeyInput.trim());
    setConfigModalVisible(false);
    Alert.alert('Guardado', 'Credenciales de Supabase actualizadas correctamente.');
  };

  return (
    <SafeAreaView style={{ backgroundColor: colors.bg }} className="flex-1">
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          className="px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header con Toggle Theme */}
          <View className="flex-row justify-between items-center mb-8">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-2">⚡</Text>
              <Text style={{ color: colors.textPrimary }} className="text-xl font-black tracking-wider">
                SMART<Text className="text-indigo-600 dark:text-indigo-400">INVESTOR</Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleTheme}
              style={{
                backgroundColor: colors.pillBg,
                borderColor: colors.pillBorder,
              }}
              className="w-8 h-8 rounded-full items-center justify-center border"
            >
              <Text className="text-sm">{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>

          {/* Tarjeta de Autenticación */}
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadowColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.3 : 0.08,
              shadowRadius: 8,
              elevation: 4,
            }}
            className="rounded-3xl p-6 border mb-6"
          >
            {/* Selector Modo Login / Registro */}
            <View
              style={{
                backgroundColor: colors.pillBg,
                borderColor: colors.pillBorder,
              }}
              className="flex-row rounded-2xl p-1 border mb-6"
            >
              <TouchableOpacity
                onPress={() => {
                  setIsRegister(false);
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 rounded-xl items-center ${
                  !isRegister ? 'bg-indigo-600' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    !isRegister ? 'text-white' : colors.textSecondary
                  }`}
                >
                  Iniciar Sesión
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setIsRegister(true);
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 rounded-xl items-center ${
                  isRegister ? 'bg-indigo-600' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isRegister ? 'text-white' : colors.textSecondary
                  }`}
                >
                  Crear Cuenta
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={{ color: colors.textPrimary }}
              className="text-lg font-black tracking-tight mb-1"
            >
              {isRegister ? 'Crear cuenta en SmartInvestor' : 'Bienvenido de nuevo'}
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-xs mb-5">
              {isRegister
                ? 'Guarda y sincroniza tus acciones en seguimiento con Supabase.'
                : 'Accede a tus análisis financieros y tu Watchlist en tiempo real.'}
            </Text>

            {/* Mensaje de Error */}
            {errorMsg.length > 0 && (
              <View
                style={{
                  backgroundColor: colors.negativeBg,
                  borderColor: colors.negativeBorder,
                }}
                className="p-3 rounded-xl border mb-4"
              >
                <Text style={{ color: colors.negative }} className="text-xs font-bold">
                  {errorMsg}
                </Text>
              </View>
            )}

            {/* Campo Email */}
            <Text style={{ color: colors.textSecondary }} className="text-xs font-bold uppercase mb-1.5 px-1">
              Correo Electrónico
            </Text>
            <View
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
              }}
              className="rounded-2xl px-4 py-3 border mb-4"
            >
              <TextInput
                style={{ color: colors.textPrimary }}
                placeholder="ejemplo@inversionista.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="text-sm font-semibold"
              />
            </View>

            {/* Campo Contraseña */}
            <Text style={{ color: colors.textSecondary }} className="text-xs font-bold uppercase mb-1.5 px-1">
              Contraseña
            </Text>
            <View
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
              }}
              className="rounded-2xl px-4 py-3 border mb-6"
            >
              <TextInput
                style={{ color: colors.textPrimary }}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                className="text-sm font-semibold"
              />
            </View>

            {/* Botón de Acción Principal */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || authLoading}
              className="bg-indigo-600 py-3.5 rounded-2xl items-center shadow-lg active:bg-indigo-700"
            >
              {isSubmitting || authLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white text-sm font-extrabold tracking-wide">
                  {isRegister ? 'Registrarme' : 'Entrar a SmartInvestor'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Separador */}
            <View className="flex-row items-center my-4">
              <View style={{ backgroundColor: colors.gridLine }} className="flex-1 h-[1px]" />
              <Text style={{ color: colors.textMuted }} className="text-[10px] font-bold mx-3 uppercase">
                O
              </Text>
              <View style={{ backgroundColor: colors.gridLine }} className="flex-1 h-[1px]" />
            </View>

            {/* Botón Modo Demo */}
            <TouchableOpacity
              onPress={loginAsDemo}
              style={{
                backgroundColor: colors.pillBg,
                borderColor: colors.pillBorder,
              }}
              className="py-3 rounded-2xl items-center border active:opacity-70"
            >
              <Text style={{ color: colors.textPrimary }} className="text-xs font-bold">
                🚀 Explorar en Modo Demo (Sin cuenta)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botón Inferior para configurar Supabase */}
          <TouchableOpacity
            onPress={() => setConfigModalVisible(true)}
            className="flex-row items-center justify-center py-2"
          >
            <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold">
              ⚙️ Configurar Servidor Supabase
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Configuración Supabase */}
      <Modal
        visible={configModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfigModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center px-4">
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            }}
            className="w-full rounded-3xl p-5 border shadow-2xl"
          >
            <Text style={{ color: colors.textPrimary }} className="text-base font-black mb-1">
              ⚡ Configuración de Supabase
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-xs mb-3">
              Ingresa la URL y la Anon Key de tu proyecto Supabase.
            </Text>

            <Text style={{ color: colors.textPrimary }} className="text-[11px] font-bold mb-1">
              SUPABASE_URL:
            </Text>
            <View
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
              }}
              className="rounded-xl p-2.5 border mb-3"
            >
              <TextInput
                style={{ color: colors.textPrimary }}
                className="font-mono text-xs"
                value={urlInput}
                onChangeText={setUrlInput}
                placeholder="https://tu-proyecto.supabase.co"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={{ color: colors.textPrimary }} className="text-[11px] font-bold mb-1">
              SUPABASE_ANON_KEY:
            </Text>
            <View
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
              }}
              className="rounded-xl p-2.5 border mb-4 h-16"
            >
              <TextInput
                style={{ color: colors.textPrimary }}
                className="font-mono text-xs flex-1"
                value={anonKeyInput}
                onChangeText={setAnonKeyInput}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                placeholderTextColor={colors.textMuted}
                multiline={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => setConfigModalVisible(false)}
                style={{
                  backgroundColor: colors.pillBg,
                  borderColor: colors.pillBorder,
                }}
                className="flex-1 py-3 rounded-xl mr-2 items-center border"
              >
                <Text style={{ color: colors.textSecondary }} className="text-xs font-bold">
                  Cerrar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveConfig}
                className="flex-1 bg-indigo-600 py-3 rounded-xl items-center"
              >
                <Text className="text-white text-xs font-bold">Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
