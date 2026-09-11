import { Metadata } from "next"
import { retrieveCustomer } from "@lib/data/customer"
// TODO: Re-add Toaster component when needed
import AccountLayout from "@modules/account/templates/account-layout"

export async function generateMetadata(): Promise<Metadata> {
  const customer = await retrieveCustomer().catch(() => null)

  return {
    title: customer ? "Account" : "Sign in",
    description: customer
      ? "Overview of your account activity."
      : "Sign in to your Medusa Store account.",
  }
}

export default async function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <AccountLayout customer={customer}>
      {customer ? dashboard : login}
      {/* TODO: Re-add Toaster component when needed */}
    </AccountLayout>
  )
}
