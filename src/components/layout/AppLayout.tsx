import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Footer from './Footer';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <TopBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
