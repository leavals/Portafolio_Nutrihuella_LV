import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RecipesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recetas favoritas</Text>
      <Text style={styles.p}>Próximamente...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#fff' },
  title: { fontSize:20, fontWeight:'800', marginBottom:8 },
  p: { color:'#6B7280' }
});
