import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PetsStackParamList } from '@/navigation/PetsStack';
import { getUsablePantry } from '@/services/pets';

type Props = NativeStackScreenProps<PetsStackParamList, 'PetPantry'>;

export default function PetPantryScreen({ route }: Props) {
  const { petId } = route.params;
  const [aptos, setAptos] = useState<any[]>([]);
  const [prohibidos, setProhibidos] = useState<any[]>([]);

  const load = async () => {
    const data = await getUsablePantry(petId);
    // backend may format differently; try to normalize
    setAptos(data?.aptos || data?.usable || []);
    setProhibidos(data?.prohibidos || data?.forbidden || []);
  };

  useEffect(() => { load(); }, [petId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aptos</Text>
      <FlatList data={aptos} keyExtractor={(it)=>String(it.id || it.name)} renderItem={({ item }) => (
        <Text style={styles.item}>• {item.name} {item.quantity ? `— ${item.quantity} ${item.unit || ''}`: ''}</Text>
      )} />

      <Text style={[styles.title, { marginTop:16 }]}>Prohibidos</Text>
      <FlatList data={prohibidos} keyExtractor={(it)=>String(it.id || it.name)} renderItem={({ item }) => (
        <Text style={styles.item}>• {item.name}</Text>
      )} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff', padding:12 },
  title: { fontSize:18, fontWeight:'800', marginBottom:6 },
  item: { paddingVertical:6, borderBottomWidth:1, borderColor:'#f0f0f0' }
});
