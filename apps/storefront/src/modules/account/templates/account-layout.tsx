"use client"

import React from "react"

import AccountNav from "../components/account-nav"
import { AccountTabProvider, useAccountTab } from "../components/account-nav/account-tab-context"
import { HttpTypes } from "@medusajs/types"
import PageBanner from "@modules/common/components/shared/page-banner"
import { clx } from "@modules/common/components/ui"
import FAQSection from "@modules/common/components/shared/faq-section"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayoutInner = ({
  customer,
  children,
}: AccountLayoutProps) => {
  const { activeTab } = useAccountTab()

  return (
    <div data-testid="account-page">
      <PageBanner
        title={customer ? `Hello ${customer.first_name}` : "Account"}
        description={
          customer
            ? `Signed in as ${customer.email}`
            : "Please login or sign up to continue"
        }
        backLabel="Home"
        themeColor="blue"
      />
      <div className="content-container bg-white flex flex-col">
        <div className="max-w-7xl mx-auto w-full">
          <div className={clx("grid grid-cols-1 py-12 gap-6", customer && "small:grid-cols-[240px_1fr]")}>
            {customer && (
              <div>
                <div className="sidebar-panel-surface p-3 sm:p-4">
                  <AccountNav customer={customer} activeTab={activeTab} />
                </div>
              </div>
            )}
            <div className="flex-1">{children}</div>
          </div>
          <div className="flex flex-col small:flex-row items-center justify-center small:border-t border-subtle py-12 gap-8">
              <FAQSection />
          </div>
        </div>
      </div>
    </div>
  )
}

const AccountLayout = ({ customer, children }: AccountLayoutProps) => {
  return (
    <AccountTabProvider defaultTab="overview">
      <AccountLayoutInner customer={customer}>{children}</AccountLayoutInner>
    </AccountTabProvider>
  )
}

export default AccountLayout
