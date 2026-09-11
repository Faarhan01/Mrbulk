import { notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import { listRegions } from "@lib/data/regions"
import AccountDashboardShell from "./account-dashboard-shell"

export default async function Dashboard() {
  const customer = await retrieveCustomer().catch(() => null)
  const orders = (await listOrders().catch(() => null)) || []
  const regions = (await listRegions().catch(() => null)) || []

  if (!customer) {
    notFound()
  }

  return <AccountDashboardShell customer={customer} orders={orders} regions={regions} countryCode={customer.country_code || "us"} />
