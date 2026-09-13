import { Metadata } from "next"

import { getBaseURL } from "@lib/util/env"
import Nav from "@modules/layout/templates/nav"
import Footer from "@modules/layout/templates/footer"
import LayoutDataLayer from "@modules/layout/templates/layout-data-layer"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function PageLayout(props: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <LayoutDataLayer />
      {props.children}
      <Footer />
    </>
  )
}
