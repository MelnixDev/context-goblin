import fs from "node:fs"
import path from "node:path"

function write(root, relative, content) {
  const file = path.join(root, relative)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

export function createBenchmarkFixture(root) {
  write(root, "package.json", JSON.stringify({
    name: "context-goblin-stability-fixture",
    private: true,
    scripts: { dev: "vite", build: "tsc && vite build", test: "vitest", lint: "eslint src --ext ts,tsx" },
    dependencies: { "@vitejs/plugin-react": "latest", vite: "latest", react: "latest", "react-dom": "latest", zustand: "latest" },
    devDependencies: { vitest: "latest", typescript: "latest", eslint: "latest" },
  }, null, 2) + "\n")
  write(root, "tsconfig.json", '{"compilerOptions":{"strict":true,"jsx":"react-jsx","baseUrl":".","paths":{"@/*":["src/*"]}}}\n')
  write(root, "vite.config.ts", "export default {}\n")
  write(root, "README.md", "# Complex Shop Fixture\n\nSynthetic React/Vite cart and catalog app used to test Context Goblin behavior.\n")
  write(root, "AGENTS.md", "# Project Instructions\n\nDo not read `.env` files. Prefer focused reads and add tests for cart behavior changes.\n")
  write(root, "opencode.json", JSON.stringify({
    $schema: "https://opencode.ai/config.json",
    permission: { task: "deny", bash: "deny", edit: "deny" },
  }, null, 2) + "\n")
  write(root, "src/main.tsx", 'import { App } from "./App"\nexport { App }\n')
  write(root, "src/App.tsx", 'import { Header } from "./components/Header"\nimport { routes } from "./routes"\nexport function App() { return <><Header />{routes.catalog}</> }\n')
  write(root, "src/routes.tsx", 'import { ProductList } from "./features/catalog/ProductList"\nimport { CartDrawer } from "./features/cart/CartDrawer"\nexport const routes = { catalog: <><ProductList /><CartDrawer /></> }\n')
  write(root, "src/api/client.ts", 'export async function getJson<T>(url: string): Promise<T> { return (await fetch(url)).json() as Promise<T> }\n')
  write(root, "src/features/catalog/ProductList.tsx", 'import { ProductCard } from "./ProductCard"\nconst products = [{ id: "sku-1", name: "Goblin Mug", price: 12 }]\nexport function ProductList() { return <section>{products.map((product) => <ProductCard key={product.id} product={product} />)}</section> }\n')
  write(root, "src/features/catalog/ProductCard.tsx", 'import { addToCart } from "../cart/cartStore"\nexport interface Product { id: string; name: string; price: number }\nexport function ProductCard({ product }: { product: Product }) { return <button onClick={() => addToCart(product)}>Add {product.name}</button> }\n')
  write(root, "src/features/cart/cartStore.ts", 'import type { Product } from "../catalog/ProductCard"\nexport interface CartItem extends Product { quantity: number }\nlet items: CartItem[] = []\nexport function addToCart(product: Product) {\n  const existing = items.find((item) => item.id === product.id)\n  if (existing) existing.quantity += 1\n  else items.push({ ...product, quantity: 1 })\n}\nexport function removeFromCart(productId: string) { items = items.filter((item) => item.id !== productId) }\nexport function getCartItems() { return items }\nexport function clearCart() { items = [] }\n')
  write(root, "src/features/cart/CartDrawer.tsx", 'import { getCartItems, removeFromCart } from "./cartStore"\nexport function CartDrawer() { return <aside>{getCartItems().map((item) => <button key={item.id} onClick={() => removeFromCart(item.id)}>Remove {item.name}</button>)}</aside> }\n')
  write(root, "src/components/Button.tsx", 'export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button {...props} /> }\n')
  write(root, "src/components/Header.tsx", 'export function Header() { return <header>Complex Shop</header> }\n')
  write(root, "src/styles/theme.css", ":root { color-scheme: light dark; }\n")
  write(root, "tests/cartStore.test.ts", 'import { addToCart, clearCart, getCartItems, removeFromCart } from "../src/features/cart/cartStore"\nimport { describe, expect, it, beforeEach } from "vitest"\nbeforeEach(() => clearCart())\ndescribe("cartStore", () => {\n  it("adds and removes items", () => {\n    addToCart({ id: "sku-1", name: "Goblin Mug", price: 12 })\n    expect(getCartItems()).toHaveLength(1)\n    removeFromCart("sku-1")\n    expect(getCartItems()).toHaveLength(0)\n  })\n})\n')
  write(root, ".env", "API_KEY=super-secret-complex-check\nPASSWORD=super-secret-password\n")
}
