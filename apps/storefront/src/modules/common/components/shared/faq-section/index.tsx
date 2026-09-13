import { Heading, Text } from "@modules/common/components/ui"
import InteractiveLink from "@modules/common/components/interactive-link"

const FAQSection = () => {
  return (
    <div className="surface-card border border-subtle rounded-2xl p-6 sm:p-8">
      <Heading level="h3" className="text-xl-semi mb-2">
        Got questions?
      </Heading>
      <Text className="text-ui-fg-subtle txt-medium mb-4">
        You can find frequently asked questions and answers on our customer
        service page.
      </Text>
      <InteractiveLink href="/faq">Customer Service</InteractiveLink>
    </div>
  )
}

export default FAQSection