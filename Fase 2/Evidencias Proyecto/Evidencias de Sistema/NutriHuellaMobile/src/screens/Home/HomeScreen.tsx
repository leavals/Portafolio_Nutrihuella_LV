import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { useAuth } from '@/context/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Hola {user?.name?.split(' ')[0] || '!' } 👋</Text>
      <Text style={styles.subtitle}>Bienvenido a NutriHuella</Text>
      <Text style={styles.body}>Desde aquí podrás gestionar la salud y nutrición de tus mascotas.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: colors.brand.cream, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: colors.brand.tealDark, marginBottom: 8 },
  subtitle: { fontSize: 18, color: colors.brand.teal, marginBottom: 12 },
  body: { fontSize: 16, color: colors.brand.ink },
});
