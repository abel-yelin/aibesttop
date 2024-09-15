import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// 懒加载 GoogleLogin 组件
const GoogleLogin = dynamic(() => import('@/components/login/GoogleLogin'), {
  loading: () => <p>加载中...</p>,
});

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({
    locale,
    namespace: 'Metadata.login',
  });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="px-8 py-6 bg-white shadow-lg rounded-lg w-full max-w-md">
        <h3 className="text-2xl font-bold text-center text-gray-800">欢迎回来</h3>
        <p className="mt-2 text-center text-gray-600">请选择登录方式</p>
        <div className="mt-4 space-y-4">
          <Suspense fallback={<div className="text-center">加载登录选项...</div>}>
            <GoogleLogin />
          </Suspense>
          <div className="text-center">
            <Link href="/register" className="text-sm text-blue-600 hover:underline">
              还没有账号？立即注册
            </Link>
          </div>
          <div className="text-center">
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
              忘记密码？
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}