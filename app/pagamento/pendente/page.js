import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PaymentStatus from "@/components/payment/PaymentStatus";
export default function Page() { return <><Header /><main className="container"><PaymentStatus status="pending" /></main><Footer /></>; }
