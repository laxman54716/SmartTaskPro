import { Link, useNavigate } from 'react-router-dom';
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
          <Link to="/products" className="nav-link">Products</Link>
          
          {user ? (
            <>
              {user.role === 'admin' ? (
                <Link to="/admin" className="nav-link">Dashboard</Link>
              ) : (
                <>
                  <Link to="/profile" className="nav-link">Profile</Link>
                  <Link to="/orders" className="nav-link">Orders</Link>
                </>
              )}
              
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
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
