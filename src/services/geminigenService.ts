
export interface GeminigenImageParams {
  prompt: string;
  model: string;
  aspect_ratio?: string;
  output_format?: string;
  resolution?: string;
  style?: string;
  file_urls?: string[];
}

export interface GeminigenVideoParams {
  prompt: string;
  model: string;
  resolution?: string;
  aspect_ratio?: string;
  ref_images?: string[];
  ref_history?: string; // For extensions
  duration?: number;
  mode?: string;
}

export interface GeminigenTextParams {
  prompt: string;
  model: string;
  system_instruction?: string;
  temperature?: number;
}

async function handleResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    const msg = (data as any).error_message || (data as any).message || "Geminigen API Error";
    throw new Error(msg);
  }
  return data as any;
}



// Determine which video endpoint to call based on model name
function getVideoEndpoint(model: string, isExtension: boolean = false): string {
  const type = isExtension ? 'video-extend' : 'video-gen';
  if (model.startsWith('sora')) return `/api/geminigen/${type}/sora`;
  if (model.startsWith('grok')) return `/api/geminigen/${type}/grok`;
  // veo is the default
  return `/api/geminigen/${type}/veo`;
}

export async function generateGeminigenImage(params: GeminigenImageParams): Promise<{ url: string; downloadUrl?: string; uuid?: string }> {
  const formData = new FormData();
  formData.append('prompt', params.prompt);
  formData.append('model', params.model);
  if (params.aspect_ratio) formData.append('aspect_ratio', params.aspect_ratio);
  if (params.style) formData.append('style', params.style);
  if (params.resolution) formData.append('resolution', params.resolution);
  if (params.output_format) formData.append('output_format', params.output_format);

  if (params.file_urls) {
    for (const url of params.file_urls) {
      if (url.startsWith('data:')) {
        // We still need to handle base64 strings locally as Blobs so multer picks them up as files
        const res = await fetch(url);
        const blob = await res.blob();
        formData.append('file_urls', blob, `image_${Math.random().toString(36).slice(2)}.png`);
      } else {
        // Pass HTTP URLs directly to the server, which will download them securely
        formData.append('file_urls', url);
      }
    }
  }

  const response = await fetch("/api/geminigen/image", {
    method: "POST",
    body: formData,
  });
  const data = await handleResponse(response);

  if (data.status === 2) return { ...extractResult(data), uuid: data.uuid };
  return pollGeminigenStatus(data.uuid, 10000); // 10s for images
}

export async function generateGeminigenVideo(params: GeminigenVideoParams): Promise<{ url: string; downloadUrl?: string; uuid?: string }> {
  // ... (keep rest of body same)
  const formData = new FormData();
  formData.append('prompt', params.prompt);
  formData.append('model', params.model);
  if (params.aspect_ratio) formData.append('aspect_ratio', params.aspect_ratio);
  if (params.resolution) formData.append('resolution', params.resolution);
  if (params.duration) formData.append('duration', params.duration.toString());
  if (params.mode) formData.append('mode', params.mode);

  if (params.ref_history) {
    formData.append('ref_history', params.ref_history);
  }

  if (params.ref_images) {
    const fieldName = params.model.startsWith('grok') ? 'files' : 'ref_images';
    for (const img of params.ref_images) {
      if (img.startsWith('data:')) {
        const res = await fetch(img);
        const blob = await res.blob();
        formData.append(fieldName, blob, 'image.png');
      } else {
        formData.append(fieldName, img);
      }
    }
  }

  const endpoint = getVideoEndpoint(params.model, !!params.ref_history);
  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });
  const data = await handleResponse(response);

  if (data.status === 2) return { ...extractResult(data), uuid: data.uuid };
  return pollGeminigenStatus(data.uuid, 20000); // 20s for videos
}

export async function generateGeminigenText(params: GeminigenTextParams): Promise<{ url: string; downloadUrl?: string; uuid?: string }> {
  const formData = new FormData();
  formData.append('input_text', params.prompt);
  formData.append('model_name', params.model);
  if (params.system_instruction) formData.append('system_instruction', params.system_instruction);
  if (params.temperature) formData.append('temperature', params.temperature.toString());

  const response = await fetch("/api/geminigen/text", {
    method: "POST",
    body: formData,
  });
  const data = await handleResponse(response);

  if (data.status === 2) return { ...extractResult(data), uuid: data.uuid };
  return pollGeminigenStatus(data.uuid, 10000); // 10s for text
}

export async function generateGeminigenTTS(params: { model: string; voice: string; text: string }): Promise<{ url: string; downloadUrl?: string; uuid?: string }> {
  const response = await fetch("/api/geminigen/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model_name: params.model,
      voices: [params.voice],
      input_text: params.text
    }),
  });
  const data = await handleResponse(response);

  if (data.status === 2) return { ...extractResult(data), uuid: data.uuid };
  return pollGeminigenStatus(data.uuid, 10000); // 10s for tts
}

export async function generateAIModel(params: any): Promise<{ url: string; downloadUrl?: string; uuid?: string }> {
  const prompt = `ULTRA-REALISTIC AI MODEL: Gender: ${params.subject?.gender}, Age: ${params.subject?.age_range}, Ethnicity: ${params.subject?.ethnicity}, Hair: ${params.subject?.hair_color} ${params.subject?.hair_style}, Eyes: ${params.subject?.eye_color}, Expression: ${params.subject?.expression}, Outfit: ${params.appearance?.outfit}, Lighting: ${params.lighting?.type}, Quality: ${params.camera?.quality}, Realism: ${params.render_style?.realism_level}`;

  return generateGeminigenImage({
    prompt,
    model: "nano-banana-pro",
    aspect_ratio: "1:1"
  });
}

export async function generateFaceSwap(referenceImage: string, targetImage: string, additionalPrompt: string = ''): Promise<{ url: string; downloadUrl?: string; uuid?: string }> {
  const basePrompt = `Create a realistic image where the character from Image 2 is used as the subject.
Preserve the subject's face, body, and identity from Image 2 exactly.
Make the subject pose and dress exactly like the character in Image 1, including the same outfit, posture, body position, and styling.
Use the same camera angle and framing as Image 1.
High realism, accurate proportions, natural lighting.
Do not copy the face or identity from Image 1.`;

  const finalPrompt = additionalPrompt ? `${basePrompt}\n\nAdditional Details: ${additionalPrompt}` : basePrompt;

  return generateGeminigenImage({
    prompt: finalPrompt,
    model: "nano-banana-pro",
    aspect_ratio: "1:1",
    file_urls: [referenceImage, targetImage] // Image 1: pose reference, Image 2: face source
  });
}

/**
 * Extracts the final media URL from a completed history response.
 * Checks all possible result fields in priority order.
 */
function extractResult(data: any): { url: string; downloadUrl?: string } {
  // Image result
  if (data.generated_image?.[0]?.image_url) {
    return {
      url: data.generated_image[0].image_url,
      downloadUrl: data.generated_image[0].file_download_url
    };
  }
  // Video result
  if (data.generated_video?.[0]?.video_url) {
    return {
      url: data.generated_video[0].video_url,
      downloadUrl: data.generated_video[0].file_download_url
    };
  }
  // Audio result
  if (data.generated_audio?.[0]?.audio_url) {
    return {
      url: data.generated_audio[0].audio_url,
      downloadUrl: data.generated_audio[0].file_download_url
    };
  }
  // Text result
  if (data.response_text) return { url: data.response_text };

  // Fallback fields from initial response / simple completions
  if (data.generate_result) return { url: data.generate_result };
  if (data.media_url) return { url: data.media_url };
  throw new Error("Generation completed but no result URL found in response.");
}

/**
 * Polls GET /history/{uuid} every pollIntervalMs until status is 2 (completed) or 3 (failed).
 */
async function pollGeminigenStatus(uuid: string, pollIntervalMs: number = 10000): Promise<{ url: string; downloadUrl?: string; uuid?: string }> {
  while (true) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    const response = await fetch(`/api/geminigen/status/${uuid}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any).error_message || "Status check failed");
    }

    const data = await response.json() as any;

    if (data.status === 2) {
      // Completed — extract and return the result URL
      return { ...extractResult(data), uuid: data.uuid };
    }

    if (data.status === 3) {
      throw new Error(data.error_message || "Generation failed");
    }

    // status === 1 → still processing, continue polling
  }
}
