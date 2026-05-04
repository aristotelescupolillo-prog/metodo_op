export type Segment = 'SERVIÇOS' | 'VAREJO' | 'MARCA';
export type Audience = 'B2C' | 'B2B';
export type BusinessMoment = 'lançamento' | 'consolidação' | 'reativação' | 'sazonalidade';
export type OutputMode = 'feed' | 'stories' | 'feed+stories';
export type OutputFormat = 'feed' | 'carrossel' | 'reels' | 'stories';
export type MoodCode = 'OP-01' | 'OP-02' | 'OP-03' | 'OP-04' | 'OP-05' | 'OP-06';

export type FontPair = 'Inter' | 'Montserrat' | 'Playfair Display' | 'Roboto Slab' | 'Poppins' | 'Lora' | 'Raleway' | 'Merriweather';

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
  outputMode: OutputMode;
  sequenceSize: 3 | 6 | 9;
  storiesDays: 1 | 2 | 3 | 4 | 5;
  storiesQuantity: 3 | 6;
  outputFormats: OutputFormat[];
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
mainActivity?: string;
instagramUrl?: string;
