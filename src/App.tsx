import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "@/components/AuthProvider";
import { useAuthStore } from "@/lib/auth-store";
import AdminLayout from "@/components/AdminLayout";
import DriverLayout from "@/components/DriverLayout";
import PlatformLayout from "@/components/PlatformLayout";
import DashboardPage from "@/pages/DashboardPage";
import TripsPage from "@/pages/TripsPage";
import TripDetailPage from "@/pages/TripDetailPage";
import DriversPage from "@/pages/DriversPage";
import DriverDetailPage from "@/pages/DriverDetailPage";
import VehiclesPage from "@/pages/VehiclesPage";
import VehicleDetailPage from "@/pages/VehicleDetailPage";
import TrailersPage from "@/pages/TrailersPage";
import TrailerDetailPage from "@/pages/TrailerDetailPage";
import ClientsPage from "@/pages/ClientsPage";
import ClientDetailPage from "@/pages/ClientDetailPage";
import FinancialPage from "@/pages/FinancialPage";
import ChatPage from "@/pages/ChatPage";
import UsersPage from "@/pages/UsersPage";
import DocumentsPage from "@/pages/DocumentsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import MapPage from "@/pages/MapPage";
import SettingsPage from "@/pages/SettingsPage";
import ActivityLogPage from "@/pages/ActivityLogPage";
import DriverTripsPage from "@/pages/driver/DriverTripsPage";
import DriverDocumentsPage from "@/pages/driver/DriverDocumentsPage";
import DriverLocationPage from "@/pages/driver/DriverLocationPage";
import DriverChatPage from "@/pages/driver/DriverChatPage";
import DriverProfilePage from "@/pages/driver/DriverProfilePage";
import PlatformDashboardPage from "@/pages/platform/PlatformDashboardPage";
import CompaniesPage from "@/pages/platform/CompaniesPage";
import CompanyDetailPage from "@/pages/platform/CompanyDetailPage";
import PlatformUsersPage from "@/pages/platform/PlatformUsersPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isDriver, isAdmin, isPlatformOwner } = useAuthStore();

  // Platform owner sees platform management
  if (isPlatformOwner()) {
    return (
      <Routes>
        <Route element={<PlatformLayout />}>
          <Route path="/" element={<PlatformDashboardPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:id" element={<CompanyDetailPage />} />
          <Route path="/platform-users" element={<PlatformUsersPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Driver-only users
  if (isDriver() && !isAdmin()) {
    return (
      <Routes>
        <Route element={<DriverLayout />}>
          <Route path="/" element={<DriverTripsPage />} />
          <Route path="/driver" element={<DriverTripsPage />} />
          <Route path="/driver/documents" element={<DriverDocumentsPage />} />
          <Route path="/driver/location" element={<DriverLocationPage />} />
          <Route path="/driver/chat" element={<DriverChatPage />} />
          <Route path="/driver/profile" element={<DriverProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Company admin/dispatcher
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/:id" element={<TripDetailPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/drivers/:id" element={<DriverDetailPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="/trailers" element={<TrailersPage />} />
        <Route path="/trailers/:id" element={<TrailerDetailPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/financial" element={<FinancialPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/activity-log" element={<ActivityLogPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
