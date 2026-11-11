import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          ShopCart
        </Link>
        
        <div className="nav-links">
          <NavLink to="/products" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Products
          </NavLink>
          
          {user ? (
            <>
              {user.role === 'admin' ? (
                <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                  Dashboard
                </NavLink>
              ) : (
                <>
                  <NavLink to="/orders" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    Orders
                  </NavLink>
                  <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    Profile
                  </NavLink>
                </>
              )}
              
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Create account
              </Link>
            </>
          )}

          {(!user || user.role === 'customer') && (
            <Link to="/cart" className="nav-link cart-icon-container">
              <span>Cart</span>
              {cart && cart.item_count > 0 && (
                <span className="cart-badge">{cart.item_count}</span>
              )}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
