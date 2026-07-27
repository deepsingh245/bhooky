import { CartPage } from "./pages/CartPage.js";
import { ConnectSwiggyPage } from "./pages/ConnectSwiggyPage.js";
import { SearchPage } from "./pages/SearchPage.js";

// Only a few routes exist, so a plain path switch with full page navigations
// (<a href>, not client-side pushState) is enough — no react-router-dom needed,
// matching the stack's existing minimalism (no client-side router elsewhere).
export function App() {
  if (window.location.pathname === "/cart") {
    return <CartPage />;
  }

  if (window.location.pathname === "/connect-swiggy") {
    return <ConnectSwiggyPage />;
  }

  return <SearchPage />;
}
