import { HashRouter, Routes, Route } from 'react-router-dom';
import { Providers } from './components/Providers';
import { Sidebar } from './components/nav/Sidebar';
import { NotifDispatcher } from './components/NotifDispatcher';
import { TrayManager } from './components/TrayManager';
import { UpdatePrompt } from './components/UpdatePrompt';
import { useAuthStore } from './lib/store';

// Pages
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import FeedPage from './pages/Feed';
import ExplorePage from './pages/Explore';
import PostDetailPage from './pages/PostDetail';
import ProfilePage from './pages/Profile';
import FollowersPage from './pages/Followers';
import FollowingPage from './pages/Following';
import SearchPage from './pages/Search';
import MessagesPage from './pages/Messages';
import NotificationsPage from './pages/Notifications';
import SettingsPage from './pages/Settings';

function AppShell() {
  const user = useAuthStore((s) => s.user);
  const showSidebar = !!user;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {showSidebar && <Sidebar />}

      <main className="flex-1 min-w-0 overflow-hidden">
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route path="/" element={<FeedPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/p/:postId" element={<PostDetailPage />} />
          <Route path="/:username/followers" element={<FollowersPage />} />
          <Route path="/:username/following" element={<FollowingPage />} />
          <Route path="/:username" element={<ProfilePage />} />
        </Routes>
      </main>

      {/* Background services — mounted when authenticated */}
      {showSidebar && (
        <>
          <NotifDispatcher />
          <TrayManager />
        </>
      )}

      <UpdatePrompt />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Providers>
        <AppShell />
      </Providers>
    </HashRouter>
  );
}
