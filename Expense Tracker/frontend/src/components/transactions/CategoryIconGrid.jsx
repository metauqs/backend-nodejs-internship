import React from 'react';
import {
  Utensils,
  Mic,
  Smartphone,
  ShoppingCart,
  BookOpen,
  Sparkles,
  Activity,
  Users,
  Bus,
  Shirt,
  Car,
  Wine,
  Flame,
  Headphones,
  Plane,
  HeartPulse,
  PawPrint,
  Wrench,
  Paintbrush,
  Home,
  Gift,
  Heart,
  Ticket,
  Cookie,
  Baby,
  Carrot,
  Apple,
  Settings,
  Check,
} from 'lucide-react';
import { EXPENSE_CATEGORY_ICONS } from '../../utils/constants';

// Map icon name string to Lucide component
const ICON_MAP = {
  Utensils: <Utensils size={22} />,
  Mic: <Mic size={22} />,
  Smartphone: <Smartphone size={22} />,
  ShoppingCart: <ShoppingCart size={22} />,
  BookOpen: <BookOpen size={22} />,
  Sparkles: <Sparkles size={22} />,
  Activity: <Activity size={22} />,
  Users: <Users size={22} />,
  Bus: <Bus size={22} />,
  Shirt: <Shirt size={22} />,
  Car: <Car size={22} />,
  Wine: <Wine size={22} />,
  Flame: <Flame size={22} />,
  Headphones: <Headphones size={22} />,
  Plane: <Plane size={22} />,
  HeartPulse: <HeartPulse size={22} />,
  PawPrint: <PawPrint size={22} />,
  Wrench: <Wrench size={22} />,
  Paintbrush: <Paintbrush size={22} />,
  Home: <Home size={22} />,
  Gift: <Gift size={22} />,
  Heart: <Heart size={22} />,
  Ticket: <Ticket size={22} />,
  Cookie: <Cookie size={22} />,
  Baby: <Baby size={22} />,
  Carrot: <Carrot size={22} />,
  Apple: <Apple size={22} />,
  Settings: <Settings size={22} />,
};

export const CategoryIconGrid = ({
  selectedCategory,
  onSelectCategory,
  error = '',
}) => {
  return (
    <div className="category-picker-wrapper">
      <div className="category-picker-header">
        <label className="form-label" style={{ marginBottom: 0 }}>
          Select Category <span style={{ color: '#DC2626' }}>*</span>
        </label>
        {selectedCategory && (
          <span className="selected-category-pill">
            <Check size={12} />
            <span>Selected: <strong>{selectedCategory}</strong></span>
          </span>
        )}
      </div>

      <div className="category-4col-grid">
        {EXPENSE_CATEGORY_ICONS.map((cat) => {
          const isSelected = selectedCategory?.toLowerCase() === cat.name.toLowerCase();
          const IconElement = ICON_MAP[cat.icon] || <Utensils size={22} />;

          return (
            <button
              key={cat.id}
              type="button"
              className={`category-grid-item ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.name)}
              title={cat.name}
              aria-pressed={isSelected}
            >
              <div className="category-circle-icon">
                {IconElement}
              </div>
              <span className="category-grid-label">
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>

      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export default CategoryIconGrid;
