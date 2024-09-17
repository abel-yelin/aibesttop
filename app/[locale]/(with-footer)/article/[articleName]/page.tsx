import { createClient } from '@/db/supabase/client';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
// ... 其他导入 ...

export async function generateMetadata({
  params: { locale, articleName },
}: {
  params: { locale: string; articleName: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const t = await getTranslations({locale, namespace: 'Metadata.ai'});

  const { data } = await supabase
    .from('article_contents')
    .select()
    .eq('slug', articleName)
    .eq('language', locale)
    .single();

  if (!data) {
    notFound();
  }

  return {
    title: `${data.title} | ${t('titleSubfix')}`,
    description: data.description || '',
  };
}

export default async function Page({ params: { articleName, locale } }: { params: { articleName: string, locale: string } }) {
  const supabase = createClient();
  const t = await getTranslations({locale, namespace: 'Startup.detail'});
  const { data } = await supabase
    .from('article_contents')
    .select()
    .eq('slug', articleName)
    .eq('language', locale)
    .single();

  if (!data) {
    notFound();
  }

  return (
    <div className='w-full'>
      <div className='flex flex-col px-6 py-5 lg:h-[323px] lg:flex-row lg:justify-between lg:px-0 lg:py-10'>
        <div className='flex flex-col items-center lg:items-start'>
          <div className='space-y-1 text-balance lg:space-y-3'>
            <h1 className='text-2xl lg:text-5xl'>{data.title}</h1>
            <h2 className='text-xs lg:text-sm'>{data.subtitle}</h2>
          </div>
          {data.url && (
            <a
              href={data.url}
              target='_blank'
              rel='noreferrer'
              className='flex-center mt-5 min-h-5 w-full gap-1 rounded-[8px] bg-white p-[10px] text-sm capitalize text-black hover:opacity-80 lg:mt-auto lg:w-[288px]'
            >
              {t('visitWebsite')} <CircleArrowRight className='size-[14px]' />
            </a>
          )}
        </div>
        {data.preview_images && data.preview_images.length > 0 && (
          <a
            href={data.url}
            target='_blank'
            rel='noreferrer'
            className='flex-center group relative h-[171px] w-full flex-shrink-0 lg:h-[234px] lg:w-[466px]'
          >
            <BaseImage
              title={data.title}
              alt={data.title}
              fill
              src={data.preview_images[0]}
              className='absolute mt-3 aspect-[466/234] w-full rounded-[16px] border border-[#424242] bg-[#424242] bg-cover lg:mt-0'
            />
            <div className='absolute inset-0 z-10 hidden items-center justify-center gap-1 rounded-[16px] bg-black bg-opacity-50 text-2xl text-white transition-all duration-200 group-hover:flex'>
              {t('visitWebsite')} <CircleArrowRight className='size-5' />
            </div>
          </a>
        )}
      </div>
      <Separator className='bg-[#010101]' />
      <div className='mb-5 px-3 lg:px-0'>
        <h2 className='my-5 text-2xl text-white/40 lg:my-10'>{t('introduction')}</h2>
        <MarkdownProse markdown={data.description || ''} />
      </div>
    </div>
  );
}