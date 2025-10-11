// src/types/pet.ts
export type Pet = {
  id: string;
  name: string;
  species?: 'dog' | 'cat' | string;
  breed?: string | null;
  age?: number | null;
  weight_kg?: number | null;
  sex?: 'male' | 'female' | string | null;
};
