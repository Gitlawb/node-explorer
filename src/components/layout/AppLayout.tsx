import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Footer from './Footer';
import { ShortcutsProvider } from '../keyboard/ShortcutsProvider';
import { ScrollToTop } from './ScrollToTop';

export default function AppLayout() {
  return (
    <ShortcutsProvider>
      <ScrollToTop />
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <TopBar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </ShortcutsProvider>
  );
}
