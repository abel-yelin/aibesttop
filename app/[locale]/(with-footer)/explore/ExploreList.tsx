import { createClient } from '@/db/supabase/client';
import { languages } from '@/i18n';

import SearchForm from '@/components/home/SearchForm';
import BasePagination from '@/components/page/BasePagination';
import WebNavCardList from '@/components/webNav/WebNavCardList';

import { TagList } from '../(home)/Tag';

const WEB_PAGE_SIZE = 12;

export default async function ExploreList({ pageNum, locale }: { pageNum?: string; locale: string }) {
  const supabase = createClient();
  const currentPage = pageNum ? Number(pageNum) : 1;

  // 开始和结束索引
  const start = (currentPage - 1) * WEB_PAGE_SIZE;
  const end = start + WEB_PAGE_SIZE - 1;

  // 获取完整的语言代码
  const fullLocale = languages.find(lang => lang.lang === locale)?.code || 'en-US';

  const [{ data: categoryList }, initialNavigation] = await Promise.all([
    supabase.from('navigation_category').select(),
    supabase
      .from('web_navigation')
      .select('*', { count: 'exact' })
      .eq('language', fullLocale)
      .order('collection_time', { ascending: false })
      .range(start, end),
  ]);

  let navigationList = initialNavigation.data;
  let count = initialNavigation.count;

  // 如果当前语言没有数据，获取英语数据
  if (!navigationList || navigationList.length === 0) {
    const { data: englishList, count: englishCount } = await supabase
      .from('web_navigation')
      .select('*', { count: 'exact' })
      .eq('language', 'en-US')
      .order('collection_time', { ascending: false })
      .range(start, end);
    
    navigationList = englishList;
    count = englishCount;
  }

  const safeCategories = categoryList || [];
  const safeNavigations = navigationList || [];

  return (
    <>
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
      <WebNavCardList dataList={safeNavigations} />
      <BasePagination
        currentPage={currentPage}
        pageSize={WEB_PAGE_SIZE}
        total={count!}
        route='/explore'
        subRoute='/page'
        className='my-5 lg:my-10'
      />
    </>
  );
}
