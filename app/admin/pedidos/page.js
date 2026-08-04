import AdminSidebar from "@/components/admin/AdminSidebar";
import { getAdminOrders } from "@/modules/orders/order.service";
import OrdersClient from "./OrdersClient";
import styles from "./pedidos.module.css";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <main className="adminShell">
      <AdminSidebar />
      <section className="adminContent">
        <div className="adminTop">
          <div><span className="kicker">Vendas</span><h1>Pedidos</h1></div>
          <span className={styles.counter}>{orders.length} pedidos</span>
        </div>
        <OrdersClient orders={orders} />
      </section>
    </main>
  );
}
