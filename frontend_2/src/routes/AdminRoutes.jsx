import { Routes, Route } from 'react-router-dom'
import AdminLayout from '../pages/admin/AdminLayout'
import Dashboard from '../pages/admin/Dashboard'
import ManageCostumes from '../pages/admin/costumes/ManageCostumes'
import ManageUsers from '../pages/admin/users/ManageUsers'
import ManageRentals from '../pages/admin/rentals/ManageRentals'
import RentalDetail from '../pages/admin/rentals/RentalDetail'
import ManageDeposits from '../pages/admin/payments/ManageDeposits'
import RefundDeposit from '../pages/admin/payments/RefundDeposit'
import PenaltyConfig from '../pages/admin/penalties/PenaltyConfig'
import RevenueReport from '../pages/admin/reports/RevenueReport'
import TopCostumes from '../pages/admin/reports/TopCostumes'
import TopCustomers from '../pages/admin/reports/TopCustomers'

const AdminRoutes = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="costumes" element={<ManageCostumes />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="rentals" element={<ManageRentals />} />
        <Route path="rentals/:id" element={<RentalDetail />} />
        <Route path="deposits" element={<ManageDeposits />} />
        <Route path="deposits/refund/:id" element={<RefundDeposit />} />
        <Route path="penalties" element={<PenaltyConfig />} />
        <Route path="reports/revenue" element={<RevenueReport />} />
        <Route path="reports/top-costumes" element={<TopCostumes />} />
        <Route path="reports/top-customers" element={<TopCustomers />} />
      </Route>
    </Routes>
  )
}

export default AdminRoutes