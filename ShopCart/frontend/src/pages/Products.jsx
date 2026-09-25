import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  
  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPage = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentCategory, currentSearch, currentSort, currentPage]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/products?page=${currentPage}&limit=12&sort=${currentSort}`;
      if (currentCategory) url += `&category_id=${currentCategory}`;
      if (currentSearch) url += `&search=${currentSearch}`;
      
      const res = await api.get(url);
      setProducts(res.data.data);
      setPagination({ page: res.data.page, totalPages: res.data.totalPages });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const search = fd.get('search');
    if (search) searchParams.set('search', search);
    else searchParams.delete('search');
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handleFilter = (key, value) => {
    if (value) searchParams.set(key, value);
    else searchParams.delete(key);
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>All Products</h1>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            name="search" 
            defaultValue={currentSearch} 
            placeholder="Search products..." 
            className="form-input" 
            style={{ width: '250px' }}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Filters Sidebar */}
        <div className="card" style={{ padding: '1.5rem', width: '250px', flexShrink: 0 }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Filters</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Categories</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  checked={currentCategory === ''} 
                  onChange={() => handleFilter('category', '')} 
                /> All Categories
              </label>
              {categories.map(cat => (
                <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    checked={currentCategory === cat.id.toString()} 
                    onChange={() => handleFilter('category', cat.id.toString())} 
                  /> {cat.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Sort By</h4>
            <select 
              className="form-input" 
              value={currentSort} 
              onChange={(e) => handleFilter('sort', e.target.value)}
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div className="loading-screen" style={{ minHeight: '300px' }}>Loading products...</div>
          ) : products.length === 0 ? (
            <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No products found</h3>
              <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search or filters.</p>
              <button 
                onClick={() => setSearchParams({})} 
                className="btn btn-outline" 
                style={{ marginTop: '1.5rem' }}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map(product => (
                  <Link key={product.id} to={`/products/${product.id}`} className="card">
                    <img src={product.image_url} alt={product.name} className="product-image" />
                    <div className="product-info">
                      <div className="product-category">{product.category_name}</div>
                      <h3 className="product-title">{product.name}</h3>
                      <div>
                        {product.discount_price ? (
                          <>
                            <span className="product-price">${product.discount_price}</span>
                            <span className="product-price-old">${product.price}</span>
                          </>
                        ) : (
                          <span className="product-price">${product.price}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem' }}>
                  <button 
                    className="btn btn-outline" 
                    disabled={pagination.page === 1}
                    onClick={() => handleFilter('page', (pagination.page - 1).toString())}
                  >
                    Previous
                  </button>
                  <span style={{ padding: '0.5rem 1rem' }}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button 
                    className="btn btn-outline" 
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => handleFilter('page', (pagination.page + 1).toString())}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
