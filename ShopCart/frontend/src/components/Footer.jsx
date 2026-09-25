const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#1e293b', color: '#cbd5e1', padding: '3rem 1rem', marginTop: 'auto' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <h3 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1rem' }}>ShopCart</h3>
          <p style={{ maxWidth: '300px' }}>Your one-stop destination for premium products across electronics, fashion, home essentials, and more.</p>
        </div>
        <div>
          <h4 style={{ color: 'white', marginBottom: '1rem' }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><a href="/products" style={{ color: 'inherit', textDecoration: 'none' }}>Shop All</a></li>
            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Categories</a></li>
            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Special Offers</a></li>
          </ul>
        </div>
        <div>
          <h4 style={{ color: 'white', marginBottom: '1rem' }}>Customer Service</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Contact Us</a></li>
            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Shipping & Returns</a></li>
            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>FAQ</a></li>
          </ul>
        </div>
      </div>
      <div style={{ maxWidth: '1200px', margin: '2rem auto 0', paddingTop: '2rem', borderTop: '1px solid #334155', textAlign: 'center', fontSize: '0.875rem' }}>
        &copy; {new Date().getFullYear()} ShopCart. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
