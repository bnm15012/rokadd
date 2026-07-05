import { getSessionUser } from "@/lib/permissions";
import { tenantPrisma } from "@/lib/prisma";
import { NewPurchaseClient } from "./NewPurchaseClient";

export default async function NewPurchasePage({
  searchParams,
}: {
  searchParams: Promise<{ vendorId?: string }>;
}) {
  // searchParams is a Promise in Next.js 15+
  const { vendorId: rawVendorId } = await searchParams;
  const preselectedVendorId = rawVendorId ? parseInt(rawVendorId, 10) : null;

  const user = await getSessionUser();
  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) return <p className="text-red-500">No shop found.</p>;

  const db = tenantPrisma(shopId);

  const [vendors, products] = await Promise.all([
    db.vendor.findMany({ orderBy: { name: "asc" } }),
    db.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        sku: true,
        piecesPerCarton: true,
        costPricePerCarton: true,
      },
    }),
  ]);

  return (
    <NewPurchaseClient
      vendors={vendors}
      products={products}
      preselectedVendorId={preselectedVendorId}
    />
  );
}
