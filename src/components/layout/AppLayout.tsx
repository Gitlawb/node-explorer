import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Footer from './Footer';
import { ExploreTabs } from './ExploreTabs';
import { ShortcutsProvider } from '../keyboard/ShortcutsProvider';

export default function AppLayout() {
  return (
    <ShortcutsProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <TopBar />
        <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 lg:px-12">
          <ExploreTabs />
        </div>
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </ShortcutsProvider>
  );
}
