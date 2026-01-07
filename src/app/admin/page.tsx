"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Loader2,
  RotateCcw,
  AlertCircle,
  Check,
  ChefHat,
  PackagePlus,
  Droplet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Category, FoodItem, FoodItemPreparation, FoodItemAddOn, FoodItemCustomLiter, MeasurementType } from "@/types";
import {
  getCategories,
  getFoodItems,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  restoreFoodItem,
  permanentlyDeleteFoodItem,
  getPreparations,
  createPreparation,
  updatePreparation,
  deletePreparation,
  getAddOns,
  createAddOn,
  updateAddOn,
  deleteAddOn,
  getCustomLiters,
  createCustomLiter,
  updateCustomLiter,
  deleteCustomLiter,
} from "@/lib/services/admin-service";
import { AuthGuard } from "@/components/auth/AuthGuard";

// Hebrew labels
const LABELS = {
  title: "ניהול פריטי מזון",
  back: "חזרה",
  addItem: "הוסף פריט",
  newItemName: "שם הפריט החדש",
  measurementType: "סוג מדידה",
  measurementTypes: {
    liters: "ליטרים (1.5, 2.5, 3, 4.5)",
    size: "גודל (ג׳ גדול / ק׳ קטן)",
    none: "כמות רגילה",
  },
  save: "שמור",
  cancel: "ביטול",
  delete: "מחק",
  restore: "שחזר",
  edit: "ערוך",
  confirmDelete: "האם למחוק את הפריט?",
  noItems: "אין פריטים בקטגוריה זו",
  loading: "טוען...",
  saving: "שומר...",
  active: "פעיל",
  inactive: "לא פעיל",
  showInactive: "הצג פריטים לא פעילים",
  hideInactive: "הסתר פריטים לא פעילים",
  // Preparations
  preparations: "אפשרויות הכנה",
  addPreparation: "הוסף אפשרות",
  noPreparations: "אין אפשרויות הכנה",
  preparationName: "שם האפשרות",
  managePreparations: "ניהול אפשרויות הכנה",
  // Add-ons (תוספות אופציונליות)
  addOns: "תוספות אופציונליות",
  addAddOn: "הוסף תוספת",
  noAddOns: "אין תוספות אופציונליות",
  addOnName: "שם התוספת",
  manageAddOns: "ניהול תוספות",
  addOnMeasurementType: "סוג מדידה לתוספת",
  // Custom liters (גדלי ליטר מותאמים)
  customLiters: "גדלי ליטר מותאמים",
  addCustomLiter: "הוסף גודל",
  noCustomLiters: "אין גדלים מותאמים",
  customLiterSize: "גודל (ליטר)",
  customLiterLabel: "תווית",
  manageCustomLiters: "ניהול גדלי ליטר",
};

// Measurement type options
const MEASUREMENT_OPTIONS: { value: MeasurementType; label: string }[] = [
  { value: "liters", label: LABELS.measurementTypes.liters },
  { value: "size", label: LABELS.measurementTypes.size },
  { value: "none", label: LABELS.measurementTypes.none },
];

export default function AdminPage() {
  const router = useRouter();

  // Data state
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [foodItems, setFoodItems] = React.useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // UI state
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [showInactive, setShowInactive] = React.useState(false);

  // Add new item state
  const [isAddingItem, setIsAddingItem] = React.useState(false);
  const [newItemName, setNewItemName] = React.useState("");
  const [newItemMeasurementType, setNewItemMeasurementType] = React.useState<MeasurementType>("none");
  const [isSaving, setIsSaving] = React.useState(false);

  // Edit item state
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [editingMeasurementType, setEditingMeasurementType] = React.useState<MeasurementType>("none");
  const [editingPortionMultiplier, setEditingPortionMultiplier] = React.useState<string>("");
  const [editingPortionUnit, setEditingPortionUnit] = React.useState<string>("");

  // Error/success state
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Preparations state
  const [preparationsModalItem, setPreparationsModalItem] = React.useState<FoodItem | null>(null);
  const [preparations, setPreparations] = React.useState<FoodItemPreparation[]>([]);
  const [isLoadingPreparations, setIsLoadingPreparations] = React.useState(false);
  const [newPreparationName, setNewPreparationName] = React.useState("");
  const [editingPrepId, setEditingPrepId] = React.useState<string | null>(null);
  const [editingPrepName, setEditingPrepName] = React.useState("");

  // Add-ons state (תוספות אופציונליות)
  const [addOnsModalItem, setAddOnsModalItem] = React.useState<FoodItem | null>(null);
  const [addOns, setAddOns] = React.useState<FoodItemAddOn[]>([]);
  const [isLoadingAddOns, setIsLoadingAddOns] = React.useState(false);
  const [newAddOnName, setNewAddOnName] = React.useState("");
  const [newAddOnMeasurementType, setNewAddOnMeasurementType] = React.useState<MeasurementType>("liters");
  const [newAddOnLinkedFoodItemId, setNewAddOnLinkedFoodItemId] = React.useState<string | null>(null);
  const [editingAddOnId, setEditingAddOnId] = React.useState<string | null>(null);
  const [editingAddOnName, setEditingAddOnName] = React.useState("");
  const [editingAddOnMeasurementType, setEditingAddOnMeasurementType] = React.useState<MeasurementType>("liters");
  const [editingAddOnLinkedFoodItemId, setEditingAddOnLinkedFoodItemId] = React.useState<string | null>(null);

  // Custom liters state (גדלי ליטר מותאמים)
  const [customLitersModalItem, setCustomLitersModalItem] = React.useState<FoodItem | null>(null);
  const [customLiters, setCustomLiters] = React.useState<FoodItemCustomLiter[]>([]);
  const [isLoadingCustomLiters, setIsLoadingCustomLiters] = React.useState(false);
  const [newCustomLiterSize, setNewCustomLiterSize] = React.useState("");
  const [newCustomLiterLabel, setNewCustomLiterLabel] = React.useState("");
  const [editingCustomLiterId, setEditingCustomLiterId] = React.useState<string | null>(null);
  const [editingCustomLiterSize, setEditingCustomLiterSize] = React.useState("");
  const [editingCustomLiterLabel, setEditingCustomLiterLabel] = React.useState("");

  const loadCategories = React.useCallback(async () => {
    setIsLoading(true);
    const data = await getCategories();
    setCategories(data);
    if (data.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(data[0].id);
    }
    setIsLoading(false);
  }, [selectedCategoryId]);

  const loadFoodItems = React.useCallback(async (categoryId: string) => {
    const data = await getFoodItems(categoryId);
    setFoodItems(data);
  }, []);

  // Load categories on mount
  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Load food items when category changes
  React.useEffect(() => {
    if (selectedCategoryId) {
      loadFoodItems(selectedCategoryId);
    }
  }, [loadFoodItems, selectedCategoryId]);

  // Clear messages after delay
  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleAddItem = async () => {
    if (!newItemName.trim() || !selectedCategoryId) return;

    setIsSaving(true);
    setError(null);

    // Determine measurement type based on category
    const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
    let measurementType = newItemMeasurementType;
    
    // For categories other than salads and extras, force 'none'
    if (selectedCategory?.name_en !== "salads" && selectedCategory?.name_en !== "extras") {
      measurementType = "none";
    }

    const result = await createFoodItem({
      name: newItemName.trim(),
      category_id: selectedCategoryId,
      measurement_type: measurementType,
    });

    setIsSaving(false);

    if (result.success) {
      setNewItemName("");
      setNewItemMeasurementType("none");
      setIsAddingItem(false);
      setSuccessMessage(`הפריט "${newItemName}" נוסף בהצלחה`);
      loadFoodItems(selectedCategoryId);
    } else {
      setError(result.error || "שגיאה בהוספת הפריט");
    }
  };

  const handleUpdateItem = async (itemId: string) => {
    if (!editingName.trim()) return;

    setIsSaving(true);
    setError(null);

    const portionMultiplier = editingPortionMultiplier.trim() 
      ? parseFloat(editingPortionMultiplier) 
      : null;

    const result = await updateFoodItem({
      id: itemId,
      name: editingName.trim(),
      measurement_type: editingMeasurementType,
      portion_multiplier: portionMultiplier,
      portion_unit: editingPortionUnit.trim() || null,
    });

    setIsSaving(false);

    if (result.success) {
      setEditingItemId(null);
      setEditingPortionMultiplier("");
      setEditingPortionUnit("");
      setSuccessMessage("הפריט עודכן בהצלחה");
      if (selectedCategoryId) {
        loadFoodItems(selectedCategoryId);
      }
    } else {
      setError(result.error || "שגיאה בעדכון הפריט");
    }
  };

  const handleDeleteItem = async (item: FoodItem) => {
    if (!confirm(`האם למחוק את "${item.name}"?`)) return;

    setError(null);
    const result = await deleteFoodItem(item.id);

    if (result.success) {
      setSuccessMessage(`הפריט "${item.name}" הועבר ללא פעילים`);
      if (selectedCategoryId) {
        loadFoodItems(selectedCategoryId);
      }
    } else {
      setError(result.error || "שגיאה במחיקת הפריט");
    }
  };

  const handlePermanentDelete = async (item: FoodItem) => {
    if (!confirm(`האם למחוק לצמיתות את "${item.name}"? פעולה זו לא ניתנת לביטול.`)) return;

    setError(null);
    const result = await permanentlyDeleteFoodItem(item.id);

    if (result.success) {
      setSuccessMessage(`הפריט "${item.name}" נמחק לצמיתות`);
      if (selectedCategoryId) {
        loadFoodItems(selectedCategoryId);
      }
    } else {
      setError(result.error || "שגיאה במחיקת הפריט");
    }
  };

  const handleRestoreItem = async (item: FoodItem) => {
    setError(null);
    const result = await restoreFoodItem(item.id);

    if (result.success) {
      setSuccessMessage(`הפריט "${item.name}" שוחזר`);
      if (selectedCategoryId) {
        loadFoodItems(selectedCategoryId);
      }
    } else {
      setError(result.error || "שגיאה בשחזור הפריט");
    }
  };

  const startEditing = (item: FoodItem) => {
    setEditingItemId(item.id);
    setEditingName(item.name);
    setEditingMeasurementType(item.measurement_type || "none");
    setEditingPortionMultiplier(item.portion_multiplier?.toString() || "");
    setEditingPortionUnit(item.portion_unit || "");
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setEditingName("");
    setEditingMeasurementType("none");
    setEditingPortionMultiplier("");
    setEditingPortionUnit("");
  };

  // Preparations handlers
  const openPreparationsModal = async (item: FoodItem) => {
    setPreparationsModalItem(item);
    setIsLoadingPreparations(true);
    const preps = await getPreparations(item.id);
    setPreparations(preps);
    setIsLoadingPreparations(false);
  };

  const closePreparationsModal = () => {
    setPreparationsModalItem(null);
    setPreparations([]);
    setNewPreparationName("");
    setEditingPrepId(null);
    setEditingPrepName("");
  };

  const handleAddPreparation = async () => {
    if (!newPreparationName.trim() || !preparationsModalItem) return;

    setIsSaving(true);
    const result = await createPreparation({
      parent_food_item_id: preparationsModalItem.id,
      name: newPreparationName.trim(),
    });
    setIsSaving(false);

    if (result.success) {
      setNewPreparationName("");
      setSuccessMessage(`אפשרות "${newPreparationName}" נוספה בהצלחה`);
      const preps = await getPreparations(preparationsModalItem.id);
      setPreparations(preps);
    } else {
      setError(result.error || "שגיאה בהוספת האפשרות");
    }
  };

  const handleUpdatePreparation = async (prepId: string) => {
    if (!editingPrepName.trim()) return;

    setIsSaving(true);
    const result = await updatePreparation({
      id: prepId,
      name: editingPrepName.trim(),
    });
    setIsSaving(false);

    if (result.success) {
      setEditingPrepId(null);
      setEditingPrepName("");
      setSuccessMessage("האפשרות עודכנה בהצלחה");
      if (preparationsModalItem) {
        const preps = await getPreparations(preparationsModalItem.id);
        setPreparations(preps);
      }
    } else {
      setError(result.error || "שגיאה בעדכון האפשרות");
    }
  };

  const handleDeletePreparation = async (prep: FoodItemPreparation) => {
    if (!confirm(`האם למחוק את "${prep.name}"?`)) return;

    const result = await deletePreparation(prep.id);

    if (result.success) {
      setSuccessMessage(`האפשרות "${prep.name}" נמחקה`);
      if (preparationsModalItem) {
        const preps = await getPreparations(preparationsModalItem.id);
        setPreparations(preps);
      }
    } else {
      setError(result.error || "שגיאה במחיקת האפשרות");
    }
  };

  // Add-ons handlers (תוספות אופציונליות)
  const openAddOnsModal = async (item: FoodItem) => {
    setAddOnsModalItem(item);
    setIsLoadingAddOns(true);
    const itemAddOns = await getAddOns(item.id);
    setAddOns(itemAddOns);
    setIsLoadingAddOns(false);
  };

  const closeAddOnsModal = () => {
    setAddOnsModalItem(null);
    setAddOns([]);
    setNewAddOnName("");
    setNewAddOnMeasurementType("liters");
    setNewAddOnLinkedFoodItemId(null);
    setEditingAddOnId(null);
    setEditingAddOnName("");
    setEditingAddOnMeasurementType("liters");
    setEditingAddOnLinkedFoodItemId(null);
  };

  const handleAddAddOn = async () => {
    if (!newAddOnName.trim() || !addOnsModalItem) return;

    setIsSaving(true);
    const result = await createAddOn({
      parent_food_item_id: addOnsModalItem.id,
      name: newAddOnName.trim(),
      measurement_type: newAddOnMeasurementType,
      linked_food_item_id: newAddOnLinkedFoodItemId,
    });
    setIsSaving(false);

    if (result.success) {
      setNewAddOnName("");
      setNewAddOnMeasurementType("liters");
      setNewAddOnLinkedFoodItemId(null);
      setSuccessMessage(`התוספת "${newAddOnName}" נוספה בהצלחה`);
      const itemAddOns = await getAddOns(addOnsModalItem.id);
      setAddOns(itemAddOns);
    } else {
      setError(result.error || "שגיאה בהוספת התוספת");
    }
  };

  const handleUpdateAddOn = async (addOnId: string) => {
    if (!editingAddOnName.trim()) return;

    setIsSaving(true);
    const result = await updateAddOn({
      id: addOnId,
      name: editingAddOnName.trim(),
      measurement_type: editingAddOnMeasurementType,
      linked_food_item_id: editingAddOnLinkedFoodItemId,
    });
    setIsSaving(false);

    if (result.success) {
      setEditingAddOnId(null);
      setEditingAddOnName("");
      setEditingAddOnMeasurementType("liters");
      setEditingAddOnLinkedFoodItemId(null);
      setSuccessMessage("התוספת עודכנה בהצלחה");
      if (addOnsModalItem) {
        const itemAddOns = await getAddOns(addOnsModalItem.id);
        setAddOns(itemAddOns);
      }
    } else {
      setError(result.error || "שגיאה בעדכון התוספת");
    }
  };

  const handleDeleteAddOn = async (addOn: FoodItemAddOn) => {
    if (!confirm(`האם למחוק את "${addOn.name}"?`)) return;

    const result = await deleteAddOn(addOn.id);

    if (result.success) {
      setSuccessMessage(`התוספת "${addOn.name}" נמחקה`);
      if (addOnsModalItem) {
        const itemAddOns = await getAddOns(addOnsModalItem.id);
        setAddOns(itemAddOns);
      }
    } else {
      setError(result.error || "שגיאה במחיקת התוספת");
    }
  };

  // Get measurement type label for add-ons
  const getAddOnMeasurementLabel = (type: MeasurementType) => {
    switch (type) {
      case "liters":
        return "ליטרים";
      case "none":
        return "כמות רגילה";
      default:
        return "כמות";
    }
  };

  // Custom liters handlers (גדלי ליטר מותאמים)
  const openCustomLitersModal = async (item: FoodItem) => {
    setCustomLitersModalItem(item);
    setIsLoadingCustomLiters(true);
    const itemCustomLiters = await getCustomLiters(item.id);
    setCustomLiters(itemCustomLiters);
    setIsLoadingCustomLiters(false);
  };

  const closeCustomLitersModal = () => {
    setCustomLitersModalItem(null);
    setCustomLiters([]);
    setNewCustomLiterSize("");
    setNewCustomLiterLabel("");
    setEditingCustomLiterId(null);
    setEditingCustomLiterSize("");
    setEditingCustomLiterLabel("");
  };

  const handleAddCustomLiter = async () => {
    if (!newCustomLiterSize.trim() || !newCustomLiterLabel.trim() || !customLitersModalItem) return;

    const size = parseFloat(newCustomLiterSize);
    if (isNaN(size) || size <= 0) {
      setError("גודל חייב להיות מספר חיובי");
      return;
    }

    setIsSaving(true);
    const result = await createCustomLiter({
      food_item_id: customLitersModalItem.id,
      size: size,
      label: newCustomLiterLabel.trim(),
    });
    setIsSaving(false);

    if (result.success) {
      setNewCustomLiterSize("");
      setNewCustomLiterLabel("");
      setSuccessMessage(`גודל ${newCustomLiterLabel} נוסף בהצלחה`);
      const itemCustomLiters = await getCustomLiters(customLitersModalItem.id);
      setCustomLiters(itemCustomLiters);
    } else {
      setError(result.error || "שגיאה בהוספת הגודל");
    }
  };

  const handleUpdateCustomLiter = async (literId: string) => {
    if (!editingCustomLiterSize.trim() || !editingCustomLiterLabel.trim()) return;

    const size = parseFloat(editingCustomLiterSize);
    if (isNaN(size) || size <= 0) {
      setError("גודל חייב להיות מספר חיובי");
      return;
    }

    setIsSaving(true);
    const result = await updateCustomLiter({
      id: literId,
      size: size,
      label: editingCustomLiterLabel.trim(),
    });
    setIsSaving(false);

    if (result.success) {
      setEditingCustomLiterId(null);
      setEditingCustomLiterSize("");
      setEditingCustomLiterLabel("");
      setSuccessMessage("הגודל עודכן בהצלחה");
      if (customLitersModalItem) {
        const itemCustomLiters = await getCustomLiters(customLitersModalItem.id);
        setCustomLiters(itemCustomLiters);
      }
    } else {
      setError(result.error || "שגיאה בעדכון הגודל");
    }
  };

  const handleDeleteCustomLiter = async (liter: FoodItemCustomLiter) => {
    if (!confirm(`האם למחוק את "${liter.label}"?`)) return;

    const result = await deleteCustomLiter(liter.id);

    if (result.success) {
      setSuccessMessage(`הגודל "${liter.label}" נמחק`);
      if (customLitersModalItem) {
        const itemCustomLiters = await getCustomLiters(customLitersModalItem.id);
        setCustomLiters(itemCustomLiters);
      }
    } else {
      setError(result.error || "שגיאה במחיקת הגודל");
    }
  };

  // Filter items based on showInactive
  const filteredItems = React.useMemo(() => {
    if (showInactive) {
      return foodItems;
    }
    return foodItems.filter((item) => item.is_active);
  }, [foodItems, showInactive]);

  // Check if selected category is salads
  const isSaladsCategory = React.useMemo(() => {
    const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
    return selectedCategory?.name_en === "salads";
  }, [categories, selectedCategoryId]);

  // Check if selected category is mains (for portion size editing)
  const isMainsCategory = React.useMemo(() => {
    const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
    return selectedCategory?.name_en === "mains";
  }, [categories, selectedCategoryId]);

  // Check if selected category is extras (supports both measurement types and portion sizes)
  const isExtrasCategory = React.useMemo(() => {
    const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
    return selectedCategory?.name_en === "extras";
  }, [categories, selectedCategoryId]);

  // Check if selected category is bakery (supports measurement types like extras)
  const isBakeryCategory = React.useMemo(() => {
    const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
    return selectedCategory?.name_en === "bakery";
  }, [categories, selectedCategoryId]);

  // Get salad items for linked food item dropdown in add-ons
  const saladItems = React.useMemo(() => {
    const saladsCategory = categories.find((c) => c.name_en === "salads");
    if (!saladsCategory) return [];
    return foodItems.filter((item) => item.category_id === saladsCategory.id && item.is_active);
  }, [categories, foodItems]);

  // Get measurement type label
  const getMeasurementLabel = (type: MeasurementType) => {
    switch (type) {
      case "liters":
        return "ליטרים";
      case "size":
        return "גודל (ג׳/ק׳)";
      default:
        return "כמות";
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">{LABELS.loading}</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile optimized */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <button
            onClick={() => router.push("/order")}
            className="flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-gray-900 active:scale-95 transition-all p-1.5 -m-1.5 rounded-lg"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="text-sm sm:text-base">{LABELS.back}</span>
          </button>
          <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">{LABELS.title}</h1>
          <div className="w-12 sm:w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Category Tabs - Mobile optimized */}
        <div className="bg-white rounded-xl border border-gray-200 p-1.5 sm:p-2">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={cn(
                  "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm active:scale-95",
                  selectedCategoryId === category.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Controls - Mobile optimized */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={cn(
              "text-xs sm:text-sm font-medium transition-colors p-1.5 -m-1.5 rounded-lg",
              showInactive ? "text-blue-600" : "text-gray-500"
            )}
          >
            {showInactive ? LABELS.hideInactive : LABELS.showInactive}
          </button>

          <button
            onClick={() => {
              setIsAddingItem(true);
              setNewItemName("");
              setNewItemMeasurementType((isSaladsCategory || isExtrasCategory || isBakeryCategory) ? "liters" : "none");
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 active:scale-[0.98] transition-all text-sm"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{LABELS.addItem}</span>
          </button>
        </div>

        {/* Add New Item Form */}
        {isAddingItem && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">{LABELS.addItem}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {LABELS.newItemName}
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="הזן שם פריט..."
                  className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  autoFocus
                />
              </div>

              {/* Measurement Type - For Salads, Extras and Bakery */}
              {(isSaladsCategory || isExtrasCategory || isBakeryCategory) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {LABELS.measurementType}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {MEASUREMENT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setNewItemMeasurementType(option.value)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                          newItemMeasurementType === option.value
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddItem}
                  disabled={!newItemName.trim() || isSaving}
                  className="flex-1 h-12 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>{isSaving ? LABELS.saving : LABELS.save}</span>
                </button>
                <button
                  onClick={() => setIsAddingItem(false)}
                  className="h-12 px-6 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all"
                >
                  {LABELS.cancel}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Food Items List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {LABELS.noItems}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    "p-4 flex items-center gap-4",
                    !item.is_active && "bg-gray-50 opacity-60"
                  )}
                >
                  {/* Sort Number */}
                  <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                    {index + 1}
                  </span>

                  {/* Item Details */}
                  <div className="flex-1">
                    {editingItemId === item.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          autoFocus
                        />
                        
                        {/* Measurement type for salads, extras and bakery */}
                        {(isSaladsCategory || isExtrasCategory || isBakeryCategory) && (
                          <div className="flex flex-wrap gap-2">
                            {MEASUREMENT_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setEditingMeasurementType(option.value)}
                                className={cn(
                                  "px-3 py-1 rounded text-xs font-medium transition-all border",
                                  editingMeasurementType === option.value
                                    ? "bg-blue-500 text-white border-blue-500"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                )}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Portion size fields for mains, extras and bakery categories */}
                        {(isMainsCategory || isExtrasCategory || isBakeryCategory) && (
                          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <span className="text-sm text-green-700 font-medium">גודל מנה:</span>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder="מכפיל"
                              value={editingPortionMultiplier}
                              onChange={(e) => setEditingPortionMultiplier(e.target.value)}
                              className="w-20 h-8 px-2 text-sm rounded border border-green-300 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                            />
                            <span className="text-sm text-green-600">×</span>
                            <input
                              type="text"
                              placeholder="יחידה (גרם, קציצות...)"
                              value={editingPortionUnit}
                              onChange={(e) => setEditingPortionUnit(e.target.value)}
                              className="flex-1 h-8 px-2 text-sm rounded border border-green-300 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="font-medium text-gray-900">{item.name}</span>
                        {/* Show measurement type for salads, extras and bakery */}
                        {(isSaladsCategory || isExtrasCategory || isBakeryCategory) && (
                          <span className="mr-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {getMeasurementLabel(item.measurement_type)}
                          </span>
                        )}
                        {/* Show portion info for mains, extras and bakery */}
                        {(isMainsCategory || isExtrasCategory || isBakeryCategory) && item.portion_multiplier && item.portion_unit && (
                          <span className="mr-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            × {item.portion_multiplier} {item.portion_unit}
                          </span>
                        )}
                        {!item.is_active && (
                          <span className="mr-2 text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">
                            {LABELS.inactive}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {editingItemId === item.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateItem(item.id)}
                          disabled={!editingName.trim() || isSaving}
                          className="w-10 h-10 flex items-center justify-center rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                        >
                          {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Check className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Add-ons button - only for salad category */}
                        {isSaladsCategory && item.is_active && (
                          <button
                            onClick={() => openAddOnsModal(item)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
                            title={LABELS.manageAddOns}
                          >
                            <PackagePlus className="w-5 h-5" />
                          </button>
                        )}

                        {/* Custom liters button - only for salad items with measurement_type='liters' */}
                        {isSaladsCategory && item.is_active && item.measurement_type === "liters" && (
                          <button
                            onClick={() => openCustomLitersModal(item)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 hover:bg-cyan-200 transition-colors"
                            title={LABELS.manageCustomLiters}
                          >
                            <Droplet className="w-5 h-5" />
                          </button>
                        )}

                        {/* Preparations button - only for non-salad categories */}
                        {!isSaladsCategory && item.is_active && (
                          <button
                            onClick={() => openPreparationsModal(item)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                            title={LABELS.managePreparations}
                          >
                            <ChefHat className="w-5 h-5" />
                          </button>
                        )}

                        <button
                          onClick={() => startEditing(item)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          title={LABELS.edit}
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>

                        {item.is_active ? (
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                            title={LABELS.delete}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRestoreItem(item)}
                              className="w-10 h-10 flex items-center justify-center rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                              title={LABELS.restore}
                            >
                              <RotateCcw className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(item)}
                              className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                              title="מחק לצמיתות"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Preparations Modal */}
      {preparationsModalItem && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closePreparationsModal}
          />
          
          {/* Modal */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl max-h-[80vh] overflow-hidden">
            <div className="max-w-lg mx-auto p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{LABELS.preparations}</h3>
                  <p className="text-sm text-gray-500">{preparationsModalItem.name}</p>
                </div>
                <button
                  type="button"
                  onClick={closePreparationsModal}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add New Preparation */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newPreparationName}
                  onChange={(e) => setNewPreparationName(e.target.value)}
                  placeholder={LABELS.preparationName}
                  className="flex-1 h-12 px-4 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newPreparationName.trim()) {
                      handleAddPreparation();
                    }
                  }}
                />
                <button
                  onClick={handleAddPreparation}
                  disabled={!newPreparationName.trim() || isSaving}
                  className="h-12 px-4 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  <span>{LABELS.addPreparation}</span>
                </button>
              </div>

              {/* Preparations List */}
              <div className="max-h-[40vh] overflow-y-auto">
                {isLoadingPreparations ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-500" />
                  </div>
                ) : preparations.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    {LABELS.noPreparations}
                  </div>
                ) : (
                  <div className="\">
                    {preparations.map((prep, index) => (
                      <div
                        key={prep.id}
                        className={cn(
                          "p-3 rounded-lg border flex items-center gap-3",
                          prep.is_active
                            ? "bg-white border-gray-200"
                            : "bg-gray-50 border-gray-100 opacity-60"
                        )}
                      >
                        {/* Sort Number */}
                        <span className="w-6 h-6 flex items-center justify-center bg-purple-100 rounded-full text-xs font-medium text-purple-600">
                          {index + 1}
                        </span>

                        {/* Name */}
                        <div className="flex-1">
                          {editingPrepId === prep.id ? (
                            <input
                              type="text"
                              value={editingPrepName}
                              onChange={(e) => setEditingPrepName(e.target.value)}
                              className="w-full h-8 px-2 rounded border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && editingPrepName.trim()) {
                                  handleUpdatePreparation(prep.id);
                                } else if (e.key === "Escape") {
                                  setEditingPrepId(null);
                                  setEditingPrepName("");
                                }
                              }}
                            />
                          ) : (
                            <span className="font-medium text-gray-900">{prep.name}</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {editingPrepId === prep.id ? (
                            <>
                              <button
                                onClick={() => handleUpdatePreparation(prep.id)}
                                disabled={!editingPrepName.trim() || isSaving}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                              >
                                {isSaving ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPrepId(null);
                                  setEditingPrepName("");
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingPrepId(prep.id);
                                  setEditingPrepName(prep.name);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePreparation(prep)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={closePreparationsModal}
                className="w-full h-12 mt-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
              >
                {LABELS.cancel}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add-Ons Modal (תוספות אופציונליות) */}
      {addOnsModalItem && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeAddOnsModal}
          />

          {/* Modal */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl max-h-[80vh] overflow-hidden">
            <div className="max-w-lg mx-auto p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{LABELS.addOns}</h3>
                  <p className="text-sm text-gray-500">{addOnsModalItem.name}</p>
                </div>
                <button
                  type="button"
                  onClick={closeAddOnsModal}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add New Add-On */}
              <div className="space-y-3 mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAddOnName}
                    onChange={(e) => setNewAddOnName(e.target.value)}
                    placeholder={LABELS.addOnName}
                    className="flex-1 h-12 px-4 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newAddOnName.trim()) {
                        handleAddAddOn();
                      }
                    }}
                  />
                </div>

                {/* Measurement Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {LABELS.addOnMeasurementType}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setNewAddOnMeasurementType("liters")}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                        newAddOnMeasurementType === "liters"
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      ליטרים (1.5, 2.5, 3, 4.5)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAddOnMeasurementType("none")}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                        newAddOnMeasurementType === "none"
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      כמות רגילה (1, 2, 3...)
                    </button>
                  </div>
                </div>

                {/* Linked Food Item Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    קישור לפריט סלט (אופציונלי)
                  </label>
                  <select
                    value={newAddOnLinkedFoodItemId || ""}
                    onChange={(e) => setNewAddOnLinkedFoodItemId(e.target.value || null)}
                    className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all bg-white"
                  >
                    <option value="">ללא קישור</option>
                    {saladItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    כאשר בוחרים תוספת מקושרת, הכמויות יתווספו לפריט הסלט המקושר
                  </p>
                </div>

                <button
                  onClick={handleAddAddOn}
                  disabled={!newAddOnName.trim() || isSaving}
                  className="w-full h-12 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  <span>{LABELS.addAddOn}</span>
                </button>
              </div>

              {/* Add-Ons List */}
              <div className="max-h-[40vh] overflow-y-auto">
                {isLoadingAddOns ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500" />
                  </div>
                ) : addOns.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    {LABELS.noAddOns}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addOns.map((addOn, index) => (
                      <div
                        key={addOn.id}
                        className={cn(
                          "p-3 rounded-lg border flex items-center gap-3",
                          addOn.is_active
                            ? "bg-white border-gray-200"
                            : "bg-gray-50 border-gray-100 opacity-60"
                        )}
                      >
                        {/* Sort Number */}
                        <span className="w-6 h-6 flex items-center justify-center bg-orange-100 rounded-full text-xs font-medium text-orange-600">
                          {index + 1}
                        </span>

                        {/* Name and Measurement Type */}
                        <div className="flex-1">
                          {editingAddOnId === addOn.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingAddOnName}
                                onChange={(e) => setEditingAddOnName(e.target.value)}
                                className="w-full h-8 px-2 rounded border border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && editingAddOnName.trim()) {
                                    handleUpdateAddOn(addOn.id);
                                  } else if (e.key === "Escape") {
                                    setEditingAddOnId(null);
                                    setEditingAddOnName("");
                                    setEditingAddOnMeasurementType("liters");
                                  }
                                }}
                              />
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingAddOnMeasurementType("liters")}
                                  className={cn(
                                    "px-2 py-1 rounded text-xs font-medium transition-all",
                                    editingAddOnMeasurementType === "liters"
                                      ? "bg-orange-500 text-white"
                                      : "bg-gray-100 text-gray-600"
                                  )}
                                >
                                  ליטרים
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingAddOnMeasurementType("none")}
                                  className={cn(
                                    "px-2 py-1 rounded text-xs font-medium transition-all",
                                    editingAddOnMeasurementType === "none"
                                      ? "bg-orange-500 text-white"
                                      : "bg-gray-100 text-gray-600"
                                  )}
                                >
                                  כמות רגילה
                                </button>
                              </div>
                              <select
                                value={editingAddOnLinkedFoodItemId || ""}
                                onChange={(e) => setEditingAddOnLinkedFoodItemId(e.target.value || null)}
                                className="w-full h-7 px-2 text-xs rounded border border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 bg-white"
                              >
                                <option value="">ללא קישור</option>
                                {saladItems.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    🔗 {item.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div>
                              <span className="font-medium text-gray-900">{addOn.name}</span>
                              <span className="mr-2 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                {getAddOnMeasurementLabel(addOn.measurement_type)}
                              </span>
                              {addOn.linked_food_item_id && (
                                <span className="mr-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                  🔗 {saladItems.find(s => s.id === addOn.linked_food_item_id)?.name || "מקושר"}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {editingAddOnId === addOn.id ? (
                            <>
                              <button
                                onClick={() => handleUpdateAddOn(addOn.id)}
                                disabled={!editingAddOnName.trim() || isSaving}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                              >
                                {isSaving ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingAddOnId(null);
                                  setEditingAddOnName("");
                                  setEditingAddOnMeasurementType("liters");
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingAddOnId(addOn.id);
                                  setEditingAddOnName(addOn.name);
                                  setEditingAddOnMeasurementType(addOn.measurement_type);
                                  setEditingAddOnLinkedFoodItemId(addOn.linked_food_item_id || null);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAddOn(addOn)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={closeAddOnsModal}
                className="w-full h-12 mt-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
              >
                {LABELS.cancel}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Custom Liters Modal (גדלי ליטר מותאמים) */}
      {customLitersModalItem && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeCustomLitersModal}
          />

          {/* Modal */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl max-h-[80vh] overflow-hidden">
            <div className="max-w-lg mx-auto p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{LABELS.customLiters}</h3>
                  <p className="text-sm text-gray-500">{customLitersModalItem.name}</p>
                </div>
                <button
                  type="button"
                  onClick={closeCustomLitersModal}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add New Custom Liter */}
              <div className="space-y-3 mb-4 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newCustomLiterSize}
                    onChange={(e) => setNewCustomLiterSize(e.target.value)}
                    placeholder={LABELS.customLiterSize}
                    className="w-24 h-12 px-4 rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all text-center"
                    dir="ltr"
                  />
                  <input
                    type="text"
                    value={newCustomLiterLabel}
                    onChange={(e) => setNewCustomLiterLabel(e.target.value)}
                    placeholder={LABELS.customLiterLabel}
                    className="flex-1 h-12 px-4 rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newCustomLiterSize.trim() && newCustomLiterLabel.trim()) {
                        handleAddCustomLiter();
                      }
                    }}
                  />
                </div>

                <button
                  onClick={handleAddCustomLiter}
                  disabled={!newCustomLiterSize.trim() || !newCustomLiterLabel.trim() || isSaving}
                  className="w-full h-12 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  <span>{LABELS.addCustomLiter}</span>
                </button>
              </div>

              {/* Custom Liters List */}
              <div className="max-h-[40vh] overflow-y-auto">
                {isLoadingCustomLiters ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-500" />
                  </div>
                ) : customLiters.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    {LABELS.noCustomLiters}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customLiters.map((liter, index) => (
                      <div
                        key={liter.id}
                        className={cn(
                          "p-3 rounded-lg border flex items-center gap-3",
                          liter.is_active
                            ? "bg-white border-gray-200"
                            : "bg-gray-50 border-gray-100 opacity-60"
                        )}
                      >
                        {/* Sort Number */}
                        <span className="w-6 h-6 flex items-center justify-center bg-cyan-100 rounded-full text-xs font-medium text-cyan-600">
                          {index + 1}
                        </span>

                        {/* Size and Label */}
                        <div className="flex-1">
                          {editingCustomLiterId === liter.id ? (
                            <div className="flex gap-2">
                              <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={editingCustomLiterSize}
                                onChange={(e) => setEditingCustomLiterSize(e.target.value)}
                                className="w-20 h-8 px-2 rounded border border-gray-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 text-center"
                                dir="ltr"
                              />
                              <input
                                type="text"
                                value={editingCustomLiterLabel}
                                onChange={(e) => setEditingCustomLiterLabel(e.target.value)}
                                className="flex-1 h-8 px-2 rounded border border-gray-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && editingCustomLiterSize.trim() && editingCustomLiterLabel.trim()) {
                                    handleUpdateCustomLiter(liter.id);
                                  } else if (e.key === "Escape") {
                                    setEditingCustomLiterId(null);
                                    setEditingCustomLiterSize("");
                                    setEditingCustomLiterLabel("");
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{liter.label}</span>
                              <span className="text-xs text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">
                                {liter.size}L
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {editingCustomLiterId === liter.id ? (
                            <>
                              <button
                                onClick={() => handleUpdateCustomLiter(liter.id)}
                                disabled={!editingCustomLiterSize.trim() || !editingCustomLiterLabel.trim() || isSaving}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                              >
                                {isSaving ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCustomLiterId(null);
                                  setEditingCustomLiterSize("");
                                  setEditingCustomLiterLabel("");
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingCustomLiterId(liter.id);
                                  setEditingCustomLiterSize(liter.size.toString());
                                  setEditingCustomLiterLabel(liter.label);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomLiter(liter)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={closeCustomLitersModal}
                className="w-full h-12 mt-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
              >
                {LABELS.cancel}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
    </AuthGuard>
  );
}
