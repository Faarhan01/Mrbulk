import { Metadata } from "next"
import PageBanner from "@modules/common/components/shared/page-banner"

export const metadata: Metadata = {
  title: "Track Order",
  description: "Track your order status.",
}

export default async function TrackOrderPage() {
  return (
    <div className="w-full">
      <PageBanner title="Track Order" description="Track your order status." />
      <div className="w-full flex justify-center px-8 py-12">
        <div className="max-w-3xl w-full">
          <p className="text-base-regular text-ui-fg-base">
            This is the track order page. Content coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
