"use client"

import { useEffect, useState } from "react"

import { retrieveCustomer } from "@lib/data/customer"
import { retrieveCart, listCartOptions } from "@lib/data/cart"
import { StoreCartShippingOption } from "@medusajs/types"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"

export default function LayoutDataLayer() {
  const [customer, setCustomer] = useState<Awaited<ReturnType<typeof retrieveCustomer>>>(null)
  const [cart, setCart] = useState<Awaited<ReturnType<typeof retrieveCart>>>(null)
  const [shippingOptions, setShippingOptions] = useState<StoreCartShippingOption[]>([])

  useEffect(() => {
    let mounted = true

    async function load() {
      const [cust, c] = await Promise.all([
        retrieveCustomer(),
        retrieveCart(),
      ])

      if (!mounted) {
        return
      }

      setCustomer(cust)
      setCart(c)

      if (c) {
        const { shipping_options } = await listCartOptions()

        if (mounted) {
          setShippingOptions(shipping_options)
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  if (!customer || !cart) {
    return null
  }

  return (
    <>
      <CartMismatchBanner customer={customer} cart={cart} />
      {cart && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart}
          shippingOptions={shippingOptions}
        />
      )}
    </>
  )
}
