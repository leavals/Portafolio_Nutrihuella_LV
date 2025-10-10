import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthStack';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    try {
      setLoading(true);
      await register(name.trim(), email.trim(), password);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo crear la cuenta');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>
      <TextInput placeholder="Nombre" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
      <TextInput placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />

      <Pressable style={[styles.btn, loading && { opacity: 0.7 }]} onPress={onRegister} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Creando...' : 'Crear cuenta'}</Text>
      </Pressable>

      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.footerText}>¿Ya tienes cuenta? Inicia sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff', padding:24, justifyContent:'center' },
  title: { fontSize:26, fontWeight:'800', color: colors.brand.tealDark, marginBottom:16, textAlign:'center' },
  input: { borderWidth:1, borderColor:'#e5e7eb', borderRadius:12, padding:14, marginBottom:12, fontSize:16 },
  btn: { backgroundColor: colors.brand.teal, padding:14, borderRadius:12, alignItems:'center', marginTop:4 },
  btnText: { color:'#fff', fontWeight:'700', fontSize:16 },
  footerText: { color: colors.brand.teal, textAlign:'center', marginTop:16, fontSize:16 }
});
