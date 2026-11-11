const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <div className="site-footer-brand-name">ShopCart</div>
          <p className="site-footer-brand-desc">
            Carefully sourced electronics, fashion, books, and home essentials.
            Shipped fast, returned easy.
          </p>
        </div>
        <div className="site-footer-col">
          <h4>Shop</h4>
          <ul className="site-footer-links">
            <li><a href="/products">All Products</a></li>
            <li><a href="/products?category=1">Electronics</a></li>
            <li><a href="/products?category=2">Laptops</a></li>
            <li><a href="/products?category=8">Books</a></li>
            <li><a href="/products?category=9">Gaming</a></li>
          </ul>
        </div>
        <div className="site-footer-col">
          <h4>Help</h4>
          <ul className="site-footer-links">
            <li><a href="#">Contact us</a></li>
            <li><a href="#">Shipping & returns</a></li>
            <li><a href="#">Track your order</a></li>
            <li><a href="#">FAQ</a></li>
          </ul>
        </div>
      </div>
      <div className="site-footer-bottom">
        <span>© {year} ShopCart. All rights reserved.</span>
        <span>Built with React &amp; Node.js</span>
      </div>
    </footer>
  );
};

export default Footer;
