import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Home from "./pages/Home";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import Inventory from "./components/Inventory/Inventory";
import Warehouse from "./components/Warehouse/Warehouse";
import Branch from "./components/Branch/Branch";
import EditProducts from "./components/Inventory/Edit/EditProducts/EditProducts";
import EditProductDetail from "./components/Inventory/Edit/EditProducts/EditProductDetail";
import ProductReport from "./components/Inventory/Reports/Product/ProductReport";
import ProductMovementReport from "./components/Inventory/Reports/Product/ProductMovementReport";
import ProductCategoryReport from "./components/Inventory/Reports/Product/ProductCategoryReport";
import ProductSubCategoryReport from "./components/Inventory/Reports/Product/ProductSubCategoryReport";
import SuppliersReport from "./components/Inventory/Reports/Product/SuppliersReport";
import GoodsSuppliedReport from "./components/Inventory/Reports/Product/GoodsSuppliedReport";
import OpeningStockReport from "./components/Inventory/Reports/Product/OpeningStockReport";
import StockReport from "./components/Inventory/Reports/Product/StockReport";
import PaymentTerms from "./components/Inventory/Reports/Product/PaymentTerms";
import AllProducts from "./components/Inventory/Setup/Products/AllProducts";
import CategoryList from "./components/Inventory/Edit/Categories/CategoryList";
import EditCategoryList from "./components/Inventory/Edit/Categories/EditCategoryList";
import EditCategoryDetail from "./components/Inventory/Edit/Categories/EditCategoryDetail";
import SubcategoryList from "./components/Inventory/Edit/Subcategories/SubcategoryList";
import EditSubcategoryList from "./components/Inventory/Edit/Subcategories/EditSubcategoryList";
import EditSubcategoryDetail from "./components/Inventory/Edit/Subcategories/EditSubcategoryDetail";
import SupplierList from "./components/Inventory/Supplier/List/SupplierList";
import SupplierDetail from "./components/Inventory/Supplier/Detail/SupplierDetail";
import StockList from "./components/Inventory/Stock/List/StockList";
import StockDetail from "./components/Inventory/Stock/Detail/StockDetail";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OrderTab from "./components/Orders/OrderSegment/OrderTab";
import CashSalesPaymentCallback from "./components/Orders/Sales/WalkIn/CashSales/CashSalesPaymentCallback";
import CreditFirstInstallmentCallback from "./components/Orders/Sales/WalkIn/CreditSales/CreditFirstInstallmentCallback";
import InstallmentPaymentCallback from "./components/Orders/Order/Action/MarkAsPaid/InstallmentPaymentCallback";
import CashierTab from "./components/CashierStand/CashierSegment/CashierTab";
import PaymentCallback from "./components/CashierStand/LoanPayment/PaymentCallback";
import CashierReportTab from "./components/CashierStand/Report/CashierReportTab";
import ClientTab from "./components/Client/ClientSeg/ClientTab";
import DeliveryTab from "./components/Delivery/DeliverySeg/DeliveryTab";
import RecoveryTab from "./components/Recovery/RecoverySeg/RecoveryTab";
import Reminder from "./components/Recovery/Reminder/Reminder";
import Care_page from "./pages/Care_page";
import Queues_page from "./pages/Queues_page";
import CareChat_page from "./pages/CareChat_page";
import Accounting_page from "./pages/Accounting_page";
import AccSetup from "./components/Accounting/AccLIst/Setup/AccSetup";
import Transaction from "./components/Accounting/AccLIst/transaction/Transaction";
import JournalIndex from "./components/Accounting/AccLIst/transaction/Journal/JournalIndex";
import JournalForm from "./components/Accounting/AccLIst/transaction/Journal/JournalForm";
import FundTransfers from "./components/Accounting/AccLIst/transaction/Transfers/FundTransfers";
import TransactionView from "./components/Accounting/AccLIst/transaction/Transfers/TransactionView";
import TransactionByAccount from "./components/Accounting/AccLIst/transaction/Transfers/TransactionByAccount";
import Payment from "./components/Payment/Payment";
import CustomerBalances from "./components/Payment/Balances/CustomerBalances";
import Disputes from "./components/Payment/Disputes/Disputes";
import Notifications from "./components/Payment/Notifications/Notifications";
import NotificationDetail from "./components/Payment/Notifications/NotificationDetail";
import LoanPercentage from "./components/Accounting/AccLIst/Setup/Percentage/LoanPercentage";
import DiscountSetup from "./components/Accounting/AccLIst/Setup/Percentage/DiscountSetup";
import DeliverySetup from "./components/Accounting/AccLIst/Setup/Percentage/DeliverySetup";
import AccountType from "./components/Accounting/AccLIst/Setup/gl_Account/AccountType";
import AccountDetails from "./components/Accounting/AccLIst/Setup/gl_Account/AccountDetails";
import ChartAccount from "./components/Accounting/AccLIst/Setup/gl_Account/chart_account/ChartAccount";
import BackendChartAccountSection from "./components/Accounting/AccLIst/Setup/gl_Account/chart_account/BackendChartAccountSection";
import Control_Account from "./components/Accounting/AccLIst/Setup/gl_Account/control_account/Control_Account";
import StaffPayroll from "./components/Accounting/StaffPayroll/StaffPayroll";
import AccountingReportsHub from "./components/Accounting/Reports/AccountingReportsHub";
import ChartOfAccountReport from "./components/Accounting/Reports/ChartOfAccountReport";
import JournalReport from "./components/Accounting/Reports/JournalReport";
import CashFlowReport from "./components/Accounting/Reports/CashFlowReport";
import BalanceSheetReport from "./components/Accounting/Reports/BalanceSheetReport";
import TrialBalanceReport from "./components/Accounting/Reports/TrialBalanceReport";
import CamelReport from "./components/Accounting/Reports/CamelReport";
import ProfitLossReport from "./components/Accounting/Reports/ProfitLossReport";
import AccountDetailReport from "./components/Accounting/Reports/AccountDetailReport";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/Auth/LoginPage";
import EmailInbox from "./components/customer_care/email/EmailInbox";
import IgnoreCallsPage from "./components/customer_care/modal/ignoredCall/IgnoreCall";
import AdminDashboardNew from "./components/Admin/AdminDashboard";
import Approvals from "./components/Admin/Approvals/Approvals";
import AddToStockApproval from "./components/Admin/Approvals/AddToStockApproval/AddToStockApproval";
import CashSalesApproval from "./components/Admin/Approvals/CashSalesApproval/CashSalesApproval";
import CreditSalesApproval from "./components/Admin/Approvals/CreditSalesApproval/CreditSalesApproval";
import RefundApproval from "./components/Admin/Approvals/RefundApproval/RefundApproval";
import ReturnApproval from "./components/Admin/Approvals/ReturnApproval/ReturnApproval";
import CustomerRegistrationApproval from "./components/Admin/Approvals/CustomerRegistrationApproval/CustomerRegistrationApproval";
import GoodsSuppliedApproval from "./components/Admin/Approvals/GoodsSuppliedApproval/GoodsSuppliedApproval";
import JournalApproval from "./components/Admin/Approvals/JournalApproval/JournalApproval";
import StockDeleteApproval from "./components/Admin/Approvals/StockDeleteApproval/StockDeleteApproval";
import SupplierRegApproval from "./components/Admin/Approvals/SupplierRegApproval/SupplierRegApproval";
import SuspendedCustomersApproval from "./components/Admin/Approvals/SuspendedCustomersApproval/SuspendedCustomersApproval";
import UnblockCustomersApproval from "./components/Admin/Approvals/UnblockCustomersApproval/UnblockCustomersApproval";
import WarehouseApproval from "./components/Admin/Approvals/WarehouseApproval/WarehouseApproval";
import OnlineSalesApproval from "./components/Admin/Approvals/OnlineSalesApproval/OnlineSalesApproval";
import CancellationApproval from "./components/Admin/Approvals/CancellationApproval/CancellationApproval";
import CustomerEditApproval from "./components/Admin/Approvals/CustomerEditApproval/CustomerEditApproval";
import ProductToWarehouseApproval from "./components/Admin/Approvals/ProductToWarehouseApproval/ProductToWarehouseApproval";
import SecuritySetup from "./components/Admin/SecuritySetup/SecuritySetup";
import ViewUser from "./components/Admin/SecuritySetup/ViewUser/ViewUser";
import UsersLogout from "./components/Admin/SecuritySetup/UsersLogout/UsersLogout";
import UsersLogTrial from "./components/Admin/SecuritySetup/UsersLogTrial/UsersLogTrial";
import MergeUserRole from "./components/Admin/SecuritySetup/MergeUserRole/MergeUserRole";
import DatabaseBackup from "./components/Admin/SecuritySetup/DatabaseBackup/DatabaseBackup";
import CreateModifyUser from "./components/Admin/SecuritySetup/CreateModifyUser/CreateModifyUser";
import ChangeUserPassword from "./components/Admin/SecuritySetup/ChangeUserPassword/ChangeUserPassword";
import ActivateDeactivateUser from "./components/Admin/SecuritySetup/ActivateDeactivateUser/ActivateDeactivateUser";
import BranchPermissionSetup from "./components/Admin/SecuritySetup/BranchPermissionSetup/BranchPermissionSetup";
import FeaturePermissionSetup from "./components/Admin/SecuritySetup/FeaturePermissionSetup/FeaturePermissionSetup";
import WarehouseManagement from "./components/Admin/SecuritySetup/WarehouseManagement/WarehouseManagement";
import MailMessenger from "./components/Admin/MailMessenger/MailMessenger";
import ChatWithOptions from "./components/Admin/MailMessenger/ChatWithOptions/ChatWithOptions";
import ComposeMail from "./components/Admin/MailMessenger/ComposeMail/ComposeMail";
import MailDisplayOption from "./components/Admin/MailMessenger/MailDisplayOption/MailDisplayOption";
import Messenger from "./components/Admin/MailMessenger/Messenger/Messenger";
import SentMail from "./components/Admin/MailMessenger/SentMail/SentMail";
import StandardMailSettings from "./components/Admin/MailMessenger/StandardMailSettings/StandardMailSettings";
import StandardMail from "./components/Admin/MailMessenger/StandardMail/StandardMail";
import ViewInboxMessage from "./components/Admin/MailMessenger/ViewInboxMessage/ViewInboxMessage";
import LanguageCurrency from "./components/Admin/LanguageCurrency/LanguageCurrency";
import CurrencyOptions from "./components/Admin/LanguageCurrency/CurrencyOptions/CurrencyOptions";
import LanguageOptions from "./components/Admin/LanguageCurrency/LanguageOptions/LanguageOptions";
import MainBalance from "./components/Payment/Balances/MainBalance";

function App() {
  const [isIgnoreCallsModalOpen, setIgnoreCallsModalOpen] = useState(false);

  const openIgnoreCallsModal = () => setIgnoreCallsModalOpen(true);
  const closeIgnoreCallsModal = () => setIgnoreCallsModalOpen(false);

  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/login" element={<LoginPage />} />
        {/* Admin Routes - Protected */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboardNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals"
          element={
            <ProtectedRoute requireAdmin>
              <Approvals />
            </ProtectedRoute>
          }
        />
        {/* Approval Sub-Routes */}
        <Route
          path="/admin/approvals/add-to-stock"
          element={
            <ProtectedRoute requireAdmin>
              <AddToStockApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/cash-sales"
          element={
            <ProtectedRoute requireAdmin>
              <CashSalesApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/credit-sales"
          element={
            <ProtectedRoute requireAdmin>
              <CreditSalesApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/online-sales"
          element={
            <ProtectedRoute requireAdmin>
              <OnlineSalesApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/refund"
          element={
            <ProtectedRoute requireAdmin>
              <RefundApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/cancellation"
          element={
            <ProtectedRoute requireAdmin>
              <CancellationApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/return"
          element={
            <ProtectedRoute requireAdmin>
              <ReturnApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/customer-registration"
          element={
            <ProtectedRoute requireAdmin>
              <CustomerRegistrationApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/goods-supplied"
          element={
            <ProtectedRoute requireAdmin>
              <GoodsSuppliedApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/journal"
          element={
            <ProtectedRoute requireAdmin>
              <JournalApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/stock-delete"
          element={
            <ProtectedRoute requireAdmin>
              <StockDeleteApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/supplier-reg"
          element={
            <ProtectedRoute requireAdmin>
              <SupplierRegApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/suspended-customers"
          element={
            <ProtectedRoute requireAdmin>
              <SuspendedCustomersApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/unblock-customers"
          element={
            <ProtectedRoute requireAdmin>
              <UnblockCustomersApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/customer-edit"
          element={
            <ProtectedRoute requireAdmin>
              <CustomerEditApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/product-to-warehouse"
          element={
            <ProtectedRoute requireAdmin>
              <ProductToWarehouseApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/warehouse/product-to-stock"
          element={
            <ProtectedRoute requireAdmin>
              <WarehouseApproval type="productToStock" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/warehouse/product-swap"
          element={
            <ProtectedRoute requireAdmin>
              <WarehouseApproval type="productSwap" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/warehouse/product-transfer"
          element={
            <ProtectedRoute requireAdmin>
              <WarehouseApproval type="productTransfer" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/warehouse/quarantine-product"
          element={
            <ProtectedRoute requireAdmin>
              <WarehouseApproval type="quarantineProduct" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/warehouse/attach-manager"
          element={
            <ProtectedRoute requireAdmin>
              <WarehouseApproval type="attachManager" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/warehouse/status"
          element={
            <ProtectedRoute requireAdmin>
              <WarehouseApproval type="warehouseStatus" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals/warehouse/stock-balance"
          element={
            <ProtectedRoute requireAdmin>
              <WarehouseApproval type="stockBalance" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/security-setup"
          element={
            <ProtectedRoute requireAdmin>
              <SecuritySetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/security-setup/view-user"
          element={
            <ProtectedRoute requireAdmin>
              <ViewUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/security-setup/users-logout"
          element={
            <ProtectedRoute requireAdmin>
              <UsersLogout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/security-setup/users-log-trial"
          element={
            <ProtectedRoute requireAdmin>
              <UsersLogTrial />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/security-setup/merge-user-role"
          element={
            <ProtectedRoute requireAdmin>
              <MergeUserRole />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/security-setup/database-backup"
          element={
            <ProtectedRoute requireAdmin>
              <DatabaseBackup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/security-setup/create-modify-user"
          element={
            <ProtectedRoute requireAdmin>
              <CreateModifyUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/security-setup/change-user-password"
          element={
            <ProtectedRoute>
              <ChangeUserPassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangeUserPassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/security-setup/activate-deactivate-user"
          element={
            <ProtectedRoute requireAdmin>
              <ActivateDeactivateUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/security-setup/branch-permissions"
          element={
            <ProtectedRoute requireAdmin>
              <BranchPermissionSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/security-setup/feature-permissions"
          element={
            <ProtectedRoute requireAdmin>
              <FeaturePermissionSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/security-setup/warehouse-management"
          element={
            <ProtectedRoute requireAdmin>
              <WarehouseManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mail-messenger"
          element={
            <ProtectedRoute requireAdmin>
              <MailMessenger />
            </ProtectedRoute>
          }
        />
        {/* Mail & Messenger Sub-Routes */}
        <Route
          path="/admin/mail-messenger/chat-with-options"
          element={
            <ProtectedRoute requireAdmin>
              <ChatWithOptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mail-messenger/compose-mail"
          element={
            <ProtectedRoute requireAdmin>
              <ComposeMail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mail-messenger/mail-display-option"
          element={
            <ProtectedRoute requireAdmin>
              <MailDisplayOption />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mail-messenger/messenger"
          element={
            <ProtectedRoute requireAdmin>
              <Messenger />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mail-messenger/sent-mail"
          element={
            <ProtectedRoute requireAdmin>
              <SentMail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mail-messenger/standard-mail-settings"
          element={
            <ProtectedRoute requireAdmin>
              <StandardMailSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mail-messenger/standard-mail"
          element={
            <ProtectedRoute requireAdmin>
              <StandardMail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mail-messenger/view-inbox-message"
          element={
            <ProtectedRoute requireAdmin>
              <ViewInboxMessage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/language-currency"
          element={
            <ProtectedRoute requireAdmin>
              <LanguageCurrency />
            </ProtectedRoute>
          }
        />
        {/* Language & Currency Sub-Routes */}
        <Route
          path="/admin/language-currency/currency-options"
          element={
            <ProtectedRoute requireAdmin>
              <CurrencyOptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/language-currency/language-options"
          element={
            <ProtectedRoute requireAdmin>
              <LanguageOptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminDashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute requiredModule="inventory">
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/warehouse"
          element={
            <ProtectedRoute requiredModule="warehouse">
              <Warehouse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/branch"
          element={
            <ProtectedRoute requiredModule="branch">
              <Branch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editProducts"
          element={
            <ProtectedRoute requiredModule="inventory">
              <EditProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editProducts/:productId"
          element={
            <ProtectedRoute requiredModule="inventory">
              <EditProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/allProducts"
          element={
            <ProtectedRoute requiredModule="inventory">
              <AllProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute requiredModule="inventory">
              <CategoryList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editCategories"
          element={
            <ProtectedRoute requiredModule="inventory">
              <EditCategoryList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editCategories/:categoryId"
          element={
            <ProtectedRoute requiredModule="inventory">
              <EditCategoryDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subcategories"
          element={
            <ProtectedRoute requiredModule="inventory">
              <SubcategoryList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editSubcategories"
          element={
            <ProtectedRoute requiredModule="inventory">
              <EditSubcategoryList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editSubcategories/:subcategoryId"
          element={
            <ProtectedRoute requiredModule="inventory">
              <EditSubcategoryDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/suppliers"
          element={
            <ProtectedRoute requiredModule="inventory">
              <SupplierList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/suppliers/:supplierId"
          element={
            <ProtectedRoute requiredModule="inventory">
              <SupplierDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/stocks"
          element={
            <ProtectedRoute requiredModule="inventory">
              <StockList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/stocks/:stockId"
          element={
            <ProtectedRoute requiredModule="inventory">
              <StockDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/reports/product"
          element={
            <ProtectedRoute requiredModule="inventory">
              <ProductReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/reports/product/movement"
          element={
            <ProtectedRoute requiredModule="inventory">
              <ProductMovementReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/reports/product/category"
          element={
            <ProtectedRoute requiredModule="inventory">
              <ProductCategoryReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/reports/product/sub-category"
          element={
            <ProtectedRoute requiredModule="inventory">
              <ProductSubCategoryReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/reports/supplier-info"
          element={
            <ProtectedRoute requiredModule="inventory">
              <SuppliersReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/reports/goods-supplied"
          element={
            <ProtectedRoute requiredModule="inventory">
              <GoodsSuppliedReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/reports/opening-stock"
          element={
            <ProtectedRoute requiredModule="inventory">
              <OpeningStockReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/reports/stock"
          element={
            <ProtectedRoute requiredModule="inventory">
              <StockReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/reports/payment-terms"
          element={
            <ProtectedRoute requiredModule="inventory">
              <PaymentTerms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orderTab"
          element={
            <ProtectedRoute requiredModule="ordering_sales">
              <OrderTab />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/cash-sales/payment/callback"
          element={
            <ProtectedRoute requiredModule="ordering_sales">
              <CashSalesPaymentCallback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/credit-sales/first-installment/callback"
          element={
            <ProtectedRoute requiredModule="ordering_sales">
              <CreditFirstInstallmentCallback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/installment-payment/callback"
          element={
            <ProtectedRoute requiredModule="ordering_sales">
              <InstallmentPaymentCallback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier"
          element={
            <ProtectedRoute requiredModule="cashier_stand">
              <CashierTab />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier/payment/callback"
          element={
            <ProtectedRoute requiredModule="cashier_stand">
              <PaymentCallback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier-report"
          element={
            <ProtectedRoute requiredModule="cashier_stand">
              <CashierReportTab />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client"
          element={
            <ProtectedRoute requiredModule="client">
              <ClientTab />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery"
          element={
            <ProtectedRoute requiredModule="delivery">
              <DeliveryTab />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recovery"
          element={
            <ProtectedRoute requiredModule="recovery">
              <RecoveryTab />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recovery/reminder"
          element={
            <ProtectedRoute requiredModule="recovery">
              <Reminder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/care"
          element={
            <ProtectedRoute requiredModule="care">
              <Care_page />
            </ProtectedRoute>
          }
        />
        <Route
          path="/queues"
          element={
            <ProtectedRoute requiredModule="care">
              <Queues_page />
            </ProtectedRoute>
          }
        />
        <Route
          path="/email-support"
          element={
            <ProtectedRoute requiredModule="care">
              <EmailInbox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ignore-calls"
          element={
            <ProtectedRoute requiredModule="care">
              <IgnoreCallsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute requiredModule="care">
              <CareChat_page />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messenger"
          element={
            <ProtectedRoute requiredModule="mail_messenger">
              <Messenger />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting"
          element={
            <ProtectedRoute requiredModule="accounting">
              <Accounting_page />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting/Setup"
          element={
            <ProtectedRoute requiredModule="accounting">
              <AccSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting/Transaction"
          element={
            <ProtectedRoute requiredModule="accounting">
              <Transaction />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting/JournalEntry"
          element={
            <ProtectedRoute requiredModule="accounting">
              <JournalIndex />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting/JournalEntry/new"
          element={
            <ProtectedRoute requiredModule="accounting">
              <JournalForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting/JournalEntry/:id/edit"
          element={
            <ProtectedRoute requiredModule="accounting">
              <JournalForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting/JournalEdit"
          element={<Navigate to="/Accounting/JournalEntry" replace />}
        />
        <Route
          path="/Accounting/FundTransfers"
          element={
            <ProtectedRoute requiredModule="accounting">
              <FundTransfers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting/TransactionView"
          element={
            <ProtectedRoute requiredModule="accounting">
              <TransactionView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting/TransactionByAccount"
          element={
            <ProtectedRoute requiredModule="accounting">
              <TransactionByAccount />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting/Reports"
          element={
            <ProtectedRoute requiredModule="accounting">
              <AccountingReportsHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting/StaffPayroll"
          element={
            <ProtectedRoute requiredModule="accounting">
              <StaffPayroll />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting/Reports/chart-of-accounts"
          element={
            <ProtectedRoute requiredModule="accounting">
              <ChartOfAccountReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting/Reports/journal"
          element={
            <ProtectedRoute requiredModule="accounting">
              <JournalReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting/Reports/cash-flow"
          element={
            <ProtectedRoute requiredModule="accounting">
              <CashFlowReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting/Reports/balance-sheet"
          element={
            <ProtectedRoute requiredModule="accounting">
              <BalanceSheetReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting/Reports/trial-balance"
          element={
            <ProtectedRoute requiredModule="accounting">
              <TrialBalanceReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting/Reports/camel"
          element={
            <ProtectedRoute requiredModule="accounting">
              <CamelReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting/Reports/profit-loss"
          element={
            <ProtectedRoute requiredModule="accounting">
              <ProfitLossReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounting/Reports/account-detail"
          element={
            <ProtectedRoute requiredModule="accounting">
              <AccountDetailReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute requiredModule="payment">
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/balances"
          element={
            <ProtectedRoute requiredModule="payment">
              <CustomerBalances />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/main-balance"
          element={
            <ProtectedRoute requiredModule="payment">
              <MainBalance /> 
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/disputes"
          element={
            <ProtectedRoute requiredModule="payment">
              <Disputes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/notifications"
          element={
            <ProtectedRoute requiredModule="payment">
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/notifications/:id"
          element={
            <ProtectedRoute requiredModule="payment">
              <NotificationDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/LoanPercentage-setup"
          element={
            <ProtectedRoute requiredModule="accounting">
              <LoanPercentage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/discount-setup"
          element={
            <ProtectedRoute requiredModule="accounting">
              <DiscountSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery-setup"
          element={
            <ProtectedRoute requiredModule="accounting">
              <DeliverySetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/AccountType"
          element={
            <ProtectedRoute requiredModule="accounting">
              <AccountType />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-details"
          element={
            <ProtectedRoute requiredModule="accounting">
              <AccountDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chartAccount"
          element={
            <ProtectedRoute requiredModule="accounting">
              <ChartAccount />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chartAccount/:controlId"
          element={
            <ProtectedRoute requiredModule="accounting">
              <BackendChartAccountSection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Control_Account"
          element={
            <ProtectedRoute requiredModule="accounting">
              <Control_Account />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
