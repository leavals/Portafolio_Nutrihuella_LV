import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { listPets, Pet } from '@/services/pets';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PetsStackParamList } from '@/navigation/PetsStack';
import { colors } from '@/theme/colors';

type Props = NativeStackScreenProps<PetsStackParamList, 'PetsList'>;

export default function PetsListScreen({ navigation }: Props) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const data = await listPets();
      setPets(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { const unsub = navigation.addListener('focus', load); return unsub; }, [navigation]);

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={pets}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('PetDetail', { petId: String(item.id), name: item.name })}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSub}>{item.species || 'Mascota'}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No tienes mascotas registradas aún.</Text>}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('PetForm')}>
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff' },
  center: { flex:1, alignItems:'center', justifyContent:'center' },
  card: { padding:16, borderBottomWidth:1, borderColor:'#eee' },
  cardTitle: { fontSize:18, fontWeight:'700', color: colors.brand.ink },
  cardSub: { color: colors.brand.gray, marginTop:2 },
  empty: { padding:24, textAlign:'center', color: colors.brand.gray },
  fab: { position:'absolute', right:20, bottom:20, width:56, height:56, borderRadius:28, backgroundColor: colors.brand.teal, alignItems:'center', justifyContent:'center', elevation:4 },
  fabText: { color:'#fff', fontSize:28, lineHeight:28 }
});
