export const TTS_MODELS = [
  {
    id: 'geminigen-tts',
    name: 'Geminigen Standard',
    provider: 'Geminigen',
    voices: [
      { id: 'OA001', name: 'Male 1' },
      { id: 'OA002', name: 'Female 1' },
      { id: 'OA003', name: 'Male 2' },
      { id: 'OA004', name: 'Female 2' },
    ],
    cost: 10,
  }
];

export const VIDEO_MODELS = [
  {
    id: 'veo-3.1',
    name: 'Veo 3.1 HQ',
    provider: 'Geminigen',
    type: 'veo',
    cost: 100,
    status: 'Available'
  },
  {
    id: 'veo-3.1-fast',
    name: 'Veo 3.1 Fast',
    provider: 'Geminigen',
    type: 'veo',
    cost: 3,
    status: 'New'
  },
  {
    id: 'veo-2',
    name: 'Veo 2',
    provider: 'Geminigen',
    type: 'veo',
    cost: 20,
    status: 'Available'
  },
  {
    id: 'sora-2',
    name: 'Sora 2',
    provider: 'Geminigen',
    type: 'sora',
    cost: 3,
    status: 'Available'
  },
  {
    id: 'sora-2-pro',
    name: 'Sora 2 Pro',
    provider: 'Geminigen',
    type: 'sora',
    cost: 240,
    status: 'New'
  },
  {
    id: 'sora-2-pro-hd',
    name: 'Sora 2 Pro HD',
    provider: 'Geminigen',
    type: 'sora',
    cost: 50,
    status: 'Available'
  },
  {
    id: 'grok-3',
    name: 'Grok 3',
    provider: 'Geminigen',
    type: 'grok',
    cost: 3,
    status: 'New'
  }
];

export const IMAGE_MODELS = [
  {
    id: 'nano-banana-pro',
    name: 'Gemini 3.0 (Nano Banana Pro)',
    provider: 'Geminigen',
    description: 'Fast generation with good quality — Free model',
    cost: 3,
  },
];

export const IMAGE_STYLES = [
  { id: 'None', label: 'None' },
  { id: '3D Render', label: '3D Render' },
  { id: 'Acrylic', label: 'Acrylic' },
  { id: 'Anime General', label: 'Anime' },
  { id: 'Creative', label: 'Creative' },
  { id: 'Dynamic', label: 'Dynamic' },
  { id: 'Fashion', label: 'Fashion' },
  { id: 'Game Concept', label: 'Game Concept' },
  { id: 'Graphic Design 3D', label: 'Graphic Design 3D' },
  { id: 'Illustration', label: 'Illustration' },
  { id: 'Photorealistic', label: 'Photorealistic' },
  { id: 'Portrait', label: 'Portrait' },
  { id: 'Portrait Cinematic', label: 'Portrait Cinematic' },
  { id: 'Portrait Fashion', label: 'Portrait Fashion' },
  { id: 'Ray Traced', label: 'Ray Traced' },
  { id: 'Stock Photo', label: 'Stock Photo' },
  { id: 'Watercolor', label: 'Watercolor' },
];

export const IMAGE_RESOLUTIONS = ['1K', '2K', '4K'];

export const IMAGE_ASPECT_RATIOS = [
  { value: '1:1', label: '1:1 Square' },
  { value: '16:9', label: '16:9 Wide' },
  { value: '9:16', label: '9:16 Tall' },
  { value: '4:3', label: '4:3 Photo' },
  { value: '3:4', label: '3:4 Portrait' },
];

export const IMAGE_OUTPUT_FORMATS = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
];

export const GROK_MODES = [
  { id: 'custom', label: 'Custom' },
  { id: 'normal', label: 'Normal' },
  { id: 'extremely-crazy', label: 'Extremely Crazy (Fun)' },
  { id: 'extremely-spicy-or-crazy', label: 'Extremely Spicy/Crazy' },
];

export const GROK_DURATIONS = [6, 10, 15];

export const GROK_ASPECT_RATIOS = [
  { id: 'landscape', label: 'Landscape (16:9)' },
  { id: 'portrait', label: 'Portrait (9:16)' },
  { id: 'square', label: 'Square (1:1)' },
  { id: 'vertical', label: 'Vertical (2:3)' },
  { id: 'horizontal', label: 'Horizontal (3:2)' },
];
