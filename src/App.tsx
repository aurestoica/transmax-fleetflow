import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "@/components/AuthProvider";
import { useAuthStore } from "@/lib/auth-store";
import AdminLayout from "@/components/AdminLayout";
import DriverLayout from "@/components/DriverLayout";
import DashboardPage from "@/pages/DashboardPage";
import TripsPage from "@/pages/TripsPage";
import TripDetailPage from "@/pages/TripDetailPage";
import DriversPage from "@/pages/DriversPage";
import VehiclesPage from "@/pages/VehiclesPage";
import TrailersPage from "@/pages/TrailersPage";
import ClientsPage from "@/pages/ClientsPage";
import FinancialPage from "@/pages/FinancialPage";
import ChatPage from "@/pages/ChatPage";
import UsersPage from "@/pages/UsersPage";
import DocumentsPage from "@/pages/DocumentsPage";
import MapPage from "@/pages/MapPage";
import DriverTripsPage from "@/pages/driver/DriverTripsPage";
import DriverDocumentsPage from "@/pages/driver/DriverDocumentsPage";
import DriverLocationPage from "@/pages/driver/DriverLocationPage";
import DriverChatPage from "@/pages/driver/DriverChatPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isDriver, isAdmin } = useAuthStore();

  if (isDriver() && !isAdmin()) {
    return (
      <Routes>
        <Route element={<DriverLayout />}>
          <Route path="/" element={<DriverTripsPage />} />
          <Route path="/driver" element={<DriverTripsPage />} />
          <Route path="/driver/documents" element={<DriverDocumentsPage />} />
          <Route path="/driver/location" element={<DriverLocationPage />} />
          <Route path="/driver/chat" element={<DriverChatPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/:id" element={<TripDetailPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/trailers" element={<TrailersPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/financial" element={<FinancialPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/users" element={<UsersPage />} />
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
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
