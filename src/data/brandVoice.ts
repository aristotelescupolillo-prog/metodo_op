import { Segment } from '../types';

export const brandVoiceCatalog: Record<Segment, string[]> = {
  'SERVIÇOS': ['Direta', 'Consultiva', 'Acolhedora', 'Técnica', 'Humor leve'],
  'VAREJO': ['Calorosa', 'Convidativa', 'Sensorial', 'Divertida', 'Irreverente'],
  'MARCA': ['Autoral', 'Inspiradora', 'Sofisticada', 'Afetiva', 'Provocativa'],
};

export function defaultVoice(segment: Segment): string {
  return brandVoiceCatalog[segment][0];
}
