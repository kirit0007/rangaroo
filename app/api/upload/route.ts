import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let fileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.png`;
    let fileBuffer: Buffer | null = null;
    let mimeType = 'image/png';
    let base64Url: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }
      mimeType = file.type || 'image/png';
      fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      base64Url = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    } else {
      const body = await request.json();
      const { image, name } = body;
      if (!image) {
        return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
      }
      if (name) fileName = `${Date.now()}_${name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      base64Url = image;

      if (image.startsWith('data:')) {
        const matches = image.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          fileBuffer = Buffer.from(matches[2], 'base64');
        }
      }
    }

    // Attempt Supabase Storage Upload to public bucket "products"
    try {
      const supabase = createServerClient();
      if (fileBuffer) {
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('products')
          .upload(fileName, fileBuffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase
            .storage
            .from('products')
            .getPublicUrl(fileName);

          if (publicUrlData?.publicUrl) {
            console.log('[Upload API] Supabase CDN public URL generated:', publicUrlData.publicUrl);
            return NextResponse.json({ 
              url: publicUrlData.publicUrl,
              publicUrl: publicUrlData.publicUrl,
              storage: 'supabase',
            });
          }
        } else {
          console.warn('[Upload API] Supabase Storage upload warning:', uploadError?.message);
        }
      }
    } catch (sbErr) {
      console.warn('[Upload API] Supabase Storage exception:', sbErr);
    }

    // Fallback: Return optimized base64 Data URL (guaranteed public access across all devices)
    return NextResponse.json({
      url: base64Url || '/logo.png',
      publicUrl: base64Url || '/logo.png',
      storage: 'data-uri',
    });
  } catch (error: any) {
    console.error('[Upload API Exception]', error);
    return NextResponse.json({ error: error.message || 'Image upload failed' }, { status: 500 });
  }
}
