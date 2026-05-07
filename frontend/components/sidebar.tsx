"use client"
import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"
import {
  Menu,
  X,
  LayoutGrid,
  Package,
  ShoppingBag,
  BookOpen,
  User,
  HelpCircle,
} from "lucide-react"

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { icon: LayoutGrid, label: "Dashboard", path: "/artisian/dashboard" },
    { icon: Package, label: "My Products", path: "/artisian/products" },
    { icon: ShoppingBag, label: "Orders", path: "/artisian/orders" },
    { icon: BookOpen, label: "Story Studio", path: "/artisian/story" },
    { icon: User, label: "Profile", path: "/artisian/profile" },
    { icon: HelpCircle, label: "Help", path: "/artisian/help" },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary text-primary-foreground"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:relative w-64 h-screen bg-sidebar border-r border-sidebar-border p-6 transition-transform duration-300 z-40`}
      >
        <div className="mb-12">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
            ◆
          </div>
          <p className="text-sidebar-foreground text-sm font-semibold mt-2">
            KalaSetu
          </p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path

            return (
              <button
                key={item.label}
                onClick={() => {
                  router.push(item.path)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group text-left ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
