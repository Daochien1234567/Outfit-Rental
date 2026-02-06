import { useEffect, useState } from 'react'
import { formatMoney } from '../../../utils/formatMoney'
import Button from '../../../components/ui/Button'
import adminService from '../../../services/admin.service'

const TopCostumes = () => {
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(false)
  const [costumes, setCostumes] = useState([])

  useEffect(() => {
    fetchTopCostumes()
  }, [period])

  const fetchTopCostumes = async () => {
    setLoading(true)
    try {
      const res = await adminService.getTopCostumes({
        limit: 10
      })

      // Map BE → FE
      const mapped = res.data.map(item => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        dailyPrice: Number(item.daily_price),
        rentalTimes: Number(item.rental_times),
        totalRevenue: Number(item.total_revenue || 0),
        avgRentalValue: Number(item.avg_rental_value || 0)
      }))

      setCostumes(mapped)
    } catch (error) {
      console.error('Fetch top costumes error:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalRevenue = costumes.reduce((s, c) => s + c.totalRevenue, 0)
  const totalRentals = costumes.reduce((s, c) => s + c.rentalTimes, 0)

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Top Costumes</h1>
          <p className="text-gray-600">Costumes performance by revenue & rentals</p>
        </div>

        <div className="flex gap-2">
          {['week', 'month', 'year'].map(p => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? 'primary' : 'outline'}
              onClick={() => setPeriod(p)}
            >
              {p.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <>
          {/* SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <SummaryCard title="Total Revenue" value={formatMoney(totalRevenue)} />
            <SummaryCard title="Total Rentals" value={totalRentals} />
            <SummaryCard
              title="Avg Order Value"
              value={formatMoney(totalRevenue / (totalRentals || 1))}
            />
          </div>

          {/* TABLE */}
          <div className="bg-white shadow rounded overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 text-sm">
                <tr>
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Costume</th>
                  <th className="p-3 text-left">Brand</th>
                  <th className="p-3 text-right">Daily Price</th>
                  <th className="p-3 text-center">Rentals</th>
                  <th className="p-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {costumes.map((c, index) => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-bold">{index + 1}</td>
                    <td className="p-3">{c.name}</td>
                    <td className="p-3">{c.brand}</td>
                    <td className="p-3 text-right">{formatMoney(c.dailyPrice)}</td>
                    <td className="p-3 text-center">{c.rentalTimes}</td>
                    <td className="p-3 text-right font-bold text-green-600">
                      {formatMoney(c.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

const SummaryCard = ({ title, value }) => (
  <div className="bg-white shadow rounded p-5">
    <p className="text-gray-500 text-sm">{title}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
)

export default TopCostumes
