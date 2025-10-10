import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PetsStackParamList } from '@/navigation/PetsStack';
import { listWeights, addWeight, deleteWeight } from '@/services/pets';

type Props = NativeStackScreenProps<PetsStackParamList, 'PetWeights'>;

export default function PetWeightsScreen({ route }: Props) {
  const { petId } = route.params;
  const [items, setItems] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [weight, setWeight] = useState('');

  const load = async () => {
    const data = await listWeights(petId);
    setItems(data);
  };

  useEffect(() => { load(); }, [petId]);

  const onAdd = async () => {
    try {
      await addWeight(petId, { date, weight: Number(weight) });
      setWeight(''); await load();
    } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'No se pudo agregar'); }
  };

  const onDelete = async (id: string) => {
    try { await deleteWeight(petId, id); await load(); }
    catch (e: any) { Alert.alert('Error', 'No se pudo eliminar'); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        <TextInput style={styles.input} value={weight} onChangeText={setWeight} placeholder="Peso (kg)" keyboardType="decimal-pad" />
        <Pressable style={styles.btn} onPress={onAdd}><Text style={styles.btnText}>Agregar</Text></Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.date} — {item.weight} kg</Text>
            <Pressable onPress={() => onDelete(String(item.id))}><Text style={{ color:'crimson' }}>Eliminar</Text></Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:12, backgroundColor:'#fff' },
  row: { flexDirection:'row', gap:8, marginBottom:10 },
  input: { flex:1, borderWidth:1, borderColor:'#e5e7eb', borderRadius:10, padding:10 },
  btn: { backgroundColor:'#10776F', paddingHorizontal:12, borderRadius:10, justifyContent:'center' },
  btnText: { color:'#fff', fontWeight:'700' },
  item: { paddingVertical:10, borderBottomWidth:1, borderColor:'#eee', flexDirection:'row', alignItems:'center', justifyContent:'space-between' }
});
