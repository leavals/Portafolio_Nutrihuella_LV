import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PetsListScreen from '@/screens/Pets/PetsListScreen';
import PetDetailScreen from '@/screens/Pets/PetDetailScreen';
import PetFormScreen from '@/screens/Pets/PetFormScreen';
import PetWeightsScreen from '@/screens/Pets/PetWeightsScreen';
import PetVaccinesScreen from '@/screens/Pets/PetVaccinesScreen';
import PetDiseasesScreen from '@/screens/Pets/PetDiseasesScreen';
import PetNutritionScreen from '@/screens/Pets/PetNutritionScreen';
import PetPantryScreen from '@/screens/Pets/PetPantryScreen';

export type PetsStackParamList = {
  PetsList: undefined;
  PetDetail: { petId: string; name?: string };
  PetForm: { petId?: string };
  PetWeights: { petId: string };
  PetVaccines: { petId: string };
  PetDiseases: { petId: string };
  PetNutrition: { petId: string };
  PetPantry: { petId: string };
};

const Stack = createNativeStackNavigator<PetsStackParamList>();

export default function PetsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PetsList" component={PetsListScreen} options={{ title: 'Mis Mascotas' }} />
      <Stack.Screen name="PetDetail" component={PetDetailScreen} options={({ route }) => ({ title: route.params?.name || 'Mascota' })} />
      <Stack.Screen name="PetForm" component={PetFormScreen} options={{ title: 'Mascota' }} />
      <Stack.Screen name="PetWeights" component={PetWeightsScreen} options={{ title: 'Peso' }} />
      <Stack.Screen name="PetVaccines" component={PetVaccinesScreen} options={{ title: 'Vacunas' }} />
      <Stack.Screen name="PetDiseases" component={PetDiseasesScreen} options={{ title: 'Enfermedades' }} />
      <Stack.Screen name="PetNutrition" component={PetNutritionScreen} options={{ title: 'Nutrición' }} />
      <Stack.Screen name="PetPantry" component={PetPantryScreen} options={{ title: 'Despensa' }} />
    </Stack.Navigator>
  );
}
