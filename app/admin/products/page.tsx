'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  SlidersHorizontal,
  ExternalLink,
  Upload,
  X,
  Sparkles,
  Layers,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminStore } from '@/store/adminStore';
import { products as initialProducts, categories, collections } from '@/data/products';
import { Product } from '@/types';

export default function ProductsAdminPage() {
  const storeProducts = useAdminStore((state) => state.products) || initialProducts;
  const addProduct = useAdminStore((state) => state.addProduct);
  const updateProduct = useAdminStore((state) => state.updateProduct);
  const deleteProduct = useAdminStore((state) => state.deleteProduct);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalTab, setModalTab] = useState<'general' | 'inventory' | 'seo'>('general');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price: 249,
    compareAtPrice: 349,
    categoryId: 'fun-paint-kit',
    collectionId: 'dinosaur',
    stockQuantity: 50,
    ageGroup: '5+',
    imageUrl: '/logo.png',
    shortDescription: 'Handmade DIY Plaster Figurine Paint Kit',
    description: 'Complete creative craft kit with figurines, rich acrylic paints, brushes, and kid-safe varnish.',
    kitContents: '2 Figurines, 6 Paint Pots, 1 Fine Tip Brush, 1 Flat Brush',
    isFeatured: true,
    isActive: true,
    metaTitle: '',
    metaDescription: '',
    tags: 'diy, kids, craft, paint',
  });

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return storeProducts.filter((product) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.slug.toLowerCase().includes(q) ||
        product.id.toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === 'All' || product.categoryId === categoryFilter;

      let matchesStock = true;
      if (stockFilter === 'in_stock') matchesStock = product.stockQuantity >= 10;
      else if (stockFilter === 'low_stock') matchesStock = product.stockQuantity > 0 && product.stockQuantity < 10;
      else if (stockFilter === 'out_of_stock') matchesStock = product.stockQuantity === 0;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [storeProducts, search, categoryFilter, stockFilter]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      slug: '',
      price: 249,
      compareAtPrice: 349,
      categoryId: categories[0]?.id || 'fun-paint-kit',
      collectionId: collections[0]?.id || 'dinosaur',
      stockQuantity: 50,
      ageGroup: '5+',
      imageUrl: '/logo.png',
      shortDescription: 'Handmade DIY Plaster Figurine Paint Kit',
      description: 'Complete creative craft kit with figurines, rich non-toxic paints, brushes, and instructions.',
      kitContents: '2 Figurines, 6 Paints, 2 Brushes, Color Palette Guide',
      isFeatured: false,
      isActive: true,
      metaTitle: '',
      metaDescription: '',
      tags: 'paint kit, diy, kids',
    });
    setModalTab('general');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
      price: product.price,
      compareAtPrice: product.compareAtPrice || Math.round(product.price * 1.3),
      categoryId: product.categoryId,
      collectionId: product.collectionId,
      stockQuantity: product.stockQuantity,
      ageGroup: product.ageGroup || '5+',
      imageUrl: product.images?.[0] || '/logo.png',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      kitContents: Array.isArray(product.kitContents) ? product.kitContents.join(', ') : '',
      isFeatured: !!product.isFeatured,
      isActive: product.isActive ?? true,
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : 'kids, diy',
    });
    setModalTab('general');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Product title is required');
      return;
    }

    const slug =
      formData.slug.trim() ||
      formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const productPayload: Product = {
      id: editingProduct ? editingProduct.id : `kit-${Date.now()}`,
      name: formData.name,
      slug,
      shortDescription: formData.shortDescription,
      description: formData.description,
      price: Number(formData.price),
      compareAtPrice: Number(formData.compareAtPrice) || undefined,
      categoryId: formData.categoryId,
      collectionId: formData.collectionId,
      images: [formData.imageUrl || '/logo.png'],
      kitContents: formData.kitContents.split(',').map((s) => s.trim()).filter(Boolean),
      ageGroup: formData.ageGroup,
      difficulty: 'beginner',
      paintType: 'Washable Acrylic Tempera',
      figureCount: 2,
      figureSize: 'medium',
      weightGrams: 350,
      stockQuantity: Number(formData.stockQuantity),
      isActive: formData.isActive,
      isFeatured: formData.isFeatured,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      metaTitle: formData.metaTitle || formData.name,
      metaDescription: formData.metaDescription || formData.shortDescription,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productPayload);
      toast.success('Product updated successfully!');
    } else {
      addProduct(productPayload);
      toast.success('Product created and added to catalog!');
    }

    setIsModalOpen(false);
  };

  const handleToggleActive = (productId: string, currentStatus: boolean) => {
    updateProduct(productId, { isActive: !currentStatus });
    toast.success(`Product ${!currentStatus ? 'activated' : 'hidden from store'}`);
  };

  const handleDelete = (productId: string) => {
    deleteProduct(productId);
    setIsDeleteConfirmOpen(null);
    toast.success('Product removed from catalog');
  };

  // Bulk actions
  const handleBulkToggleActive = (active: boolean) => {
    selectedProductIds.forEach((id) => {
      updateProduct(id, { isActive: active });
    });
    toast.success(`${selectedProductIds.length} products ${active ? 'activated' : 'deactivated'}`);
    setSelectedProductIds([]);
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedProductIds.length} selected products?`)) {
      selectedProductIds.forEach((id) => deleteProduct(id));
      toast.success(`${selectedProductIds.length} products deleted`);
      setSelectedProductIds([]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-outfit text-stone-900 tracking-tight">
            Products Catalog
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage your DIY paint kits, pricing, stock levels, imagery, and SEO metadata.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#C85A32] hover:bg-[#B84B24] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by title, slug, or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF5EE]/60 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs text-stone-500 font-semibold uppercase font-outfit">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-[#FAF5EE]/60 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs text-stone-500 font-semibold uppercase font-outfit">Stock:</span>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#FAF5EE]/60 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
            >
              <option value="all">All Levels</option>
              <option value="in_stock">In Stock (10+)</option>
              <option value="low_stock">Low Stock (&lt; 10)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedProductIds.length > 0 && (
          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 animate-in fade-in-0 duration-150">
            <span className="text-xs font-semibold text-[#C85A32]">
              {selectedProductIds.length} product(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkToggleActive(true)}
                className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                Mark Active
              </button>
              <button
                onClick={() => handleBulkToggleActive(false)}
                className="px-2.5 py-1 text-xs font-medium bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
              >
                Mark Inactive
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-body">
            <thead className="bg-[#FAF5EE] text-stone-600 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200/80">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={
                      filteredProducts.length > 0 &&
                      selectedProductIds.length === filteredProducts.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-stone-300 text-[#C85A32] focus:ring-[#C85A32]"
                  />
                </th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock Level</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.map((product) => {
                const isSelected = selectedProductIds.includes(product.id);
                const isLowStock = product.stockQuantity < 10 && product.stockQuantity > 0;
                const isOutOfStock = product.stockQuantity === 0;

                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-[#FAF5EE]/40 transition-colors ${
                      isSelected ? 'bg-[#FFF9F2]' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedProductIds((prev) =>
                            prev.includes(product.id)
                              ? prev.filter((id) => id !== product.id)
                              : [...prev, product.id]
                          );
                        }}
                        className="rounded border-stone-300 text-[#C85A32] focus:ring-[#C85A32]"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-xl bg-stone-100 relative overflow-hidden shrink-0 border border-stone-200">
                          <Image
                            src={product.images?.[0] || '/logo.png'}
                            alt={product.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-stone-900 truncate">{product.name}</div>
                          <div className="text-[11px] text-stone-400 font-mono truncate">
                            /{product.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-stone-600">
                      <span className="capitalize px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px] font-medium">
                        {product.categoryId.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold font-outfit text-stone-900">₹{product.price}</div>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <div className="text-[10px] text-stone-400 line-through">
                          ₹{product.compareAtPrice}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`font-mono font-bold ${
                            isOutOfStock
                              ? 'text-red-600'
                              : isLowStock
                              ? 'text-amber-600'
                              : 'text-stone-800'
                          }`}
                        >
                          {product.stockQuantity}
                        </span>
                        {isOutOfStock && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-semibold">
                            Out
                          </span>
                        )}
                        {isLowStock && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                            Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleToggleActive(product.id, product.isActive ?? true)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                          product.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                        title="Click to toggle store visibility"
                      >
                        {product.isActive !== false ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 text-stone-500 hover:text-[#C85A32] hover:bg-[#FFF9F2] rounded-lg transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setIsDeleteConfirmOpen(product.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm">No products found matching filters</p>
                    <p className="text-xs text-stone-400 mt-1">Try resetting your search query or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 font-body animate-in fade-in-0 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF5EE]">
              <div>
                <h3 className="font-outfit font-bold text-stone-900 text-lg">
                  {editingProduct ? 'Edit Product' : 'Create New Paint Kit Product'}
                </h3>
                <p className="text-xs text-stone-500">
                  Configure kit details, inventory thresholds, and SEO tags.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-stone-200 px-5 bg-white text-xs font-semibold">
              <button
                onClick={() => setModalTab('general')}
                className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'general'
                    ? 'border-[#C85A32] text-[#C85A32]'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                General Info
              </button>
              <button
                onClick={() => setModalTab('inventory')}
                className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'inventory'
                    ? 'border-[#C85A32] text-[#C85A32]'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                Inventory & Details
              </button>
              <button
                onClick={() => setModalTab('seo')}
                className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'seo'
                    ? 'border-[#C85A32] text-[#C85A32]'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                SEO & Metadata
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveProduct}>
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 text-xs">
                {modalTab === 'general' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Product Title</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none text-sm"
                        placeholder="e.g. T-Rex Dinosaur DIY Paint Kit"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">Selling Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                          className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">Compare At Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.compareAtPrice}
                          onChange={(e) => setFormData({ ...formData, compareAtPrice: Number(e.target.value) })}
                          className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">Category</label>
                        <select
                          value={formData.categoryId}
                          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">Collection</label>
                        <select
                          value={formData.collectionId}
                          onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                        >
                          {collections.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Image URL</label>
                      <input
                        type="text"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                        placeholder="/images/products/dino.jpg"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Short Description</label>
                      <input
                        type="text"
                        value={formData.shortDescription}
                        onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {modalTab === 'inventory' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">Physical Stock Quantity</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={formData.stockQuantity}
                          onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                          className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">Target Age Group</label>
                        <input
                          type="text"
                          value={formData.ageGroup}
                          onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                          placeholder="e.g. 5+ or 4-8 years"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Kit Contents</label>
                      <input
                        type="text"
                        value={formData.kitContents}
                        onChange={(e) => setFormData({ ...formData, kitContents: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                        placeholder="2 Plaster Figurines, 6 Paint Pots, 2 Brushes"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Full Description</label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none resize-none"
                      />
                    </div>

                    <div className="flex items-center space-x-6 pt-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="rounded text-[#C85A32] focus:ring-[#C85A32]"
                        />
                        <span className="font-semibold text-stone-800">Publish in Storefront (Active)</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isFeatured}
                          onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                          className="rounded text-[#C85A32] focus:ring-[#C85A32]"
                        />
                        <span className="font-semibold text-stone-800">Featured on Homepage</span>
                      </label>
                    </div>
                  </div>
                )}

                {modalTab === 'seo' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">URL Slug</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none font-mono"
                        placeholder="t-rex-dinosaur-paint-kit"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Meta Title</label>
                      <input
                        type="text"
                        value={formData.metaTitle}
                        onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                        placeholder="Buy T-Rex Dinosaur DIY Paint Kit for Kids | Rangaroo Store"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Meta Description</label>
                      <textarea
                        rows={2}
                        value={formData.metaDescription}
                        onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none resize-none"
                        placeholder="Safe, non-toxic handmade plaster paint kits. Free shipping over ₹499."
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Search Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                        placeholder="dinosaur, craft kit, birthday gift"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-[#FAF5EE] border-t border-stone-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-700 font-semibold rounded-xl text-xs border border-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C85A32] hover:bg-[#B84B24] text-white font-semibold rounded-xl text-xs transition-colors shadow-2xs"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setIsDeleteConfirmOpen(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-stone-200 p-5 z-10 text-xs font-body animate-in fade-in-0 zoom-in-95">
            <h4 className="font-outfit font-bold text-stone-900 text-base mb-1">Delete Product</h4>
            <p className="text-stone-500 mb-4">
              Are you sure you want to remove this product from the catalog? This action will remove it from all storefront collections.
            </p>
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(null)}
                className="px-3 py-1.5 bg-stone-100 text-stone-700 font-semibold rounded-lg hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(isDeleteConfirmOpen)}
                className="px-3 py-1.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
