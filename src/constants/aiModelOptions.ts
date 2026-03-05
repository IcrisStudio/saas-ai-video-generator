import { 
  User, 
  Sun, 
  Moon, 
  Cloud, 
  Camera, 
  Palette, 
  Shirt, 
  Scissors, 
  Eye, 
  Smile,
  Globe,
  Mountain,
  Home,
  Building,
  Zap,
  Star
} from 'lucide-react';

export const ETHNICITIES = [
  { id: 'caucasian', label: 'Caucasian', icon: Globe },
  { id: 'east_asian', label: 'East Asian', icon: Globe },
  { id: 'south_asian', label: 'South Asian', icon: Globe },
  { id: 'hispanic', label: 'Hispanic', icon: Globe },
  { id: 'black', label: 'Black / African', icon: Globe },
  { id: 'middle_eastern', label: 'Middle Eastern', icon: Globe },
  { id: 'mixed', label: 'Mixed / Multi-ethnic', icon: Globe },
];

export const HAIR_STYLES = [
  { id: 'long_wavy', label: 'Long Wavy', icon: Scissors },
  { id: 'short_pixie', label: 'Short Pixie', icon: Scissors },
  { id: 'curly_afro', label: 'Curly / Afro', icon: Scissors },
  { id: 'straight_bob', label: 'Straight Bob', icon: Scissors },
  { id: 'braided', label: 'Braided', icon: Scissors },
  { id: 'bald', label: 'Bald / Shaved', icon: Scissors },
  { id: 'ponytail', label: 'Ponytail', icon: Scissors },
];

export const OUTFITS = [
  { id: 'casual_hoodie', label: 'Casual Hoodie', icon: Shirt },
  { id: 'business_suit', label: 'Business Suit', icon: Shirt },
  { id: 'summer_dress', label: 'Summer Dress', icon: Shirt },
  { id: 'leather_jacket', label: 'Leather Jacket', icon: Shirt },
  { id: 'sportswear', label: 'Sportswear', icon: Shirt },
  { id: 'elegant_gown', label: 'Elegant Gown', icon: Shirt },
  { id: 'traditional', label: 'Traditional', icon: Shirt },
];

export const LIGHTING_STYLES = [
  { id: 'soft_studio', label: 'Soft Studio', icon: Sun },
  { id: 'golden_hour', label: 'Golden Hour', icon: Cloud },
  { id: 'cinematic_neon', label: 'Cinematic Neon', icon: Zap },
  { id: 'natural_window', label: 'Natural Window', icon: Sun },
  { id: 'high_contrast', label: 'High Contrast', icon: Moon },
];

export const BACKGROUNDS = [
  { id: 'minimal_studio', label: 'Minimal Studio', icon: Home },
  { id: 'urban_street', label: 'Urban Street', icon: Building },
  { id: 'nature_forest', label: 'Nature Forest', icon: Mountain },
  { id: 'luxury_interior', label: 'Luxury Interior', icon: Star },
  { id: 'abstract_gradient', label: 'Abstract Gradient', icon: Palette },
];

export const EXPRESSIONS = [
  { id: 'natural_smile', label: 'Natural Smile', icon: Smile },
  { id: 'serious_editorial', label: 'Serious / Editorial', icon: User },
  { id: 'confident_look', label: 'Confident', icon: Zap },
  { id: 'soft_neutral', label: 'Soft Neutral', icon: User },
];

export const AGE_RANGES = [
  { id: '18-24', label: '18 - 24' },
  { id: '25-30', label: '25 - 30' },
  { id: '31-40', label: '31 - 40' },
  { id: '41-50', label: '41 - 50' },
  { id: '50+', label: '50+' },
];
