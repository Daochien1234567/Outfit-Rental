import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import CostumeCard from '../../components/CostumeCard'
import Pagination from '../../components/ui/Pagination'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import costumeService from '../../services/costume.service'

const CostumeList = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [costumes, setCostumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category_id: searchParams.get('category_id') || '',
    sizes: searchParams.get('sizes') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    page: Number(searchParams.get('page')) || 1,
    limit: 12
  })

  /* ================== SYNC URL → FILTERS ================== */
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: searchParams.get('search') || '',
      category_id: searchParams.get('category_id') || '',
      sizes: searchParams.get('sizes') || '',
      min_price: searchParams.get('min_price') || '',
      max_price: searchParams.get('max_price') || '',
      page: Number(searchParams.get('page')) || 1
    }))
  }, [searchParams])

  
  useEffect(() => {
    fetchCostumes()
    // eslint-disable-next-line
  }, [searchParams])

  const fetchCostumes = async () => {
    setLoading(true)
    try {
      const res = await costumeService.getAllCostumes({
        page: Number(searchParams.get('page')) || 1,
        limit: filters.limit,
        search: searchParams.get('search') || '',
        category_id: searchParams.get('category_id') || '',
        sizes: searchParams.get('sizes') || '',
        min_price: searchParams.get('min_price') || '',
        max_price: searchParams.get('max_price') || ''
      })

      const data = res?.data
      setCostumes(Array.isArray(data?.costumes) ? data.costumes : [])
      setTotalPages(data?.pagination?.pages || 1)
    } catch (err) {
      console.error('Fetch costumes error:', err)
      setCostumes([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'page' && key !== 'limit') {
        params.set(key, value)
      }
    })

    params.set('page', '1')
    setSearchParams(params)
  }

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page)
    setSearchParams(params)
  }

  const resetFilters = () => {
    setFilters({
      search: '',
      category_id: '',
      sizes: '',
      min_price: '',
      max_price: '',
      page: 1,
      limit: 12
    })
    setSearchParams({})
  }

  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Danh sách trang phục</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Input
              name="search"
              placeholder="Tìm kiếm trang phục..."
              value={filters.search}
              onChange={handleFilterChange}
            />

            <select
              name="sizes"
              value={filters.sizes}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Tất cả kích cỡ</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
            </select>

            <Input
              name="min_price"
              type="number"
              placeholder="Giá tối thiểu"
              value={filters.min_price}
              onChange={handleFilterChange}
            />

            <Input
              name="max_price"
              type="number"
              placeholder="Giá tối đa"
              value={filters.max_price}
              onChange={handleFilterChange}
            />
          </div>

          <div className="flex space-x-4">
            <Button type="submit">Áp dụng bộ lọc</Button>
            <Button type="button" variant="outline" onClick={resetFilters}>
              Đặt lại
            </Button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : costumes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Không tìm thấy trang phục nào
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {costumes.map(item => (
              <CostumeCard key={item.id} costume={item} />
            ))}
          </div>

          <div className="mt-8">
            <Pagination
              currentPage={filters.page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default CostumeList
