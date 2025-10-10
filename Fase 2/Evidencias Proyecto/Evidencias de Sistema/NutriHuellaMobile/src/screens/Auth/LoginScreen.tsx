import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
console.log('RedirectUri →', makeRedirectUri({ useProxy: false }));
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { login, googleLogin } = useAuth();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ''; // <— viene del entorno

  // useIdTokenAuthRequest asegura responseType = 'id_token'
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: WEB_CLIENT_ID,     // Web (Expo Web)
    // iosClientId / androidClientId los agregaremos cuando hagamos builds nativos
    // expoClientId: opcional para Expo Go (más adelante)
    scopes: ['openid', 'email', 'profile'],
  });

  React.useEffect(() => {
    (async () => {
      if (response?.type === 'success') {
        const idToken = (response.params as any)?.id_token as string | undefined;
        if (!idToken) {
          setError('No se recibió id_token desde Google.');
          return;
        }
        try {
          setError(null);
          await googleLogin(idToken); // POST /api/auth/google
        } catch (e: any) {
          const msg = e?.response?.data?.message || 'Fallo al validar Google en el servidor.';
          setError(msg);
        }
      } else if (response?.type === 'error') {
        setError(response.error?.message ?? 'Error en autenticación Google.');
      }
    })();
  }, [response]);

  const onSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Credenciales inválidas.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onGooglePress = async () => {
    if (!WEB_CLIENT_ID) {
      Alert.alert('Configura Google', 'Falta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
      return;
    }
    if (!request) {
      setError('Google no está listo. Revisa el Client ID.');
      return;
    }
    // En Web NO usamos proxy
    await promptAsync({ useProxy: false });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF8EB', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: '800', color: '#10776F', marginBottom: 8 }}>NutriHuella</Text>
      <Text style={{ color: '#6B7280', marginBottom: 24 }}>Inicia sesión</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ width: 360, backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12 }}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        style={{ width: 360, backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12 }}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        onPress={onSubmit}
        style={{ width: 360, backgroundColor: '#10776F', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 12, opacity: loading ? 0.7 : 1 }}
        disabled={loading}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>{loading ? 'Ingresando…' : 'Ingresar'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onGooglePress}
        style={{ width: 360, borderWidth: 2, borderColor: '#10776F', padding: 12, borderRadius: 10, alignItems: 'center' }}
      >
        <Text style={{ color: '#10776F', fontWeight: '700' }}>Ingresar con Google</Text>
      </TouchableOpacity>

      {!!error && <Text style={{ color: 'red', marginTop: 12 }}>{error}</Text>}

      <Text style={{ color: '#10776F', marginTop: 16 }}>
        ¿No tienes cuenta? Regístrate
      </Text>
    </View>
  );
}
