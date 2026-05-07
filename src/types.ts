export type Segment = 'SERVIÇOS' | 'VAREJO' | 'MARCA';
export type Audience = 'B2C' | 'B2B';
export type BusinessMoment = 'lançamento' | 'consolidação' | 'reativação' | 'sazonalidade';
export type OutputMode = 'feed' | 'stories' | 'feed+stories';
export type OutputFormat = 'feed' | 'carrossel' | 'reels' | 'stories' | 'estatico_final';
export type MoodCode = 'OP-01' | 'OP-02' | 'OP-03' | 'OP-04' | 'OP-05' | 'OP-06';
export type FontPair = 'Inter' | 'Montserrat' | 'Playfair Display' | 'Roboto Slab' | 'Poppins' | 'Lora' | 'Raleway' | 'Merriweather';

// Trilha narrativa do Método OP — define qual peça fecha a sequência
// 'cinematica'      → reels no fechamento (comportamento atual, default)
// 'visual'          → estatico_final no fechamento
// 'experimentacao'  → estatico_final em sequência reduzida de 2 períodos
export type Track = 'cinematica' | 'visual' | 'experimentacao';

export interface BrandKit {
  companyName: string;
  segment: Segment;
  logoDataUrl?: string;
  logoHasName: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  fontPair: FontPair;
  brandVoice: string;
  mainActivity?: string;
  instagramUrl?: string;
}

export interface ContentFormData {
  companyName: string;
  segment: Segment;
  audience: Audience;
  businessMoment: BusinessMoment;
  keyInfo?: string;
  brandVoice: string;
  outputMode: OutputMode;
  sequenceSize: 3 | 6 | 9;
  storiesDays: 1 | 2 | 3 | 4 | 5;
  storiesQuantity: 3 | 6;
  outputFormats: OutputFormat[];
  // Trilha narrativa — opcional na Fase 1 (default: 'cinematica' = comportamento atual).
  // Usado de fato a partir da Fase 2.
  track?: Track;
}

export interface FeedItem {
  dia: number;
  formato: 'Estático' | 'Carrossel' | 'Reels' | 'Estático Final';
  titulo: string;
  texto: string;
  legenda: string;
  imagem: string;
}

export interface StoryItem {
  ordem: number;
  tipo: 'vídeo' | 'post';
  texto: string;
}

export interface StoriesSequence {
  dia: number;
  sequencia: string;
  stories: StoryItem[];
}

export interface CarouselCard {
  card: number;
  titulo: string;
  texto: string;
  imagePrompt: string;
  legenda?: string;
}

export interface ReelsGuide {
  hook: string;
  script: string;
  imagePrompt: string;
  screenText: string;
  legenda?: string;
}

// Contagem de itens gerados — ponte mínima para integração futura com o ERP
// Permite ao ERP debitar consumo do plano contratado sem refatorar este app.
export interface GenerationSummary {
  estaticos: number;
  carrosseis: number;
  reels: number;
  estaticosFinais: number;
  stories: number;
}

export interface MethodOpResult {
  feed?: FeedItem[];
  carousel?: CarouselCard[];
  reels?: ReelsGuide;
  stories?: StoriesSequence[];
  raw?: unknown;
  summary?: GenerationSummary;
}

export interface TemplateMood {
  code: MoodCode;
  name: string;
  intent: string;
  recommendedFor: Segment[];
  color: string;
}
