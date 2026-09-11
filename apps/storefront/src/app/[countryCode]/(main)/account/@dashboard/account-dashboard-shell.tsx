"use client"

import React from "react"
import { useAccountTab } from "@modules/account/components/account-nav/account-tab-context"
import ProfileName from "@modules/account/components/profile-name"
import ProfileEmail from "@modules/account/components/profile-email"
import ProfilePhone from "@modules/account/components/profile-phone"
import ProfileBillingAddress from "@modules/account/components/profile-billing-address"
import OrderOverview from "@modules/account/components/order-overview"
import TransferRequestForm from "@modules/account/components/transfer-request-form"
import AddressBook from "@modules/account/components/address-book"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"

const AccountDashboardShell = ({
  customer,
  orders,
  regions,
}: {
  customer: HttpTypes.StoreCustomer
  orders: HttpTypes.StoreOrder[]
  regions: HttpTypes.StoreRegion[]
}) => {
  const { activeTab } = useAccountTab()

  return (
    <div className="flex-1 space-y-6">
      {activeTab === "profile" && (
        <div className="checkout-step-surface w-full space-y-6" data-testid="profile-page-wrapper">
          <div className="flex flex-col gap-y-4">
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
        <div className="checkout-step-surface w-full space-y-6" data-testid="orders-page-wrapper">
          <div className="flex flex-col gap-y-4">
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
        <div className="checkout-step-surface w-full space-y-6" data-testid="addresses-page-wrapper">
          <div className="flex flex-col gap-y-4">
            <h1 className="text-2xl-semi">Shipping Addresses</h1>
            <p className="text-base-regular">
              View and update your shipping addresses, you can add as many as you
              like. Saving your addresses will make them available during checkout.
            </p>
          </div>
          <AddressBook customer={customer} region={regions[0]} />
        </div>
      )}
    </div>
  )
}

export default AccountDashboardShell
