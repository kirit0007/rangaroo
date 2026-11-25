'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  FolderKanban,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Layers,
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { collections as initialCollections, products as initialProducts } from '@/data/products';
import { Collection } from '@/types';

interface CollectionItem extends Collection {
  productCount: number;
  isVisible: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export default function CollectionsAdminPage() {
  const [collectionsList, setCollectionsList] = useState<CollectionItem[]>(() => {
    return initialCollections.map((col) => ({
      ...col,
      productCount: initialProducts.filter((p) => p.collectionId === col.id).length,
      isVisible: true,
      metaTitle: `${col.name} Paint Kits | Rangaroo Store`,
      metaDescription: col.description,
    }));
  });

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionItem | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    emoji: '🎨',
    description: '',
    image: '/images/collections/dinosaur.jpg',
    displayOrder: 1,
    isVisible: true,
    metaTitle: '',
    metaDescription: '',
    assignedProductIds: [] as string[],
  });

  const filteredCollections = useMemo(() => {
    const q = search.toLowerCase().trim();
    return collectionsList.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }, [collectionsList, search]);

  const handleOpenAdd = () => {
    setEditingCollection(null);
    setFormData({
      name: '',
      slug: '',
      emoji: '🎨',
      description: 'Explore vibrant handcrafted DIY paint kits curated for kids.',
      image: '/images/collections/dinosaur.jpg',
      displayOrder: collectionsList.length + 1,
      isVisible: true,
      metaTitle: '',
      metaDescription: '',
      assignedProductIds: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (col: CollectionItem) => {
    setEditingCollection(col);
    const assignedIds = initialProducts
      .filter((p) => p.collectionId === col.id)
      .map((p) => p.id);

    setFormData({
      name: col.name,
      slug: col.slug,
      emoji: col.emoji || '🎨',
      description: col.description,
      image: col.image || '/images/collections/dinosaur.jpg',
      displayOrder: col.displayOrder,
      isVisible: col.isVisible,
      metaTitle: col.metaTitle || '',
      metaDescription: col.metaDescription || '',
      assignedProductIds: assignedIds,
    });
    setIsModalOpen(true);
  };

  const handleSaveCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Collection title is required');
      return;
    }

    const slug =
      formData.slug.trim() ||
      formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (editingCollection) {
      setCollectionsList((prev) =>
        prev.map((c) =>
          c.id === editingCollection.id
            ? {
                ...c,
                name: formData.name,
                slug,
                emoji: formData.emoji,
                description: formData.description,
                image: formData.image,
                displayOrder: Number(formData.displayOrder),
                isVisible: formData.isVisible,
                metaTitle: formData.metaTitle,
                metaDescription: formData.metaDescription,
                productCount: formData.assignedProductIds.length || c.productCount,
              }
            : c
        )
      );
      toast.success('Collection updated successfully!');
    } else {
      const newCol: CollectionItem = {
        id: slug,
        name: formData.name,
        slug,
        emoji: formData.emoji,
        description: formData.description,
        image: formData.image,
        displayOrder: Number(formData.displayOrder),
        isVisible: formData.isVisible,
        productCount: formData.assignedProductIds.length || 0,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
      };
      setCollectionsList((prev) => [...prev, newCol]);
      toast.success('New collection created!');
    }

    setIsModalOpen(false);
  };

  const handleToggleVisibility = (id: string) => {
    setCollectionsList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isVisible: !c.isVisible } : c))
    );
    toast.success('Collection visibility toggled');
  };

  const handleDelete = (id: string) => {
    setCollectionsList((prev) => prev.filter((c) => c.id !== id));
    setIsDeleteConfirmOpen(null);
    toast.success('Collection removed');
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= collectionsList.length) return;

    const updated = [...collectionsList];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // re-number display orders
    const reordered = updated.map((c, i) => ({ ...c, displayOrder: i + 1 }));
    setCollectionsList(reordered);
    toast.success('Collection merchandising order updated');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-outfit text-stone-900 tracking-tight">
            Collections & Themes
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Curate themed product groupings (Dinosaurs, Space, Animals), display order, and merchandising priority.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#C85A32] hover:bg-[#B84B24] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search collections by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FAF5EE]/60 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
          />
        </div>
        <div className="text-xs text-stone-500 font-medium hidden sm:block">
          {filteredCollections.length} themed collections
        </div>
      </div>

      {/* Collections Grid / Table */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-body">
            <thead className="bg-[#FAF5EE] text-stone-600 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200/80">
              <tr>
                <th className="px-4 py-3 w-16 text-center">Order</th>
                <th className="px-4 py-3">Collection</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredCollections.map((col, index) => {
                return (
                  <tr key={col.id} className="hover:bg-[#FAF5EE]/40 transition-colors">
                    {/* Reorder Buttons */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleMoveOrder(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-stone-400 hover:text-stone-800 disabled:opacity-30 rounded hover:bg-stone-100"
                          title="Move Up"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono font-bold text-stone-700 w-4">{col.displayOrder}</span>
                        <button
                          onClick={() => handleMoveOrder(index, 'down')}
                          disabled={index === collectionsList.length - 1}
                          className="p-1 text-stone-400 hover:text-stone-800 disabled:opacity-30 rounded hover:bg-stone-100"
                          title="Move Down"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Collection Thumbnail & Name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#FFF9F2] to-amber-100 border border-amber-900/10 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                          {col.emoji || '🎨'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-stone-900 text-sm">{col.name}</div>
                          <div className="text-[11px] text-stone-400 font-mono">/{col.slug}</div>
                        </div>
                      </div>
                    </td>

                    {/* Product count */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FFF9F2] text-[#C85A32] border border-[#C85A32]/20">
                        {col.productCount} kit(s)
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3.5 text-stone-600 max-w-xs truncate">
                      {col.description}
                    </td>

                    {/* Visibility status */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleToggleVisibility(col.id)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                          col.isVisible
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                      >
                        {col.isVisible ? (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Visible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleOpenEdit(col)}
                          className="p-1.5 text-stone-500 hover:text-[#C85A32] hover:bg-[#FFF9F2] rounded-lg transition-colors cursor-pointer"
                          title="Edit Collection"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setIsDeleteConfirmOpen(col.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Collection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCollections.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm">No collections found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 font-body animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF5EE]">
              <div>
                <h3 className="font-outfit font-bold text-stone-900 text-base">
                  {editingCollection ? 'Edit Collection' : 'Create New Collection'}
                </h3>
                <p className="text-xs text-stone-500">
                  Configure storefront theme, emoji icon, and SEO parameters.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCollection}>
              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-3">
                    <label className="block font-semibold text-stone-700 mb-1">Collection Title</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none text-sm"
                      placeholder="e.g. Dinosaur Explorer Collection"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Emoji Icon</label>
                    <input
                      type="text"
                      value={formData.emoji}
                      onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none text-center text-lg"
                      placeholder="🦕"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none font-mono"
                    placeholder="dinosaur-collection"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none resize-none"
                    placeholder="Detailed introduction displayed on the collection page."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Display Priority Order</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Banner Image URL</label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isVisible}
                      onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                      className="rounded text-[#C85A32] focus:ring-[#C85A32]"
                    />
                    <span className="font-semibold text-stone-800">Publish collection to storefront navigation</span>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-[#FAF5EE] border-t border-stone-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-700 font-semibold rounded-xl text-xs border border-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C85A32] hover:bg-[#B84B24] text-white font-semibold rounded-xl text-xs transition-colors shadow-2xs"
                >
                  Save Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setIsDeleteConfirmOpen(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-stone-200 p-5 z-10 text-xs font-body animate-in fade-in-0 zoom-in-95">
            <h4 className="font-outfit font-bold text-stone-900 text-base mb-1">Delete Collection</h4>
            <p className="text-stone-500 mb-4">
              Are you sure you want to delete this collection? Products assigned to it will remain in the catalog.
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
