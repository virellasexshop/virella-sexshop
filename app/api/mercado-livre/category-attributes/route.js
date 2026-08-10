import { requireAdminApi, jsonError } from "@/lib/mercado-livre/api-auth";
import { getMercadoLivreCategoryAttributes } from "@/lib/mercado-livre/client";

export async function GET(request) {
  try {
    await requireAdminApi();
    const categoryId = new URL(request.url).searchParams.get("category_id") || "";
    if (!categoryId) return Response.json({ ok: false, error: "Informe category_id." }, { status: 400 });
    const attributes = await getMercadoLivreCategoryAttributes(categoryId);
    const required = attributes
      .filter((item) => item?.tags?.required)
      .map((item) => ({ id: item.id, name: item.name, value_type: item.value_type, values: item.values || [] }));
    const variationAttributes = attributes
      .filter((item) => item?.tags?.allow_variations)
      .map((item) => ({ id: item.id, name: item.name, value_type: item.value_type, values: item.values || [] }));

    const gtinAttribute = attributes.find((item) => item?.id === "GTIN") || null;
    const emptyGtinReasonAttribute = attributes.find((item) => item?.id === "EMPTY_GTIN_REASON") || null;

    return Response.json({
      ok: true,
      required,
      variationAttributes,
      gtin: {
        required: Boolean(gtinAttribute?.tags?.required),
        conditionalRequired: Boolean(gtinAttribute?.tags?.conditional_required),
        attribute: gtinAttribute
          ? { id: gtinAttribute.id, name: gtinAttribute.name, value_type: gtinAttribute.value_type, values: gtinAttribute.values || [] }
          : null,
        canUseEmptyReason: Boolean(
          !gtinAttribute?.tags?.required &&
          emptyGtinReasonAttribute &&
          (emptyGtinReasonAttribute?.tags?.required || emptyGtinReasonAttribute?.tags?.conditional_required)
        ),
        emptyReason: emptyGtinReasonAttribute
          ? {
              id: emptyGtinReasonAttribute.id,
              name: emptyGtinReasonAttribute.name,
              required: Boolean(emptyGtinReasonAttribute?.tags?.required),
              conditionalRequired: Boolean(emptyGtinReasonAttribute?.tags?.conditional_required),
              value_type: emptyGtinReasonAttribute.value_type,
              values: emptyGtinReasonAttribute.values || [],
            }
          : null,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
