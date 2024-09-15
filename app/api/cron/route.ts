/* eslint-disable import/prefer-default-export */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/db/supabase/client';
import crawler from './crawler';

async function upsertWithRetry(supabase, table, data, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .upsert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // 等待时间递增
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    // 获取请求头中的 Authorization
    const authHeader = req.headers.get('Authorization');

    // 检查 Authorization 是否存在并验证 token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header is missing or malformed' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const cronKey = process.env.CRON_AUTH_KEY;
    // 假设这里有一个函数 `verifyToken` 用于验证 token，如果验证失败则抛出错误
    const isValid = cronKey === token;
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const supabase = createClient();

    console.log('supabase connected!');

    const [{ data: categoryList, error: categoryListError }, { data: submitList, error: submitListError }] =
      await Promise.all([
        supabase.from('navigation_category').select(),
        supabase
          .from('submit')
          .select()
          .eq('status', 0)
          .order('is_feature', { ascending: false })
          .order('created_at', { ascending: true }),
      ]);

    console.log('supabase get categoryList succeed!');
    if (categoryListError || !categoryList) {
      return NextResponse.json({ error: 'Category is null' }, { status: 201 });
    }

    if (!submitList || submitList.length === 0) {
      console.log('No pending submissions');
      return NextResponse.json({ message: 'No pending submissions' });
    }

    const firstSubmitData = submitList[0];
    console.log('Processing submission:', firstSubmitData);

    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/cron_callback`;
    console.log('Callback URL:', callbackUrl);

    const crawlerResponse = await crawler({
      url: firstSubmitData.url!,
      tags: categoryList!.map((item) => item.name),
      callback_url: callbackUrl,
      key: cronKey,
    });

    console.log('Crawler response:', JSON.stringify(crawlerResponse, null, 2));

    if (crawlerResponse.code !== 200) {
      throw new Error(crawlerResponse.msg);
    }

    // 处理爬虫返回的数据
    const {
      name,
      url,
      title,
      description,
      detail,
      screenshot_data,
      screenshot_thumbnail_data,
      tags,
      languages: langData
    } = crawlerResponse.data;

    console.log('Language data:', JSON.stringify(langData, null, 2));

    if (!Array.isArray(langData) || langData.length === 0) {
      console.error('Invalid or empty language data received:', langData);
      throw new Error('Invalid language data');
    }

    // 尝试找到英语数据，如果没有，就使用第一个可用的语言数据
    const baseData = langData.find(lang => lang.language === 'en-US' || lang.code === 'en-US') || langData[0];
    const baseLanguage = baseData.language || baseData.code || 'unknown';

    console.log(`Using ${baseLanguage} as base language:`, JSON.stringify(baseData, null, 2));

    const baseWebNavData = {
      name: `${name}_${baseLanguage}`,
      title: baseData.title || title,
      url,
      content: baseData.description || description,
      detail: baseData.detail || detail,
      image_url: screenshot_data,
      thumbnail_url: screenshot_thumbnail_data,
      tag_name: tags && tags.length ? tags[0] : 'other',
      category_name: tags && tags.length ? tags[0] : 'other',
      collection_time: new Date().toISOString(),
      language: baseLanguage
    };

    // 使用重试逻辑插入或更新基础数据
    try {
      const insertedBaseData = await upsertWithRetry(supabase, 'web_navigation', baseWebNavData);
      console.log('Base data upserted:', insertedBaseData);

      // 处理其他语言
      for (const langItem of langData) {
        const langCode = langItem.language || langItem.code;
        if (!langCode || langCode === baseLanguage) continue; // 跳过基础语言和无效的语言代码

        console.log(`Processing language: ${langCode}`, JSON.stringify(langItem, null, 2));

        const webNavData = {
          // name: name,
          name: `${name}_${langCode}`,
          title: langItem.title || title,
          url,
          content: langItem.description || description,
          detail: langItem.detail || detail,
          image_url: screenshot_data,
          thumbnail_url: screenshot_thumbnail_data,
          tag_name: tags && tags.length ? tags[0] : 'other',
          category_name: tags && tags.length ? tags[0] : 'other',
          collection_time: new Date().toISOString(),
          language: langCode,
          base_id: insertedBaseData.id // 设置 base_id 为基础记录的 id
        };

        // 使用重试逻辑插入或更新其他语言数据
        try {
          await upsertWithRetry(supabase, 'web_navigation', webNavData);
          console.log(`Upserted web_navigation for ${langCode}`);
        } catch (error) {
          console.error(`Error upserting web_navigation for ${langCode}:`, error);
        }
      }

      // 更新 submit 表状态
      await upsertWithRetry(supabase, 'submit', { id: firstSubmitData.id, status: 1 });
      console.log('Submit status updated to completed');

    } catch (error) {
      console.error('Error in database operations:', error);
      throw error;
    }

    return NextResponse.json({ 
      message: 'Processing completed successfully',
      submissionId: firstSubmitData.id
    });

  } catch (error) {
    console.error('Error in cron job:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
