import React, { useState, useEffect } from 'react';
import { DigitalMenu, MenuCategory, MenuItem, BusinessProfile } from '../../types';
import {
  Utensils,
  Plus,
  Trash2,
  Edit2,
  Check,
  Search,
  Sparkles,
  Eye,
  Save,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
} from 'lucide-react';

interface DigitalMenuBuilderProps {
  business: BusinessProfile;
  onPreviewCustomerMenu: () => void;
}

export const DigitalMenuBuilder: React.FC<DigitalMenuBuilderProps> = ({
  business,
  onPreviewCustomerMenu,
}) => {
  const [menu, setMenu] = useState<DigitalMenu | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // New Category State
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);

  // New Item State / Form
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [itemPrice, setItemPrice] = useState<number>(0);
  const [itemDesc, setItemDesc] = useState<string>('');
  const [itemDietary, setItemDietary] = useState<'veg' | 'non_veg' | 'egg' | 'vegan'>('veg');
  const [itemIsSpecial, setItemIsSpecial] = useState<boolean>(false);

  // Public API (TheMealDB) auto-suggest state
  const [apiSearchQuery, setApiSearchQuery] = useState<string>('');
  const [apiSearchResults, setApiSearchResults] = useState<any[]>([]);
  const [searchingApi, setSearchingApi] = useState<boolean>(false);

  // Fetch current menu from server
  useEffect(() => {
    const bizId = business.id || 'chai-shai-cafe';
    setLoading(true);
    fetch(`/api/public/menu/${bizId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Menu not found');
        return res.json();
      })
      .then((data) => {
        if (data && data.menu) {
          setMenu(data.menu);
          if (data.menu.categories.length > 0) {
            setSelectedCategoryId(data.menu.categories[0].id);
          }
        }
      })
      .catch((err) => {
        console.warn('Initializing default menu:', err);
      })
      .finally(() => setLoading(false));
  }, [business.id]);

  // Handle Save Menu to Backend
  const handleSaveMenu = async () => {
    if (!menu) return;
    setSaving(true);
    setSaveSuccess(null);

    try {
      const bizId = business.id || 'chai-shai-cafe';
      const res = await fetch(`/api/businesses/${bizId}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menu),
      });

      if (!res.ok) throw new Error('Failed to save menu changes.');
      setSaveSuccess('Menu saved and live on customer QR page!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error saving menu.');
    } finally {
      setSaving(false);
    }
  };

  // Category Actions
  const handleAddCategory = () => {
    if (!newCategoryName.trim() || !menu) return;
    const catId = `cat-${Date.now()}`;
    const newCat: MenuCategory = {
      id: catId,
      name: newCategoryName.trim(),
      sortOrder: menu.categories.length + 1,
    };

    setMenu({
      ...menu,
      categories: [...menu.categories, newCat],
    });
    setNewCategoryName('');
    setIsAddingCategory(false);
    setSelectedCategoryId(catId);
  };

  const handleDeleteCategory = (catId: string) => {
    if (!menu) return;
    if (confirm('Delete this category and all its items?')) {
      setMenu({
        ...menu,
        categories: menu.categories.filter((c) => c.id !== catId),
        items: menu.items.filter((i) => i.categoryId !== catId),
      });
      if (selectedCategoryId === catId && menu.categories.length > 1) {
        setSelectedCategoryId(menu.categories[0].id);
      }
    }
  };

  // Item Actions
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menu || !itemName.trim() || !selectedCategoryId) return;

    if (editingItem) {
      // Update existing item
      const updatedItems = menu.items.map((i) =>
        i.id === editingItem.id
          ? {
              ...i,
              categoryId: selectedCategoryId,
              name: itemName.trim(),
              price: Number(itemPrice),
              description: itemDesc.trim(),
              dietaryTag: itemDietary,
              isSpecial: itemIsSpecial,
            }
          : i
      );
      setMenu({ ...menu, items: updatedItems });
      setEditingItem(null);
    } else {
      // Create new item
      const newItem: MenuItem = {
        id: `item-${Date.now()}`,
        categoryId: selectedCategoryId,
        name: itemName.trim(),
        price: Number(itemPrice),
        description: itemDesc.trim(),
        isAvailable: true,
        dietaryTag: itemDietary,
        isSpecial: itemIsSpecial,
      };
      setMenu({ ...menu, items: [...menu.items, newItem] });
    }

    // Reset inputs
    setItemName('');
    setItemPrice(0);
    setItemDesc('');
    setItemIsSpecial(false);
  };

  const handleToggleAvailability = (itemId: string) => {
    if (!menu) return;
    setMenu({
      ...menu,
      items: menu.items.map((i) => (i.id === itemId ? { ...i, isAvailable: !i.isAvailable } : i)),
    });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!menu) return;
    setMenu({
      ...menu,
      items: menu.items.filter((i) => i.id !== itemId),
    });
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setSelectedCategoryId(item.categoryId);
    setItemName(item.name);
    setItemPrice(item.price);
    setItemDesc(item.description);
    setItemDietary(item.dietaryTag || 'veg');
    setItemIsSpecial(Boolean(item.isSpecial));
  };

  // Dish Auto-Search via TheMealDB API
  const handleSearchApiDishes = async () => {
    if (!apiSearchQuery.trim()) return;
    setSearchingApi(true);
    try {
      const res = await fetch(`/api/integrations/food-search?query=${encodeURIComponent(apiSearchQuery)}`);
      const data = await res.json();
      setApiSearchResults(data.results || []);
    } catch (err) {
      console.error('Food search error:', err);
    } finally {
      setSearchingApi(false);
    }
  };

  const handleSelectSuggestedDish = (dish: any) => {
    setItemName(dish.name);
    setItemDesc(dish.description);
    setApiSearchResults([]);
    setApiSearchQuery('');
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-sm">Loading digital menu...</div>;
  }

  if (!menu) {
    return <div className="p-12 text-center text-red-500 text-sm">Menu could not be loaded.</div>;
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-sm">
              <Utensils className="w-4 h-4" />
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
              Digital Menu & Catalog Builder
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Build categories, set INR prices, toggle dish availability, and preview on mobile in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onPreviewCustomerMenu}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-orange-600" />
            <span>Preview Mobile Menu</span>
          </button>

          <button
            onClick={handleSaveMenu}
            disabled={saving}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 text-yellow-300" />
            <span>{saving ? 'Saving...' : 'Save & Publish Live'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Categories Horizontal Tabs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Menu Categories ({menu.categories.length})
          </label>
          {!isAddingCategory ? (
            <button
              onClick={() => setIsAddingCategory(true)}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category Name (e.g. Desserts)"
                className="px-3 py-1 text-xs rounded-lg border border-slate-300"
              />
              <button
                onClick={handleAddCategory}
                className="px-3 py-1 bg-orange-600 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={() => setIsAddingCategory(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {menu.categories.map((cat) => {
            const count = menu.items.filter((i) => i.categoryId === cat.id).length;
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
                  selectedCategoryId === cat.id
                    ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{cat.name}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15 font-mono">
                  {count}
                </span>
                {menu.categories.length > 1 && selectedCategoryId === cat.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat.id);
                    }}
                    className="hover:text-red-200 ml-1"
                    title="Delete category"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ADD / EDIT ITEM FORM (5 cols) */}
        <div className="lg:col-span-5 bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <span>{editingItem ? 'Edit Dish / Item' : 'Add New Item'}</span>
            </h3>
            {editingItem && (
              <button
                onClick={() => {
                  setEditingItem(null);
                  setItemName('');
                  setItemPrice(0);
                  setItemDesc('');
                }}
                className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
          </div>

          {/* Dish Auto-search via Public API (TheMealDB) */}
          <div className="bg-white p-3 rounded-xl border border-orange-200/60 shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Auto-Fill from Food Database (Free Public API)</span>
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={apiSearchQuery}
                onChange={(e) => setApiSearchQuery(e.target.value)}
                placeholder="Search dish (e.g. Biryani, Samosa, Pasta)..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
              />
              <button
                type="button"
                onClick={handleSearchApiDishes}
                disabled={searchingApi}
                className="px-3 py-1.5 bg-orange-600 text-white font-bold text-xs rounded-lg hover:bg-orange-700 cursor-pointer disabled:opacity-50"
              >
                {searchingApi ? '...' : 'Search'}
              </button>
            </div>

            {apiSearchResults.length > 0 && (
              <div className="space-y-1.5 pt-1 max-h-36 overflow-y-auto">
                {apiSearchResults.map((meal, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSuggestedDish(meal)}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-orange-50 text-xs cursor-pointer border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{meal.name}</p>
                      <p className="text-[10px] text-slate-500">{meal.category} • {meal.area}</p>
                    </div>
                    <span className="text-[10px] text-orange-600 font-bold">Select →</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSaveItem} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dish / Item Name *</label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Masala Kulhad Chai / Paneer Butter Masala"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹ INR) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={itemPrice || ''}
                  onChange={(e) => setItemPrice(Number(e.target.value))}
                  placeholder="e.g. 49"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dietary Tag</label>
                <select
                  value={itemDietary}
                  onChange={(e) => setItemDietary(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                >
                  <option value="veg">🟢 Pure Veg</option>
                  <option value="non_veg">🔴 Non-Veg</option>
                  <option value="egg">🟡 Egg</option>
                  <option value="vegan">🌱 Vegan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Ingredients</label>
              <textarea
                rows={2}
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
                placeholder="Brief description of flavors, toppings or ingredients..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isSpecial"
                checked={itemIsSpecial}
                onChange={(e) => setItemIsSpecial(e.target.checked)}
                className="rounded-md border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
              />
              <label htmlFor="isSpecial" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Mark as Chef's Special / Bestseller (✨ Badge)
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              {editingItem ? 'Update Item' : 'Add Item to Category'}
            </button>
          </form>
        </div>

        {/* ITEMS LIST IN SELECTED CATEGORY (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-700">
              Items in Selected Category ({menu.items.filter((i) => i.categoryId === selectedCategoryId).length})
            </span>
            <span className="text-[11px] text-slate-400">Click switch to mark item Out of Stock</span>
          </div>

          {menu.items.filter((i) => i.categoryId === selectedCategoryId).length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No items in this category yet. Use the form on the left to add items.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {menu.items
                .filter((i) => i.categoryId === selectedCategoryId)
                .map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      item.isAvailable ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {item.dietaryTag === 'non_veg' ? '🔴' : item.dietaryTag === 'egg' ? '🟡' : '🟢'}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                        {item.isSpecial && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                            ★ Special
                          </span>
                        )}
                        {!item.isAvailable && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                      )}
                      <p className="font-extrabold text-sm text-slate-900 pt-0.5">₹{item.price}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Availability Toggle */}
                      <button
                        onClick={() => handleToggleAvailability(item.id)}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                        title={item.isAvailable ? 'Mark Out of Stock' : 'Mark Available'}
                      >
                        {item.isAvailable ? (
                          <ToggleRight className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-400" />
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleEditItem(item)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
