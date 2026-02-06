const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Costume Rental</h3>
            <p className="text-gray-300">
              Your one-stop shop for costume rentals. Quality costumes for every occasion.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/costumes" className="text-gray-300 hover:text-white">Browse Costumes</a></li>
              <li><a href="/about" className="text-gray-300 hover:text-white">About Us</a></li>
              <li><a href="/contact" className="text-gray-300 hover:text-white">Contact Us</a></li>
              <li><a href="/terms" className="text-gray-300 hover:text-white">Terms & Conditions</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <ul className="space-y-2 text-gray-300">
              <li>Email: info@costumerental.com</li>
              <li>Phone: (123) 456-7890</li>
              <li>Address: 123 Costume Street, City, Country</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Costume Rental. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer