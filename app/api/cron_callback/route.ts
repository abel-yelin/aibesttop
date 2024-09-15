/* eslint-disable import/prefer-default-export */
import { NextResponse } from 'next/server';
import { createClient } from '@/db/supabase/client';

// submit table empty -> stop

// filter status
// isFeature (priority)
// time order

// when crawler is done
// insert web_nav table (tags <- tags[0] or 'other')
// update submit table status

export async function POST(req: NextRequest) {
  console.log('Cron callback received');
  try {
    // 获取请求头中的 Authorization
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header:', authHeader);

    // 检查 Authorization 是否存在并验证 token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header is missing or malformed' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const submitKey = process.env.CRON_AUTH_KEY;
    // 检查密钥
    const isValid = submitKey === token;
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 获取响应数据
    const body = await req.json();
    console.log('Received callback data:', body);

    const { description, detail, name, screenshot_data, screenshot_thumbnail_data, tags, title, url } = body;

    if (!url) {
      console.error('Missing URL in callback data');
      return NextResponse.json({ error: 'Missing URL in callback data' }, { status: 400 });
    }

    const supabase = createClient();

    // 插入或更新 web_navigation 表
    const { data, error } = await supabase
      .from('web_navigation')
      .upsert({
        name,
        title,
        url,
        content: description,
        detail,
        image_url: screenshot_data,
        thumbnail_url: screenshot_thumbnail_data,
        tag_name: tags && tags.length ? tags[0] : 'other',
        category_name: tags && tags.length ? tags[0] : 'other',
        collection_time: new Date().toISOString(),
      }, { onConflict: 'url' })
      .select();

    if (error) {
      console.error('Error upserting web_navigation:', error);
      throw new Error(error.message);
    }

    console.log('Upsert result:', data);

    // 更新 submit 表状态为已完成
    const { error: updateError } = await supabase
      .from('submit')
      .update({ status: 1 }) // 1 表示已完成
      .eq('url', url);

    if (updateError) {
      console.error('Error updating submit status:', updateError);
      throw new Error('Failed to update submit status');
    }

    console.log('Processing completed for URL:', url);
    return NextResponse.json({ message: 'Success', data });

  } catch (error) {
    console.error('Error in cron callback:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
