import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PetsStackParamList } from '@/navigation/PetsStack';
import { getPet, Pet } from '@/services/pets';
import { colors } from '@/theme/colors';

type Props = NativeStackScreenProps<PetsStackParamList, 'PetDetail'>;

export default function PetDetailScreen({ route, navigation }: Props) {
  const { petId } = route.params;
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getPet(petId);
      setPet(data);
      navigation.setOptions({ title: data.name || 'Mascota' });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [petId]);

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!pet) return <View style={styles.center}><Text>No encontrado</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{pet.name}</Text>
      <Text style={styles.subtitle}>{pet.species} • {pet.breed || 'Sin raza'}</Text>

      <View style={styles.menu}>
        <Item label="Peso" onPress={() => navigation.navigate('PetWeights', { petId })} />
        <Item label="Vacunas" onPress={() => navigation.navigate('PetVaccines', { petId })} />
        <Item label="Enfermedades" onPress={() => navigation.navigate('PetDiseases', { petId })} />
        <Item label="Nutrición" onPress={() => navigation.navigate('PetNutrition', { petId })} />
        <Item label="Despensa" onPress={() => navigation.navigate('PetPantry', { petId })} />
        <Item label="Editar" onPress={() => navigation.navigate('PetForm', { petId })} />
      </View>
    </View>
  );
}

function Item({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      <Text style={styles.itemText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:'#fff' },
  center: { flex:1, alignItems:'center', justifyContent:'center' },
  title: { fontSize:24, fontWeight:'800', color: colors.brand.tealDark },
  subtitle: { color: colors.brand.gray, marginTop:4, marginBottom:16 },
  menu: { },
  item: { paddingVertical:14, borderBottomWidth:1, borderColor:'#eee' },
  itemText: { fontSize:16, color: colors.brand.ink }
});
