import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('ErrorBoundary capturó error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-[#090d16] items-center justify-center p-6 my-4 rounded-2xl border border-slate-800">
          <Text className="text-3xl mb-2">⚠️</Text>
          <Text className="text-white text-base font-bold text-center mb-1">
            {this.props.fallbackMessage || 'Ocurrió un problema visual al renderizar'}
          </Text>
          <Text className="text-slate-400 text-xs text-center mb-4">
            {this.state.error?.message || 'Error inesperado'}
          </Text>
          <TouchableOpacity
            onPress={this.handleReset}
            className="bg-indigo-600 px-5 py-2.5 rounded-xl active:bg-indigo-500"
          >
            <Text className="text-white font-bold text-xs">Reintentar Carga</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
