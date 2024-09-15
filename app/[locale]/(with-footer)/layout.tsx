import Footer from '@/components/home/Footer';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex flex-col min-h-screen'>
      <main className='flex-grow w-full flex items-center justify-center'>
        {children}
      </main>
      <Footer />
    </div>
  );
}
