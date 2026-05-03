export type Segment = 'SERVIÇOS' | 'VAREJO' | 'MARCA';
export type Audience = 'B2C' | 'B2B';
export type BusinessMoment = 'lançamento' | 'consolidação' | 'reativação' | 'sazonalidade';
export type OutputFormat = 'feed' | 'carrossel' | 'reels' | 'stories';
export type MoodCode = 'OP-01' | 'OP-02' | 'OP-03' | 'OP-04' | 'OP-05' | 'OP-06';

export interface BrandKit {
  companyName: string;
  segment: Segment;
  logoDataUrl?: string;
  logoHasName: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  fontPair: 'Inter' | 'Montserrat' | 'Playfair' | 'Roboto Slab';
  brandVoice: string;
}

export interface ContentFormData {
  companyName: string;
  segment: Segment;
  audience: Audience;
  mainActivity: string;
  instagramUrl?: string;
  businessMoment: BusinessMoment;
  keyInfo?: string;
  brandVoice: string;
  outputFormats: OutputFormat[];
  feedQuantity: 3 | 6 | 9;
  storiesQuantity: 3 | 6;
  storiesDays: 1 | 2 | 3 | 4 | 5;
}

export interface FeedItem {
  dia: number;
  formato: 'Estático' | 'Carrossel' | 'Reels';
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
}

export interface ReelsGuide {
  hook: string;
  script: string;
  imagePrompt: string;
  screenText: string;
}

export interface MethodOpResult {
  feed?: FeedItem[];
  carousel?: CarouselCard[];
  reels?: ReelsGuide;
  stories?: StoriesSequence[];
  raw?: unknown;
}

export interface TemplateMood {
  code: MoodCode;
  name: string;
  intent: string;
  recommendedFor: Segment[];
  color: string;
}
