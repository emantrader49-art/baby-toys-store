import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "../layouts/MainLayout.jsx";
import HomePage from "../pages/HomePage.jsx";
import ProductListPage from "../pages/ProductListPage.jsx";
import ProductDetailPage from "../pages/ProductDetailPage.jsx";
import CartPage from "../pages/CartPage.jsx";
import CheckoutPage from "../pages/CheckoutPage.jsx";
import AccountPage from "../pages/AccountPage.jsx";
import AdminDashboardPage from "../pages/AdminDashboardPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "products", element: <ProductListPage /> },
      { path: "products/:slug", element: <ProductDetailPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "account", element: <AccountPage /> },
      { path: "admin", element: <AdminDashboardPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
