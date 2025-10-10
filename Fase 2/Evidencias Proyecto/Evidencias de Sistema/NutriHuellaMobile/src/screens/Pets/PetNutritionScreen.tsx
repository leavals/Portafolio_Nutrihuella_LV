import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PetsStackParamList } from '@/navigation/PetsStack';
import { getNutrition, getNutritionDefaults, upsertNutrition } from '@/services/pets';

type Props = NativeStackScreenProps<PetsStackParamList, 'PetNutrition'>;

export default function PetNutritionScreen({ route }: Props) {
  const { petId } = route.params;
  const [model, setModel] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getNutrition(petId);
      setModel(data || {});
    } catch {
      const def = await getNutritionDefaults(petId);
      setModel(def || {});
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [petId]);

  const onSave = async () => {
    try { await upsertNutrition(petId, model); Alert.alert('OK', 'Ficha nutricional guardada'); }
    catch (e:any) { Alert.alert('Error', e?.response?.data?.message || 'No se pudo guardar'); }
  };

  const setField = (k:string, v:any) => setModel((m:any) => ({ ...m, [k]: v }));

  if (loading) return <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}><Text>Cargando...</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>Ficha Nutricional</Text>

      <TextInput style={styles.input} placeholder="Dieta (Comercial/Casera/Mixta)" value={model.dietType || ''} onChangeText={(v)=>setField('dietType', v)} />
      <TextInput style={styles.input} placeholder="Comidas por día" value={String(model.mealsPerDay || '')} onChangeText={(v)=>setField('mealsPerDay', Number(v))} keyboardType="number-pad" />
      <TextInput style={styles.input} placeholder="Actividad (Baja/Media/Alta)" value={model.activityLevel || ''} onChangeText={(v)=>setField('activityLevel', v)} />
      <TextInput style={styles.input} placeholder="Objetivo (Mantener/Adelgazar/Subir)" value={model.goal || ''} onChangeText={(v)=>setField('goal', v)} />
      <TextInput style={styles.input} placeholder="Intolerancias (coma separadas)" value={model.intolerances || ''} onChangeText={(v)=>setField('intolerances', v)} />
      <TextInput style={styles.input} placeholder="Alergias (coma separadas)" value={model.allergies || ''} onChangeText={(v)=>setField('allergies', v)} />
      <TextInput style={styles.input} placeholder="Suplementos (coma separadas)" value={model.supplements || ''} onChangeText={(v)=>setField('supplements', v)} />
      <TextInput style={styles.input} placeholder="kcal/día recomendadas" value={String(model.recommendedCalories || '')} onChangeText={(v)=>setField('recommendedCalories', Number(v))} keyboardType="number-pad" />
      <TextInput style={styles.input} placeholder="Agua (ml/día)" value={String(model.waterIntake || '')} onChangeText={(v)=>setField('waterIntake', Number(v))} keyboardType="number-pad" />
      <TextInput style={[styles.input, { height:100 }]} multiline placeholder="Notas" value={model.notes || ''} onChangeText={(v)=>setField('notes', v)} />

      <Pressable style={styles.btn} onPress={onSave}><Text style={styles.btnText}>Guardar</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff', padding:12 },
  title: { fontSize:20, fontWeight:'800', marginBottom:12 },
  input: { borderWidth:1, borderColor:'#e5e7eb', borderRadius:10, padding:12, marginBottom:10 },
  btn: { backgroundColor:'#10776F', padding:14, borderRadius:12, alignItems:'center', marginTop:8 },
  btnText: { color:'#fff', fontWeight:'700' }
});
