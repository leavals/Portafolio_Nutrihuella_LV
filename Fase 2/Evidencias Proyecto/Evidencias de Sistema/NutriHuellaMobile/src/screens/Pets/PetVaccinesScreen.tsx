import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PetsStackParamList } from '@/navigation/PetsStack';
import { listVaccinations, addVaccination, deleteVaccination } from '@/services/pets';

type Props = NativeStackScreenProps<PetsStackParamList, 'PetVaccines'>;

export default function PetVaccinesScreen({ route }: Props) {
  const { petId } = route.params;
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));

  const load = async () => {
    const data = await listVaccinations(petId);
    setItems(data);
  };

  useEffect(() => { load(); }, [petId]);

  const onAdd = async () => {
    try { await addVaccination(petId, { name, date }); setName(''); await load(); }
    catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'No se pudo agregar'); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput style={styles.input} placeholder="Vacuna" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />
        <Pressable style={styles.btn} onPress={onAdd}><Text style={styles.btnText}>Agregar</Text></Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.name} — {item.date}</Text>
            <Pressable onPress={() => deleteVaccination(petId, String(item.id)).then(load)}>
              <Text style={{ color:'crimson' }}>Eliminar</Text>
            </Pressable>
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
