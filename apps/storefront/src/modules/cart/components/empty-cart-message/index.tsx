import { Heading, Text } from "@modules/common/components/ui"
import { ShoppingBag } from "@medusajs/icons"
import InteractiveLink from "@modules/common/components/interactive-link"

const EmptyCartMessage = () => {
  return (
    <div className="flex flex-col items-center text-center py-16 px-4" data-testid="empty-cart-message">
      <div className="w-20 h-20 bg-ui-bg-subtle rounded-full flex items-center justify-center mb-6">
        <ShoppingBag className="w-10 h-10 text-ui-fg-subtle" />
      </div>
      <Heading level="h1" className="text-2xl-regular mb-4">
        Your cart is empty
      </Heading>
      <Text className="text-base-regular text-ui-fg-subtle max-w-md mb-8">
        Looks like you haven&apos;t added anything to your cart yet. Browse our
        products and find something you&apos;ll love.
      </Text>
      <InteractiveLink href="/store">Explore products</InteractiveLink>
    </div>
  )
}

export default EmptyCartMessage
