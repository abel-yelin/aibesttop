import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { createClient } from '@/db/supabase/client';
import { CircleChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { languages } from '@/i18n';

import { RevalidateOneHour } from '@/lib/constants';
import Faq from '@/components/Faq';
import SearchForm from '@/components/home/SearchForm';
import WebNavCardList from '@/components/webNav/WebNavCardList';

import { TagList } from './Tag';

const ScrollToTop = dynamic(() => import('@/components/page/ScrollToTop'), { ssr: false });

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({
    locale,
    namespace: 'Metadata.home',
  });

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL as string),
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    alternates: {
      canonical: './',
    },
  };
}

export const revalidate = RevalidateOneHour;

export default async function Page({ params: { locale } }: { params: { locale: string } }) {
  const supabase = createClient();
  const t = await getTranslations('Home');
  
  const fullLocale = languages.find(lang => lang.lang === locale)?.code || 'en-US';

  let { data: navigationList } = await supabase
    .from('web_navigation')
    .select('*')
    .eq('language', fullLocale)
    .order('collection_time', { ascending: false })
    .limit(12);

  if (!navigationList || navigationList.length === 0) {
    // 如果当前语言没有数据，获取英语数据
    const { data: englishList } = await supabase
      .from('web_navigation')
      .select('*')
      .eq('language', 'en-US')
      .order('collection_time', { ascending: false })
      .limit(12);
    
    navigationList = englishList;
  }

  const { data: categoryList } = await supabase.from('navigation_category').select();

  const safeCategories = categoryList || [];
  const safeNavigations = navigationList || [];

  return (
    <div className='relative w-full'>
      <div className='relative mx-auto w-full max-w-pc flex-1 px-3 lg:px-0'>
        <div className='my-5 flex flex-col text-center lg:mx-auto lg:my-10 lg:gap-1'>
          <h1 className='text-2xl font-bold text-white lg:text-5xl'>{t('title')}</h1>
          <h2 className='text-balance text-xs font-bold text-white lg:text-sm'>{t('subTitle')}</h2>
        </div>
        <div className='flex w-full items-center justify-center'>
          <SearchForm />
        </div>
        <div className='mb-10 mt-5'>
          <TagList
            data={safeCategories.map((item) => ({
              id: String(item.id),
              name: item.name,
              href: `/category/${item.name}`,
            }))}
          />
        </div>
        <div className='flex flex-col gap-5'>
          <h2 className='text-center text-[18px] lg:text-[32px]'>{t('ai-navigate')}</h2>
          <WebNavCardList dataList={safeNavigations} />
          <Link
            href='/explore'
            className='mx-auto mb-5 flex w-fit items-center justify-center gap-5 rounded-[9px] border border-white p-[10px] text-sm leading-4 hover:opacity-70'
          >
            {t('exploreMore')}
            <CircleChevronRight className='mt-[0.5] h-[20px] w-[20px]' />
          </Link>
        </div>
        <Faq />
        <ScrollToTop />
      </div>
    </div>
  );
}
