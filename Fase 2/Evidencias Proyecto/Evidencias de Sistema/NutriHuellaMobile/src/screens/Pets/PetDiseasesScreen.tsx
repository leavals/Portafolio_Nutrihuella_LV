import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Pressable, Alert, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PetsStackParamList } from '@/navigation/PetsStack';
import { listDiseases, addDisease, updateDisease, deleteDisease, ackNoDiseases } from '@/services/pets';

type Props = NativeStackScreenProps<PetsStackParamList, 'PetDiseases'>;

export default function PetDiseasesScreen({ route }: Props) {
  const { petId } = route.params;
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [active, setActive] = useState(true);

  const load = async () => {
    const data = await listDiseases(petId);
    setItems(data);
  };

  useEffect(() => { load(); }, [petId]);

  const onAdd = async () => {
    try { await addDisease(petId, { name, diagnosedAt: date, status: active ? 'active':'resolved' }); setName(''); await load(); }
    catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'No se pudo agregar'); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput style={styles.input} placeholder="Condición" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />
        <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
          <Text>Activa</Text>
          <Switch value={active} onValueChange={setActive} />
        </View>
        <Pressable style={styles.btn} onPress={onAdd}><Text style={styles.btnText}>Agregar</Text></Pressable>
      </View>
      <Pressable onPress={() => ackNoDiseases(petId).then(load)}>
        <Text style={{ color:'#6B7280', textAlign:'center', marginBottom:8 }}>Marcar "Sin enfermedades"</Text>
      </Pressable>
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.name} — {item.diagnosedAt} — {item.status}</Text>
            <Pressable onPress={() => deleteDisease(petId, String(item.id)).then(load)}>
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
  row: { flexDirection:'row', gap:8, marginBottom:10, flexWrap:'wrap' },
  input: { flexGrow:1, minWidth:140, borderWidth:1, borderColor:'#e5e7eb', borderRadius:10, padding:10 },
  btn: { backgroundColor:'#10776F', paddingHorizontal:12, borderRadius:10, justifyContent:'center' },
  btnText: { color:'#fff', fontWeight:'700' },
  item: { paddingVertical:10, borderBottomWidth:1, borderColor:'#eee', flexDirection:'row', alignItems:'center', justifyContent:'space-between' }
});
