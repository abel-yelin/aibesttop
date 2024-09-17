/* eslint-disable react/jsx-props-no-spreading */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/db/supabase/client';
import { getTranslations } from 'next-intl/server';
import { languages } from '@/i18n';

import { InfoPageSize, RevalidateOneHour } from '@/lib/constants';

import Content from './Content';

export const revalidate = RevalidateOneHour * 6;

export async function generateMetadata({ params }: { params: { code: string; locale: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data: categoryList } = await supabase.from('navigation_category').select().eq('name', params.code);

  if (!categoryList || !categoryList[0]) {
    notFound();
  }

  const t = await getTranslations({
    locale: params.locale,
    namespace: 'Metadata.category',
  });

  return {
    title: t('title', { category: categoryList[0].title }),
    description: t('description', { category: categoryList[0].title }),
    keywords: t('keywords', { category: categoryList[0].title }),
  };
}

export default async function Page({ params }: { params: { code: string; locale: string } }) {
  const supabase = createClient();
  const t = await getTranslations('Category');

  const fullLocale = languages.find((lang) => lang.lang === params.locale)?.code || 'en-US';

  let navigationList; let
    count;
  const [{ data: categoryList }, initialNavigation] = await Promise.all([
    supabase.from('navigation_category').select().eq('name', params.code),
    supabase
      .from('web_navigation')
      .select('*', { count: 'exact' })
      .eq('category_name', params.code)
      .eq('language', fullLocale)
      .range(0, InfoPageSize - 1),
  ]);

  navigationList = initialNavigation.data;
  count = initialNavigation.count;

  if (!navigationList || navigationList.length === 0) {
    // 如果当前语言没有数据，获取英语数据
    const { data: englishList, count: englishCount } = await supabase
      .from('web_navigation')
      .select('*', { count: 'exact' })
      .eq('category_name', params.code)
      .eq('language', 'en-US')
      .range(0, InfoPageSize - 1);

    navigationList = englishList;
    count = englishCount;
  }

  if (!categoryList || !categoryList[0]) {
    notFound();
  }

  return (
    <Content
      headerTitle={categoryList[0]!.title || params.code}
      navigationList={navigationList!}
      currentPage={1}
      total={count!}
      pageSize={InfoPageSize}
      route={`/category/${params.code}`}
      // locale={params.locale}
    />
  );
}
