import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import CostumeCard from '../../components/CostumeCard'
import CostumeService from '../../services/costume.service'
import Button from '../../components/ui/Button'

const Home = () => {
  const [featuredCostumes, setFeaturedCostumes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedCostumes()
  }, [])

  const fetchFeaturedCostumes = async () => {
    try {
      // Mock data for now
      const mockCostumes = [
        {
          id: 1,
          name: 'Medieval Knight Armor',
          description: 'Full knight armor with helmet and sword',
          price: 150000,
          deposit: 500000,
          size: 'L',
          stock: 5,
          image: 'https://picsum.photos/seed/costume1/400/300'
        },
        {
          id: 2,
          name: 'Renaissance Princess',
          description: 'Elegant princess dress with tiara',
          price: 120000,
          deposit: 400000,
          size: 'M',
          stock: 3,
          image: 'https://picsum.photos/seed/costume2/400/300'
        },
        {
          id: 3,
          name: 'Pirate Captain',
          description: 'Complete pirate outfit with hat and hook',
          price: 100000,
          deposit: 300000,
          size: 'XL',
          stock: 7,
          image: 'https://picsum.photos/seed/costume3/400/300'
        }
      ]
      setFeaturedCostumes(mockCostumes)
    } catch (error) {
      console.error('Error fetching costumes:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 rounded-lg mb-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Rent Amazing Costumes for Every Occasion
          </h1>
          <p className="text-xl mb-8 opacity-90">
            From medieval knights to futuristic heroes, find the perfect costume for your event
          </p>
          <Link to="/costumes">
            <Button size="lg" variant="secondary">
              Browse Costumes
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Costumes */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Featured Costumes</h2>
          <Link to="/costumes" className="text-blue-600 hover:underline">
            View All →
          </Link>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCostumes.map(costume => (
              <CostumeCard key={costume.id} costume={costume} />
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-12 rounded-lg">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose Us</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Quality Guaranteed</h3>
              <p className="text-gray-600">All costumes are cleaned and maintained to the highest standards</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Flexible Rental</h3>
              <p className="text-gray-600">Rent for a day or a week with easy return process</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Wide Selection</h3>
              <p className="text-gray-600">Hundreds of costumes for all ages and sizes</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home