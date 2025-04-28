import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from "./layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserProfile from "./pages/UserProfile";
import BrandManager from "./pages/BrandManager";
import Branches from "./pages/Branches";
import Products from "./pages/Products";
import UserManagement from "./pages/UserManagement";
import TemplateManager from "./components/TemplateManager";
import BranchProducts from "./pages/BranchProducts";
import ThemeSettings from "./pages/ThemeSettings";
import BranchThemeSelector from "./pages/BranchThemeSelector";
import BrandThemeSelector from "./pages/BrandThemeSelector";
import LoyaltyProgramManager from "./components/LoyaltyProgramManager";
import AdminOrders from "./pages/AdminOrders";
import BranchAnalytics from "./pages/BranchAnalytics";
import Heatmap from "./pages/HeatMap";
import QrMenu from "./pages/QrMenu";
import PrivateRoute from "./components/PrivateRoute";
import { Toaster } from "react-hot-toast";
import NotFound from "./pages/NotFound";

// Loyalty components
import LoyaltyCampaignManager from "./components/LoyaltyCampaignManager";
import CustomerLoyaltyManager from "./components/CustomerLoyaltyManager";
import LoyaltyRewardsManager from "./components/LoyaltyRewardsManager";
import ManualPointTransaction from "./components/ManualPointTransaction";
import LoyaltyReportsManager from "./components/LoyaltyReportsManager";
import LoyaltySettingsManager from "./components/LoyaltySettingsManager";

// Additional components
import ConfirmOrder from "./pages/ConfirmOrder";
import ProductDetail from "./pages/ProductDetail";
import FeedbackForm from "./pages/FeedbackForm";
import ClarityAnalytics from "./components/ClarityAnalytics";
import EnhancedBranchManager from "./pages/EnhancedBranchManager";
import BranchPointsTransfer from "./components/BranchPointsTransfer";
import RewardsCatalog from "./components/RewardsCatalog";
import RewardsHistory from "./components/RewardsHistory";

// Branch Menuları için şablon yönetimi
function MenuTemplateManager() {
  const { branchId } = useParams();
  return <TemplateManager type="menu" branchId={branchId} />;
}

function PriceTemplateManager() {
  const { branchId } = useParams();
  return <TemplateManager type="price" branchId={branchId} />;
}

// Redirect component for Branch Theme
function RedirectToBranchTheme() {
  const { branchId } = useParams();
  return <Navigate to={`/admin/theme/branch/${branchId}`} replace />;
}

function App() {
  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <ClarityAnalytics />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* QR Menu Routes */}
            <Route path="/menu" element={<QrMenu />} />
            <Route path="/menu/:branchId" element={<QrMenu />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/confirm" element={<ConfirmOrder />} />
            <Route path="/feedback" element={<FeedbackForm />} />
            
            {/* Admin Panel Routes */}
            <Route path="/admin" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="profile" element={<UserProfile />} />
              
              {/* Brand Management */}
              <Route path="brands" element={
                <PrivateRoute roles={["super_admin"]}>
                  <BrandManager />
                </PrivateRoute>
              } />
              
              {/* Branch Management */}
              <Route path="branches" element={
                <PrivateRoute roles={["super_admin"]}>
                  <Branches />
                </PrivateRoute>
              } />
              
              {/* User Management */}
              <Route path="users" element={
                <PrivateRoute roles={["super_admin"]}>
                  <UserManagement />
                </PrivateRoute>
              } />
              
              {/* Template Management */}
              <Route path="templates" element={
                <PrivateRoute roles={["super_admin"]}>
                  <TemplateManager />
                </PrivateRoute>
              } />
              
              {/* Branch Manager için şablon yönetimi rotaları */}
              <Route path="branches/:branchId/templates/menu" element={
                <PrivateRoute roles={["super_admin", "branch_manager"]}>
                  <MenuTemplateManager />
                </PrivateRoute>
              } />
              <Route path="branches/:branchId/templates/price" element={
                <PrivateRoute roles={["super_admin", "branch_manager"]}>
                  <PriceTemplateManager />
                </PrivateRoute>
              } />
              
              {/* Branch Manager için veri yönetimi rotaları */}
              <Route path="branches/:branchId/export" element={
                <PrivateRoute roles={["super_admin", "branch_manager"]}>
                  <DataExport />
                </PrivateRoute>
              } />
              <Route path="branches/:branchId/import" element={
                <PrivateRoute roles={["super_admin", "branch_manager"]}>
                  <DataImport />
                </PrivateRoute>
              } />
              
              {/* Products Management */}
              <Route path="products" element={<Products />} />
              <Route path="branch-products" element={<BranchProducts />} />
              <Route path="branches/:branchId/products" element={
                <PrivateRoute roles={["super_admin", "branch_manager"]}>
                  <BranchProducts />
                </PrivateRoute>
              } />
              
              {/* Theme Management */}
              <Route path="theme/brands" element={
                <PrivateRoute roles={["super_admin"]}>
                  <BrandThemeSelector />
                </PrivateRoute>
              } />
              <Route path="theme/branches" element={
                <PrivateRoute roles={["super_admin"]}>
                  <BranchThemeSelector />
                </PrivateRoute>
              } />
              <Route path="theme/branch/:branchId" element={
                <PrivateRoute roles={["super_admin", "branch_manager"]}>
                  <ThemeSettings type="branch" />
                </PrivateRoute>
              } />
              <Route path="theme/brand/:brandId" element={
                <PrivateRoute roles={["super_admin"]}>
                  <ThemeSettings type="brand" />
                </PrivateRoute>
              } />
              
              {/* Loyalty Program */}
              <Route path="loyalty" element={
                <PrivateRoute roles={["super_admin"]}>
                  <LoyaltyProgramManager />
                </PrivateRoute>
              } />
              <Route path="loyalty/campaigns" element={
                <PrivateRoute roles={["super_admin"]}>
                  <LoyaltyCampaignManager />
                </PrivateRoute>
              } />
              <Route path="loyalty/customers" element={
                <PrivateRoute roles={["super_admin"]}>
                  <CustomerLoyaltyManager />
                </PrivateRoute>
              } />
              <Route path="loyalty/rewards" element={
                <PrivateRoute roles={["super_admin"]}>
                  <LoyaltyRewardsManager />
                </PrivateRoute>
              } />
              <Route path="loyalty/points/manual" element={
                <PrivateRoute roles={["super_admin"]}>
                  <ManualPointTransaction />
                </PrivateRoute>
              } />
              <Route path="loyalty/reports" element={
                <PrivateRoute roles={["super_admin"]}>
                  <LoyaltyReportsManager />
                </PrivateRoute>
              } />
              <Route path="loyalty/settings" element={
                <PrivateRoute roles={["super_admin"]}>
                  <LoyaltySettingsManager />
                </PrivateRoute>
              } />
              
              {/* Orders & Analytics */}
              <Route path="orders" element={<AdminOrders />} />
              <Route path="analytics" element={<BranchAnalytics />} />
              <Route path="heatmap" element={
                <PrivateRoute roles={["super_admin"]}>
                  <Heatmap />
                </PrivateRoute>
              } />
              
              {/* Redirects */}
              <Route path="branches/:branchId/theme" element={<RedirectToBranchTheme />} />
            </Route>
            
            {/* Default Routes */}
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;