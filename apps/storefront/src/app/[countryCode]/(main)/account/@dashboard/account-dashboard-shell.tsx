"use client"

import React, { useState } from "react"
import { useParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import ProfileName from "@modules/account/components/profile-name"
import ProfileEmail from "@modules/account/components/profile-email"
import ProfilePhone from "@modules/account/components/profile-phone"
import ProfileBillingAddress from "@modules/account/components/profile-billing-address"
import OrderOverview from "@modules/account/components/order-overview"
import TransferRequestForm from "@modules/account/components/transfer-request-form"
import AddressBook from "@modules/account/components/address-book"
import Divider from "@modules/common/components/divider"
import ChevronRight from "@modules/common/icons/chevron-right"
import User from "@modules/common/icons/user"
import Package from "@modules/common/icons/package"
import MapPin from "@modules/common/icons/map-pin"
import { clx } from "@modules/common/components/ui"

type Tab = "profile" | "orders" | "addresses"

const tabs = [
  {
    key: "profile" as Tab,
    label: "Profile",
    icon: User,
  },
  {
    key: "orders" as Tab,
    label: "Orders",
    icon: Package,
  },
  {
    key: "addresses" as Tab,
    label: "Addresses",
    icon: MapPin,
  },
]

const AccountDashboardShell = ({
  customer,
  orders,
  regions,
  countryCode,
}: {
  customer: HttpTypes.StoreCustomer
  orders: HttpTypes.StoreOrder[]
  regions: HttpTypes.StoreRegion[]
  countryCode: string
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("profile")
  const region = regions.find((r) => r.countries?.some((c) => c.iso_2 === countryCode)) || regions[0]

  return (
    <div className="grid grid-cols-1 small:grid-cols-[240px_1fr] gap-8">
      {/* Sidebar */}
      <div>
        <div className="pb-4">
          <h3 className="text-base-semi">Account</h3>
        </div>
        <div className="text-base-regular">
          <ul className="flex small:flex-col gap-y-0 overflow-x-auto small:overflow-x-visible">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <li key={tab.key}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={clx(
                      "flex items-center justify-between gap-x-2 py-3 px-2 rounded-lg transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-ui-bg-interactive text-ui-fg-on-color font-semibold shadow-sm"
                        : "text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base-hover"
                    )}
                  >
                    <span className="flex items-center gap-x-2">
                      <tab.icon size={20} />
                      <span>{tab.label}</span>
                    </span>
                    <ChevronRight
                      className={clx(
                        "w-4 h-4 transition-transform",
                        isActive ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === "profile" && (
          <div className="w-full" data-testid="profile-page-wrapper">
            <div className="mb-8 flex flex-col gap-y-4">
              <h1 className="text-2xl-semi">Profile</h1>
              <p className="text-base-regular">
                View and update your profile information, including your name, email,
                and phone number. You can also update your billing address, or change
                your password.
              </p>
            </div>
            <div className="flex flex-col gap-y-8 w-full">
              <ProfileName customer={customer} />
              <Divider />
              <ProfileEmail customer={customer} />
              <Divider />
              <ProfilePhone customer={customer} />
              <Divider />
              <ProfileBillingAddress customer={customer} regions={regions} />
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="w-full" data-testid="orders-page-wrapper">
            <div className="mb-8 flex flex-col gap-y-4">
              <h1 className="text-2xl-semi">Orders</h1>
              <p className="text-base-regular">
                View your previous orders and their status. You can also create
                returns or exchanges for your orders if needed.
              </p>
            </div>
            <div>
              <OrderOverview orders={orders} />
              <Divider className="mb-8 mt-8" />
              <TransferRequestForm />
            </div>
          </div>
        )}

        {activeTab === "addresses" && (
          <div className="w-full" data-testid="addresses-page-wrapper">
            <div className="mb-8 flex flex-col gap-y-4">
              <h1 className="text-2xl-semi">Shipping Addresses</h1>
              <p className="text-base-regular">
                View and update your shipping addresses, you can add as many as you
                like. Saving your addresses will make them available during checkout.
              </p>
            </div>
            <AddressBook customer={customer} region={region} />
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountDashboardShell
