import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '@/screens/Home/HomeScreen';
import PetsStack from '@/navigation/PetsStack';
import RecipesScreen from '@/screens/Recipes/RecipesScreen';
import ProfileScreen from '@/screens/Profile/ProfileScreen';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export type MainTabsParamList = {
  Home: undefined;
  PetsTab: undefined;
  Recipes: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.brand.cream },
        headerTintColor: colors.brand.tealDark,
        tabBarActiveTintColor: colors.brand.teal,
        tabBarInactiveTintColor: colors.brand.gray
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Inicio', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="PetsTab"
        component={PetsStack}
        options={{ title: 'Mis Mascotas', tabBarIcon: ({ color, size }) => <MaterialIcons name="pets" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Recipes"
        component={RecipesScreen}
        options={{ title: 'Recetas', tabBarIcon: ({ color, size }) => <Ionicons name="restaurant" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
