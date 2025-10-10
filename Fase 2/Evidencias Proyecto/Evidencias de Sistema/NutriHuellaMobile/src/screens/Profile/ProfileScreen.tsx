import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.p}><Text style={styles.key}>Nombre:</Text> {user?.name}</Text>
      <Text style={styles.p}><Text style={styles.key}>Email:</Text> {user?.email}</Text>

      <Pressable style={styles.btn} onPress={logout}>
        <Text style={styles.btnText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff', padding:16 },
  title: { fontSize:22, fontWeight:'800', color: colors.brand.tealDark, marginBottom:10 },
  p: { fontSize:16, marginBottom:6 },
  key: { color: '#6B7280' },
  btn: { backgroundColor: colors.brand.teal, marginTop:16, padding:12, borderRadius:12, alignItems:'center' },
  btnText: { color:'#fff', fontWeight:'700' }
});
