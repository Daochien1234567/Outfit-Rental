import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart')
    return savedCart ? JSON.parse(savedCart) : []
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  /**
   * costume: object trả về từ API
   * rentalDays: số ngày thuê
   */
  const addToCart = (costume, rentalDays = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === costume.id)

      const rental_fee = Number(costume.daily_price) * rentalDays
      const deposit_fee = Number(costume.deposit_amount)

      if (existing) {
        return prev.map(item =>
          item.id === costume.id
            ? {
                ...item,
                rentalDays,
                rental_fee,
                total_amount: rental_fee + deposit_fee
              }
            : item
        )
      }

      return [
        ...prev,
        {
          id: costume.id,
          name: costume.name,
          daily_price: Number(costume.daily_price),
          deposit_amount: Number(costume.deposit_amount),
          rentalDays,
          rental_fee,
          deposit_fee,
          total_amount: rental_fee + deposit_fee,
          quantity: 1,
          image: costume.images?.[0] || null
        }
      ]
    })
  }

  const removeFromCart = (costumeId) => {
    setCart(prev => prev.filter(item => item.id !== costumeId))
  }

  const updateRentalDays = (costumeId, rentalDays) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id !== costumeId) return item

        const rental_fee = item.daily_price * rentalDays

        return {
          ...item,
          rentalDays,
          rental_fee,
          total_amount: rental_fee + item.deposit_fee
        }
      })
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.total_amount, 0)
  }

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateRentalDays,
    clearCart,
    getCartTotal,
    cartCount: cart.length
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
