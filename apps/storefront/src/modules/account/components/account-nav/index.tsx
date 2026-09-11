"use client"

import { ArrowRightOnRectangle } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import { useRouter } from "next/navigation"
import { useAccountTab } from "./account-tab-context"

import { signout } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import ChevronRight from "@modules/common/icons/chevron-right"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import User from "@modules/common/icons/user"

type Tab = "profile" | "orders" | "addresses"

const tabs: { key: Tab; label: string; icon: React.FC<{ size: number }> }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "orders", label: "Orders", icon: Package },
  { key: "addresses", label: "Addresses", icon: MapPin },
]

const AccountNav = ({
  customer,
  activeTab,
}: {
  customer: HttpTypes.StoreCustomer | null
  activeTab?: string
}) => {
  const router = useRouter()
  const { setActiveTab } = useAccountTab()

  const handleLogout = async () => {
    await signout()
    router.refresh()
  }

  return (
    <div>
      <div
        className="flex lg:flex-col gap-2 lg:gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none"
        data-testid="account-nav"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={clx(
                "flex items-center justify-between gap-x-2.5 sm:gap-x-3.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all text-left cursor-pointer outline-none shrink-0 whitespace-nowrap w-auto lg:w-full",
                isActive
                  ? "bg-ui-bg-interactive text-ui-fg-on-color shadow-sm"
                  : "bg-ui-bg-subtle text-ui-fg-muted hover:bg-ui-bg-base-hover hover:text-ui-fg-base lg:bg-transparent lg:hover:bg-transparent"
              )}
              data-testid={`${tab.key}-link`}
            >
              <span className="flex items-center gap-x-2.5 sm:gap-x-3.5">
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </span>
              <ChevronRight
                className={clx(
                  "w-4 h-4 hidden lg:block transition-transform",
                  isActive ? "opacity-100 text-ui-fg-on-color" : "opacity-0"
                )}
              />
            </button>
          )
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-between gap-x-2.5 sm:gap-x-3.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all text-left cursor-pointer outline-none shrink-0 whitespace-nowrap w-auto lg:w-full text-ui-fg-subtle hover:text-ui-fg-base lg:bg-transparent lg:hover:bg-transparent"
          data-testid="logout-button"
        >
          <span className="flex items-center gap-x-2.5 sm:gap-x-3.5">
            <ArrowRightOnRectangle />
            <span>Log out</span>
          </span>
        </button>
      </div>
    </div>
  )
}

export default AccountNav
