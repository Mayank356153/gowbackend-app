import axios from "axios"
import BackButtonHandler from "./BackButtonHandler";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminRegister from "./pages/AdminRegister";
import AdminLogin from "./pages/AdminLogin";
import AuditorLogin from "./pages/AuditorLogin";
import AdminDashboard from "./components/Dashboard/AdminDashboard";
import UserLogin from "./pages/UserLogin";
import AddUser from "./components/AddUser";
import UserList from "./components/User/UserList";
import RoleList from "./components/User/RoleList";
import CreateRolelist from "./components/User/CreateRolist";
import CreateUres from "./components/User/CreateUser";
import RiderList from "./components/User/RiderList";
import CreateRider from "./components/User/CreateRider";
import CreateRiderCommission from "./components/User/CreateRiderCommission";
import RiderCommissionList from "./components/User/RiderCommissionList";
import AddStore from "./components/store/AddStore";
import StoreView from "./components/store/StoreView";
import AddSubscription from "./components/store/AddSubscription";
import SubscriptionList from "./components/store/SubscriptionList";
import SystemTab from "./components/store/SystemTab";
import Reports from "./pages/Reports";
import ProfitLossReport from "./components/Reports/ProfitLossReport";
import SalesPaymentReport from "./components/Reports/SalesPaymentReport";
import ItemTransfer from "./components/Reports/ItemTransfer";
import StockTransferReport from "./components/Reports/StockTransfer";
import SaleItemsReport from "./components/Reports/SaleItems";
import StockReport from "./components/Reports/StockReport";
import ItemCompare from "./components/Reports/ItemCompare";
import CustomerOrders from "./pages/CustomerOrders";
import Supplierlist from "./components/contact/Supplierlist";
import Customerlist from "./components/contact/Customerlist";
import AddSupplier from "./components/contact/AddSupplier";
import Addcustomer from "./components/contact/AddCustomer/Addcustomer";
import NewCustomer from "./components/contact/NewCustomer";
import NewCustomerlist from "./components/contact/NewCustomerList";
import ImportCustomer from "./components/contact/import/ImportCustomer";
import ImportSupplier from "./components/contact/import/ImportSupplier";
import AddItem from "./components/Items/AddItems";
import AddService from "./components/Items/AddServices";
import AddUpdateServices from "./components/Items/AddUpdateServices";
import ItemList from "./components/Items/Itemlist";
import CategoriesList from "./components/Items/CategoriesList";
import CategoriesListform from "./components/Items/CategoriesListform";
import SubCategoryList from "./components/Items/SubCategoryList";
import SubCategoryForm from "./components/Items/SubCategoryForm";
import SubSubCategoryList from "./components/Items/SubSubCategoryList";
import BrandsList from "./components/Items/BrandsList";
import BrandForm from "./components/Items/BrandForm";
import VariantAdd from "./components/Items/VariantAdd";
import VariantsList from "./components/Items/VariantsList";
import PrintLabels from "./components/Items/PrintLabels";
import ImportItems from "./components/Items/ImportItems";
import ImportServices from "./components/Items/ImportServices";
import ImportEntity from "./components/Items/ImportEntity";
import AddAdvance from "./components/advance/addadvance";
import AdvanceList from "./components/advance/advancelist";
import CustomerCoupenList from "./components/coupens/CustomerCouponsList";
import CreateCustomerCoupons from "./components/coupens/CreateCustomerCoupon";
import CreateCoupon from "./components/coupens/CreateCoupon";
import CouponsMaster from "./components/coupens/CouponsMaster";
import CreateMasterCoupon from "./components/coupens/CreateMasterCoupon";
import CouponForm from "./components/coupens/CreateCustomerCoupon";
import DiscountCouponForm from "./components/coupens/CreateCoupon";
import DiscountCouponList from "./components/coupens/CouponsMaster";
import NewQuotation from "./components/Quotation/NewQuotation";
import QuotationList from "./components/Quotation/QuotationList";
import QuotationForm from "./components/Quotation/NewQuotation";
import NewPurchase from "./components/purchase/newpurcheas";
import PurchaseList from "./components/purchase/purchaselist";
import PurchaseReturnsList from "./components/purchase/PurchaseReturnsList";
import PurchaseReturn from "./components/purchase/purchasereturn";
import POS from "./components/Sales/POS";
import AddSale from "./components/Sales/AddSale";
import AddSalesRetutrn from "./components/Sales/AddSalesReturn";
import AddSalesReturn from "./components/Sales/AddSalesReturn";
import SaleList from "./components/Sales/SalesList";
import SalesPayment from "./components/Sales/SalesPayment";
import SalesPaymentList from "./components/Sales/SalesReturnsList";
import ViewSale from "./components/Sales/ViewSale";
import ReceivePayment from "./components/Sales/ReceivePayment";
import POSInvoice from "./components/Sales/POSInvoice";
import SalesReturn from "./components/Sales/SalesReturn";
import ViewPayment from "./components/Sales/ViewPayment";
import AddAccount from "./components/Accounts/AddAccounts";
import AccountList from "./components/Accounts/AccountList";
import MoneyTransferList from "./components/Accounts/MoneyTransferList";
import AddMoneyTransfer from "./components/Accounts/AddMoneyTransfer";
import AddDeposit from "./components/Accounts/AddDeposit";
import DepositList from "./components/Accounts/DepositList";
import CashTransactions from "./components/Accounts/CashTransactions";
import AddVanCash from "./components/Accounts/AddVanCash";
import RiderAccountList from "./components/Accounts/RiderAccountList";
import AccountLedger from "./components/Accounts/AccountLedger";
import AddStockAdjustment from "./components/Stock/AddStockAdjustment";
import AdjustmentList from "./components/Stock/AdjustmentList";
import AddStockTransfer from "./components/Stock/AddStockTransfer";
import TransferList from "./components/Stock/TransferList";
import ExpenseList from "./components/Expenses/ExpensesList";
import AddExpense from "./components/Expenses/AddExpense";
import AddExpenseCategory from "./components/Expenses/AddExpenseCategory";
import ExpenseCategoryList from "./components/Expenses/ExpenseCategoryList";
import SendMessage from "./components/Message/SendMessage";
import MessageTemplatesList from "./components/Message/MessageTemplatesList";
import UnitsList from "./components/Settings/UnitsList";
import PaymentTypesList from "./components/Settings/PaymentTypes";
import ChangePassword from "./components/Settings/ChangePassword";
import Store from "./components/Settings/Store";
import TaxList from "./components/Settings/TaxList";
import SmsApi from "./components/Settings/SmsApi";
import PosSettingsForm from "./components/Settings/Sale";
import AddTax from "./components/Settings/AddTax";
import AddTaxGroup from "./components/Settings/AddTaxGroup";
import AddUnit from "./components/Settings/AddUnit";
import AddPaymentType from "./components/Settings/AddPaymentType";
import AddCountry from "./components/Places/AddCountry";
import AddState from "./components/Places/AddState";
import CountryList from "./components/Places/CountryList";
import StateList from "./components/Places/StateList";
import WarehouseForm from "./components/Warehpuse/WarehouseForm";
import WarehouseList from "./components/Warehpuse/WarehouseList";
import WarehouseTracker from "./components/Warehpuse/WarehouseTracker";
import TerminalList from "./components/Terminal/TerminalList";
import CreateTerminal from "./components/Terminal/CreateTerminal";
import AddBanner from "./components/Banners/AddBanner";
import BannersList from "./components/Banners/BannersList";
import AddMarketingItems from "./components/Banners/AddMarketingItems";
import MarketingItemsList from "./components/Banners/MarketingItemView";
import AddProduct from "./components/Banners/AddProduct";
import ProductListView from "./components/Banners/ProductListView";
import DeletionRequests from "./components/admin/deletion-requests";
import ProfileEdit from "./pages/ProfileEdit";
import OrderList from "./components/Order/OrderList/OrderList";
import DeliverySlotCreate from "./components/DeliverySlot/DeliverySlotCreate";
import DeliverySlotList from "./components/DeliverySlot/DeliverySlotList";
import Audit from "./components/Auditor/Audit";
import AuditDashboard from "./components/Auditor/AuditDashboard";
import OpenAuditList from "./components/Auditor/OpenAuditList"
import BucketCreate from "./components/Auditor/BucketCreate";
import UserBucketList from "./components/Auditor/UserBucketList";
import ImageMerger from "./pages/ImageMerger";
import ItemImageManagement from "./components/ImageManagement/ItemImageManagement";
import CategoryImageManagement from "./components/ImageManagement/CategoryImageManagement";
import SubCategoryImageManagement from "./components/ImageManagement/subcategory/SubCategoryImageManagement";
import SubSubCategoryImageManagement from "./components/ImageManagement/subsubcategory/SubSubCategoryImageManagement";
import AllAudits from "./components/Auditor/AllAudits";
//POS MOBILE
import POSM from "./components/Sales/POS/POSM";
import PurchaseM from "./components/purchase/NewPurchase/PurchaseM"
import Sm from "./components/Stock/StockTransfer/Sm";
import { useEffect } from 'react';
import { Camera } from '@capacitor/camera';
import { StatusBar, Style } from '@capacitor/status-bar';
const useStatusBarConfig = () => {
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        const res = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
        console.log('Camera permission:', res);
      } catch (err) {
        console.error('Camera permission error:', err);
      }
    };

    const configureStatusBar = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false }); // Keeps content below status bar
        await StatusBar.setStyle({ style: Style.Dark }); // Light or Dark
        await StatusBar.show();
      } catch (error) {
        console.warn('StatusBar plugin not available:', error);
      }
    };

    // Call both
    requestCameraPermission();
    configureStatusBar();
  }, []);
};


function App() {
  useStatusBarConfig();
  return (
    <Router>
        <BackButtonHandler />
      <Routes>
          {/* POSM */}
         <Route path="/pos-main" element={<POSM />}/>
         <Route path="/purchase-main" element={<PurchaseM />}/>
         <Route path="/stock-main" element={<Sm />}/>
         
 

        <Route path="/admin-register" element={<AdminRegister />} />
        <Route path="/" element={<AdminLogin />} />
        <Route path="/user-login" element={<UserLogin />} />
        <Route path="/audit-login" element={<AuditorLogin />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/auditor-dashboard" element={<AuditDashboard />} />
        <Route path="/admin/add/user" element={<AddUser />} />
        <Route path="/admin/user/list" element={<UserList />} />
        <Route path='/create-user' element={<CreateUres/>}/>
        <Route path="/admin/role/list" element={<RoleList />} />
        <Route path="/admin/create/list" element={<CreateRolelist />} />
        <Route path="/rider/list" element={<RiderList />} />
        <Route path="/rider/add" element={<CreateRider />} />
        <Route path="/rider-commission/create" element={<CreateRiderCommission />} />
        <Route path="/rider-commission/view" element={<RiderCommissionList />} />
        <Route path="/account/rider/view" element={<RiderAccountList />} />
        <Route path="/customer/add" element={<Addcustomer />} />
        <Route path="/customer/view" element={<Customerlist />} />
        <Route path="/customer/new" element={<NewCustomer />} />
        <Route path="/customer/new/list" element={<NewCustomerlist />} />
        <Route path="/supplier/add" element={<AddSupplier />} />
        <Route path="/supplier/view" element={<Supplierlist />} />
        <Route path="/customer/import" element={<ImportCustomer />} />
        <Route path="/supplier/import" element={<ImportSupplier />} />
        <Route path="/items/add" element={<AddItem />} />
        <Route path="/services/add" element={<AddService />} />
        <Route path="/add-update-services" element={<AddUpdateServices />} />
        <Route path="/item-list" element={<ItemList />} />
        <Route path="/categories-list" element={<CategoriesList />} />
        <Route path="/categories-list-form" element={<ImportEntity entity="categories" />} />
        <Route path="/subcategories-list" element={<SubCategoryList />} />
        <Route path="/subcategories-form" element={<ImportEntity entity="subcategories" />} />
        <Route path="/sub-subcategories-form" element={<ImportEntity entity="sub-subcategories" />} />
        <Route path="/sub-subcategory-list" element={<SubSubCategoryList />} />
        <Route path="/brands-list" element={<BrandsList />} />
        <Route path="/brand-form" element={<BrandForm />} />
        <Route path="/variants-list" element={<VariantsList />} />
        <Route path="/variant-add" element={<VariantAdd />} />
        <Route path="/print-labels" element={<PrintLabels />} />
        <Route path="/import-items" element={<ImportItems />} />
        <Route path="/import-services" element={<ImportServices />} />
        <Route path="/categories/import" element={<ImportEntity entity="categories" />} />
        <Route path="/subcategories/import" element={<ImportEntity entity="subcategories" />} />
        <Route path="/sub-subcategories/import" element={<ImportEntity entity="sub-subcategories" />} />
        <Route path="/store/add" element={<AddStore />} />
        <Route path="/admin/store/edit" element={<AddStore />} />
        <Route path="/store/view" element={<StoreView />} />
        <Route path="/add-subscription" element={<AddSubscription />} />
        <Route path="/subscription-list" element={<SubscriptionList />} />
        <Route path="/subscription-list/:storeId" element={<SubscriptionList />} />
        <Route path="/edit-subscription/:id" element={<AddSubscription />} />
        <Route path="/warehouse-form" element={<WarehouseForm />} />
        <Route path="/warehouse-list" element={<WarehouseList />} />
        <Route path="/warehouse-tracker" element={<WarehouseTracker />} />
        <Route path="/terminal-list" element={<TerminalList />} />
        <Route path="/create-terminal" element={<CreateTerminal />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/profit-loss" element={<ProfitLossReport />} />
        <Route path="/reports/sales-payment" element={<SalesPaymentReport />} />
        <Route path="/reports/customer-orders" element={<CustomerOrders />} />
        <Route path="/reports/stock-transfer" element={<StockTransferReport />} />
        <Route path="/reports/sale-item" element={<SaleItemsReport />} />
        <Route path="/reports/stock" element={<StockReport />} />
        <Route path="/reports/item-compare" element={<ItemCompare />} />
        <Route path="/reports/item-transfer" element={<ItemTransfer />} />
        <Route path="/add-advance" element={<AddAdvance />} />
        <Route path="/advance-list" element={<AdvanceList />} />
        <Route path="/customer/coupon/view" element={<CustomerCoupenList />} />
        <Route path="/customer/coupon/add" element={<CreateCustomerCoupons />} />
        <Route path="/master/coupon/add" element={<CreateMasterCoupon />} />
        <Route path="/master/coupon/view" element={<CouponsMaster />} />
        <Route path="/create" element={<CouponForm />} />
        <Route path="/create-coupon" element={<DiscountCouponForm />} />
        <Route path="/coupon-master" element={<DiscountCouponList />} />
        <Route path="/newquotation" element={<NewQuotation />} />
        <Route path="/quotation-list" element={<QuotationList />} />
        <Route path="/quotation/edit/:id" element={<QuotationForm />} />
        <Route path="/new-purchase" element={<NewPurchase />} />
        <Route path="/purchase-list" element={<PurchaseList />} />
        <Route path="/purchasereturn-list" element={<PurchaseReturnsList />} />
        <Route path="/purchase-return" element={<PurchaseReturn />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/add-sale" element={<AddSale />} />
        <Route path="/sales-return/add" element={<AddSalesRetutrn />} />
        <Route path="/sales-return" element={<SalesReturn />} />
        <Route path="/sales-return/edit/:id" element={<AddSalesReturn />} />
        <Route path="/sale-list" element={<SaleList />} />
        <Route path="/view-sale" element={<ViewSale />} />
        <Route path="/sales-payment" element={<SalesPayment />} />
        <Route path="/sales-payment-list" element={<SalesPaymentList />} />
        <Route path="/receive-payment" element={<ReceivePayment />} />
        <Route path="/pos-invoice/:id" element={<POSInvoice />} />
        <Route path="/view-payment" element={<ViewPayment />} />
        <Route path="/add-account" element={<AddAccount />} />
        <Route path="/account-list" element={<AccountList />} />
        <Route path="/accounts/:accountId/ledger" element={<AccountLedger />} />
        <Route path="/money-transfer-list" element={<MoneyTransferList />} />
        <Route path="/add-money-transfer" element={<AddMoneyTransfer />} />
        <Route path="/add-deposit" element={<AddDeposit />} />
        <Route path="/deposit-list" element={<DepositList />} />
        <Route path="/cash-transactions" element={<CashTransactions />} />
        <Route path="/ledger/van-cash/new" element={<AddVanCash />} />
        <Route path="/stock-adjustment" element={<AddStockAdjustment />} />
        <Route path="/adjustment-list" element={<AdjustmentList />} />
        <Route path="/stock-transfer" element={<AddStockTransfer />} />
        <Route path="/transfer-list" element={<TransferList />} />
        <Route path="/expense-list" element={<ExpenseList />} />
        <Route path="/add-expense" element={<AddExpense />} />
        <Route path="/add-expense-category" element={<AddExpenseCategory />} />
        <Route path="/expense-category-list" element={<ExpenseCategoryList />} />
        <Route path="/send-message" element={<SendMessage />} />
        <Route path="/message-templates-list" element={<MessageTemplatesList />} />
        <Route path="/units-list" element={<UnitsList />} />
        <Route path="/add-unit" element={<AddUnit />} />
        <Route path="/edit-unit/:unitId" element={<AddUnit />} />
        <Route path="/payment-types-list" element={<PaymentTypesList />} />
        <Route path="/add-payment-type" element={<AddPaymentType />} />
        <Route path="/edit-payment-type/:paymentTypeId" element={<AddPaymentType />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/store" element={<Store />} />
        <Route path="/tax-list" element={<TaxList />} />
        <Route path="/add-tax" element={<AddTax />} />
        <Route path="/edit-tax/:taxId" element={<AddTax />} />
        <Route path="/add-tax-group" element={<AddTaxGroup />} />
        <Route path="/edit-tax-group/:taxGroupId" element={<AddTaxGroup />} />
        <Route path="/sms-api" element={<SmsApi />} />
        <Route path="/pos-settings" element={<PosSettingsForm />} />
        <Route path="/system-tab" element={<SystemTab />} />
        <Route path="/add-country" element={<AddCountry />} />
        <Route path="/edit-country/:countryId" element={<AddCountry />} />
        <Route path="/country-list" element={<CountryList />} />
        <Route path="/add-state" element={<AddState />} />
        <Route path="/edit-state/:stateId" element={<AddState />} />
        <Route path="/state-list" element={<StateList />} />
        <Route path="/banners/add" element={<AddBanner />} />
        <Route path="/banners/view" element={<BannersList />} />
        <Route path="/marketingitem/add" element={<AddMarketingItems />} />
        <Route path="/marketingitem/view" element={<MarketingItemsList />} />
        <Route path="/product/add" element={<AddProduct />} />
        <Route path="/product/view" element={<ProductListView />} />
        <Route path="/admin/deletion-requests" element={<DeletionRequests />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/order/view" element={<OrderList />} />

        <Route path="/delivery-slot/create" element={<DeliverySlotCreate />} />
        <Route path="/delivery-slot/view" element={<DeliverySlotList />} />
        
        <Route path="/audit" element={<Audit />} />
        <Route path="/audit/open" element={<OpenAuditList />} />
        <Route path="/audit/all" element={<AllAudits />} />

        
        <Route path="/bucket-create" element={<BucketCreate />} />
        <Route path="/bucket-list" element={<UserBucketList />} />
        <Route path="/image" element={<ImageMerger />} />
        <Route path="/item/image-management" element={<ItemImageManagement />} />
        <Route path="/category/image-management" element={<CategoryImageManagement />} />
        <Route path="/subcategory/image-management" element={<SubCategoryImageManagement />} />
        <Route path="/subsubcategory/image-management" element={<SubSubCategoryImageManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
