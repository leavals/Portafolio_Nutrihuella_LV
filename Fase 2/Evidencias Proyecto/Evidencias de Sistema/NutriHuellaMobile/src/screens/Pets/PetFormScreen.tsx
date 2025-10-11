import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Switch, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PetsStackParamList } from '@/navigation/PetsStack';
import { createPet, getPet, updatePet } from '@/services/pets';
import { colors } from '@/theme/colors';

type Props = NativeStackScreenProps<PetsStackParamList, 'PetForm'>;

export default function PetFormScreen({ route, navigation }: Props) {
  const petId = route.params?.petId;
  const isEdit = !!petId;

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Perro');
  const [sex, setSex] = useState('Macho');
  const [breed, setBreed] = useState('');
  const [weight, setWeight] = useState('');
  const [size, setSize] = useState('Mediano');
  const [neutered, setNeutered] = useState(false);

  useEffect(() => {
    (async () => {
      if (isEdit && petId) {
        const p = await getPet(petId);
        setName(p.name || '');
        setSpecies(p.species || 'Perro');
        setSex(p.sex || 'Macho');
        setBreed(p.breed || '');
        setWeight(p.weight ? String(p.weight) : '');
        setSize(p.size || 'Mediano');
        setNeutered(!!p.neutered);
      }
    })();
  }, [petId]);

  const onSave = async () => {
    try {
      const payload: any = { name, species, sex, breed, size, neutered };
      if (weight) payload.weight = Number(weight);
      if (isEdit && petId) {
        await updatePet(petId, payload);
      } else {
        await createPet(payload);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo guardar');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isEdit ? 'Editar Mascota' : 'Nueva Mascota'}</Text>
      <TextInput style={styles.input} placeholder="Nombre" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Especie (Perro/Gato)" value={species} onChangeText={setSpecies} />
      <TextInput style={styles.input} placeholder="Sexo (Macho/Hembra)" value={sex} onChangeText={setSex} />
      <TextInput style={styles.input} placeholder="Raza" value={breed} onChangeText={setBreed} />
      <TextInput style={styles.input} placeholder="Peso (kg)" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
      <TextInput style={styles.input} placeholder="Tamaño (Pequeño/Mediano/Grande)" value={size} onChangeText={setSize} />
      <View style={styles.row}>
        <Text style={{ flex:1 }}>Esterilizado</Text>
        <Switch value={neutered} onValueChange={setNeutered} />
      </View>

      <Pressable style={styles.btn} onPress={onSave}>
        <Text style={styles.btnText}>Guardar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff', padding:16 },
  title: { fontSize:20, fontWeight:'800', color: colors.brand.tealDark, marginBottom:12 },
  input: { borderWidth:1, borderColor:'#e5e7eb', borderRadius:10, padding:12, marginBottom:10 },
  row: { flexDirection:'row', alignItems:'center', marginVertical:6 },
  btn: { backgroundColor: colors.brand.teal, padding:14, borderRadius:12, alignItems:'center', marginTop:8 },
  btnText: { color:'#fff', fontWeight:'700' }
});
