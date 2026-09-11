import { Text } from "@modules/common/components/ui";

import LocalizedClientLink from "@modules/common/components/localized-client-link";
import MedusaCTA from "@modules/layout/components/medusa-cta";

export default async function Footer() {
  return (
    <footer className="footer-surface w-full border-t border-ui-border-base">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-6 xsmall:flex-row items-start justify-between gap-6 pt-12 pb-10">
          <div className="border border-ui-border-base rounded-2xl p-5 sm:p-6 lg:p-7">
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus text-ui-fg-subtle hover:text-ui-fg-base uppercase"
            >
              Medusa Store
            </LocalizedClientLink>
          </div>
          <div className="border border-ui-border-base rounded-2xl p-5 sm:p-6 lg:p-7 flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 md:gap-x-16">
            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus txt-ui-fg-base border-b border-ui-border-base pb-2">
                Shopping
              </span>
              <ul className="grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small">
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base transition block py-0.5"
                    href="/"
                  >
                    Home
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base transition block py-0.5"
                    href="/store"
                  >
                    Shop
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base transition block py-0.5"
                    href="/categories"
                  >
                    Categories
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus txt-ui-fg-base border-b border-ui-border-base pb-2">
                User
              </span>
              <ul className="grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small">
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base transition block py-0.5"
                    href="/account"
                  >
                    Account
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base transition block py-0.5"
                    href="/cart"
                  >
                    Cart
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base transition block py-0.5"
                    href="/wishlist"
                  >
                    Wishlist
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base transition block py-0.5"
                    href="/track-order"
                  >
                    Track Order
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus txt-ui-fg-base border-b border-ui-border-base pb-2">
                Company
              </span>
              <ul className="grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small">
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base transition block py-0.5"
                    href="/about"
                  >
                    About Us
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base transition block py-0.5"
                    href="/contact"
                  >
                    Contact Us
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base transition block py-0.5"
                    href="/faq"
                  >
                    FAQ
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus txt-ui-fg-base border-b border-ui-border-base pb-2">
                Policies
              </span>
              <ul className="grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small">
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base transition block py-0.5"
                    href="/terms"
                  >
                    Terms and Conditions
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base transition block py-0.5"
                    href="/returns"
                  >
                    Returns Policy
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base transition block py-0.5"
                    href="/privacy"
                  >
                    Privacy Policy
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base transition block py-0.5"
                    href="/seller-policy"
                  >
                    Seller Policy
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
        </div>
        <div className="border-t border-ui-border-base pt-4 sm:pt-6 flex flex-col space-y-6 pb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-ui-fg-subtle txt-small">
            <Text className="txt-compact-small">
              © {new Date().getFullYear()} Medusa Store. All rights reserved.
            </Text>
            <MedusaCTA />
          </div>
        </div>
      </div>
    </footer>
  );
}
