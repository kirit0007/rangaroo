'use client';

import { useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Upload, 
  X 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminStore } from '@/store/adminStore';
import { products as initialProducts, categories, collections, formatPrice } from '@/data/products';
import { Product } from '@/types';

function SafeProductThumbnail({ src, alt }: { src?: string; alt: string }) {
  const [hasError, setHasError] = useState(false);
  const cleanSrc = src && src.trim() ? src : '/logo.png';

  return (
    <div className="h-12 w-12 rounded-xl overflow-hidden relative bg-gray-100 shrink-0 border border-gray-200 flex items-center justify-center select-none text-[0px] font-sans">
      {!hasError ? (
        <img
          src={cleanSrc}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover block"
        />
      ) : (
        <Package className="w-5 h-5 text-gray-400" />
      )}
    </div>
  );
}

export default function ProductsAdminPage() {
  const storeProducts = useAdminStore((state) => state.products) || initialProducts;
  const addProduct = useAdminStore((state) => state.addProduct);
  const updateProduct = useAdminStore((state) => state.updateProduct);
  const deleteProduct = useAdminStore((state) => state.deleteProduct);

  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [productForm, setProductForm] = useState({
    name: '',
    price: 199,
    compareAtPrice: 299,
    categoryId: 'fun-paint-kit',
    collectionId: 'dinosaur',
    stockQuantity: 50,
    ageGroup: '5+',
    imageUrl: '/logo.png',
    shortDescription: 'Custom DIY paint kit',
    description: 'Full kit containing plaster figurines, non-toxic tempera paints, and painting accessories.',
    kitContents: '1 Plaster Figurine, 6 Colors, 1 Brush',
    isFeatured: true,
    isActive: true,
  });

  const filteredProducts = storeProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCategoryFilter === 'All' || p.categoryId === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      price: 199,
      compareAtPrice: 299,
      categoryId: 'fun-paint-kit',
      collectionId: 'dinosaur',
      stockQuantity: 50,
      ageGroup: '5+',
      imageUrl: '/logo.png',
      shortDescription: 'Custom DIY paint kit',
      description: 'Full kit containing plaster figurines, non-toxic tempera paints, and painting accessories.',
      kitContents: '1 Plaster Figurine, 6 Colors, 1 Brush, Instruction Guide',
      isFeatured: true,
      isActive: true,
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price,
      compareAtPrice: product.compareAtPrice || product.price + 100,
      categoryId: product.categoryId,
      collectionId: product.collectionId || 'dinosaur',
      stockQuantity: product.stockQuantity,
      ageGroup: product.ageGroup || '5+',
      imageUrl: product.images?.[0] || '/logo.png',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      kitContents: product.kitContents ? product.kitContents.join(', ') : '1 Plaster Figurine, 6 Colors, 1 Brush',
      isFeatured: product.isFeatured || false,
      isActive: product.isActive !== false,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      toast.error('Product title is required');
      return;
    }

    const slug = productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const contentsArray = productForm.kitContents.split(',').map(s => s.trim()).filter(Boolean);

    const targetProduct: Product = editingProduct ? {
      ...editingProduct,
      name: productForm.name,
      slug,
      price: Number(productForm.price),
      compareAtPrice: Number(productForm.compareAtPrice),
      categoryId: productForm.categoryId,
      collectionId: productForm.collectionId,
      stockQuantity: Number(productForm.stockQuantity),
      ageGroup: productForm.ageGroup,
      images: [productForm.imageUrl || '/logo.png'],
      shortDescription: productForm.shortDescription,
      description: productForm.description,
      kitContents: contentsArray,
      isFeatured: productForm.isFeatured,
      isActive: productForm.isActive,
    } : {
      id: `prod-${Date.now()}`,
      name: productForm.name,
      slug,
      price: Number(productForm.price),
      compareAtPrice: Number(productForm.compareAtPrice),
      categoryId: productForm.categoryId,
      collectionId: productForm.collectionId,
      stockQuantity: Number(productForm.stockQuantity),
      ageGroup: productForm.ageGroup,
      images: [productForm.imageUrl || '/logo.png'],
      shortDescription: productForm.shortDescription,
      description: productForm.description,
      kitContents: contentsArray,
      difficulty: 'beginner',
      paintType: 'Tempera (Washable)',
      figureCount: 1,
      figureSize: 'medium',
      weightGrams: 250,
      isFeatured: productForm.isFeatured,
      isActive: productForm.isActive,
      tags: [productForm.categoryId, productForm.collectionId],
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, targetProduct);
      toast.success('Product updated successfully');
    } else {
      addProduct(targetProduct);
      toast.success('Product created & added to storefront');
    }

    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: targetProduct }),
    }).catch(err => console.error('Failed to sync product to server:', err));

    setIsProductModalOpen(false);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image file size must be under 10MB');
      return;
    }

    setIsUploadingImage(true);
    const toastId = toast.loading('Uploading image to cloud storage...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && (data.publicUrl || data.url)) {
        const publicUrl = data.publicUrl || data.url;
        setProductForm(prev => ({ ...prev, imageUrl: publicUrl }));
        toast.success('Image uploaded & public URL generated!', { id: toastId });
      } else {
        toast.error(data.error || 'Failed to upload image', { id: toastId });
      }
    } catch (err: any) {
      console.error('Image upload error:', err);
      toast.error('Image upload failed', { id: toastId });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (confirm(`Are you sure you want to delete "${productName}"?`)) {
      deleteProduct(productId);
      fetch(`/api/products?id=${productId}`, { method: 'DELETE' }).catch(err => console.error(err));
      toast.success('Product deleted from storefront');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-gray-800">Products Catalog</h1>
          <p className="text-sm text-gray-500">Manage catalog, inventory, and storefront pricing.</p>
        </div>
        <button
          onClick={openAddProductModal}
          className="flex items-center space-x-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search products..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <span className="text-xs text-gray-500 font-semibold uppercase">Category:</span>
          <select
            value={productCategoryFilter}
            onChange={(e) => setProductCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/70 border-b border-gray-100 text-xs uppercase font-bold text-gray-500">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Collection</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <SafeProductThumbnail src={product.images?.[0]} alt={product.name} />
                      <div>
                        <div className="font-bold text-gray-800 line-clamp-1">{product.name}</div>
                        <div className="text-xs text-gray-400 font-mono">ID: {product.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded-lg border border-orange-100">
                      {categories.find((c) => c.id === product.categoryId)?.name || product.categoryId}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs font-medium">
                    {collections.find((c) => c.id === product.collectionId)?.name || product.collectionId || '—'}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {formatPrice(product.price)}
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="text-xs text-gray-400 line-through ml-2 font-normal">
                        {formatPrice(product.compareAtPrice)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        product.stockQuantity < 10
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {product.stockQuantity} in stock
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditProductModal(product)}
                        className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-gray-100 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-2xl font-bold font-outfit text-gray-800">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Product Title</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  placeholder="e.g. Dinosaur Paint Kit"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Compare At Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.compareAtPrice}
                    onChange={(e) => setProductForm({ ...productForm, compareAtPrice: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Collection</label>
                  <select
                    value={productForm.collectionId}
                    onChange={(e) => setProductForm({ ...productForm, collectionId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  >
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Age Group</label>
                  <input
                    type="text"
                    value={productForm.ageGroup}
                    onChange={(e) => setProductForm({ ...productForm, ageGroup: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="e.g. 5+"
                  />
                </div>
              </div>

              {/* Image Upload Option */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Product Image</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
                    placeholder="https://... or upload below"
                  />
                  <label className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs cursor-pointer transition-colors shrink-0">
                    <Upload size={14} />
                    <span>{isUploadingImage ? 'Uploading...' : 'Upload'}</span>
                    <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Kit Contents (comma-separated)</label>
                <input
                  type="text"
                  value={productForm.kitContents}
                  onChange={(e) => setProductForm({ ...productForm, kitContents: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  placeholder="1 Plaster Figurine, 6 Colors, 1 Brush"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors shadow-md cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
