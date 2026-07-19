import HeaderClient from "./HeaderClient";
import { getPublicCategories } from "@/modules/categories/category.service";
import { getPromotionSettings } from "@/modules/promotions/promotion.service";

export default async function Header() {
  const [categorias, promotionSettings] = await Promise.all([
    getPublicCategories(),
    getPromotionSettings(),
  ]);
  return <HeaderClient categorias={categorias} promotionSettings={promotionSettings} />;
}
