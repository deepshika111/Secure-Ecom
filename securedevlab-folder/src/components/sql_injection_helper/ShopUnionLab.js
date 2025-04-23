import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar';
const BACKEND_URL = "https://securedevlab.onrender.com";

const CATEGORIES = ['laptops', 'tablets', 'phones'];

const ShopUnionLab = ({ labDetails }) => {
  const [selectedCategory, setSelectedCategory] = useState('laptops');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  // Fetch products on category change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/lab/union-test?category=${encodeURIComponent(selectedCategory)}`);
        const data = await res.json();

        if (data.success) {
          setProducts(data.result);
          setError(null);
        } else {
          setProducts([]);
          setError(data.error || 'Failed to fetch products.');
        }
      } catch (err) {
        setProducts([]);
        setError(err.message);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  return (
    <>
    <Navbar />
    {/* <div className="card shadow-sm"> */}
      <div className="card-body">
        <h1 className="display-6 mb-4">
          <span className="text-primary"> UNDERSTANDING THE LAB</span>
        </h1>
        <p>Below are the list of categories that our electronic store offers. You can click on the category to view the products, which invokes the category filter query.
</p>
{/* <br>
</br> */}
<p><strong>{labDetails.description}</strong>
          {/* Now, we want to find out how many columns this category filter query returns by progressively using UNION ... until the query succeeds. */}
        </p>

        <h2 className="h4 mb-4 text-capitalize">{selectedCategory}</h2>

        <div className="btn-group mb-4" role="group">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn ${cat === selectedCategory ? 'btn-primary' : 'btn-outline-primary'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col" className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item, i) => (
                  <tr key={i}>
                    <td>{item.name || <i>null</i>}</td>
                    <td className="text-end">
                      <button className="btn btn-primary btn-sm">
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    {/* </div> */}
    </>
  );
};

export default ShopUnionLab;
