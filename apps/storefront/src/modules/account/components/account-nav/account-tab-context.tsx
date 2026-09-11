"use client"

import React, { createContext, useContext, useState } from "react"

type Tab = "overview" | "profile" | "orders" | "addresses"

interface AccountTabContextValue {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
}

const AccountTabContext = createContext<AccountTabContextValue | undefined>(undefined)

export const AccountTabProvider = ({
  children,
  defaultTab = "overview",
}: {
  children: React.ReactNode
  defaultTab?: Tab
}) => {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab)

  return (
    <AccountTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </AccountTabContext.Provider>
  )
}

export const useAccountTab = () => {
  const context = useContext(AccountTabContext)
  if (!context) {
    throw new Error("useAccountTab must be used within AccountTabProvider")
  }
  return context
}
