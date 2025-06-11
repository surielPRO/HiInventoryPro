import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useProducts = (category = null) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    
    let q = query(collection(db, 'products'), orderBy('metadata.fechaCreacion', 'desc'));

    if (category) {
      q = query(q, where('category', '==', category));
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [category]);

  return { products, loading, error };
};