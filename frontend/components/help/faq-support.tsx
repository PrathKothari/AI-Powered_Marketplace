'use client'

import { useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { HelpCircle } from 'lucide-react'

const faqItems = [
  {
    category: 'Payments & Razorpay',
    items: [
      {
        question: 'How do I set up Razorpay payments?',
        answer:
          'Go to your Shop Settings, click "Payment Methods," and follow the Razorpay integration steps. You\'ll need a Razorpay Business account. Our support team can guide you through the process if needed.',
      },
      {
        question: 'When do I receive my payments?',
        answer:
          'Razorpay processes payments to your bank account within 2-3 business days. You can check your payment history and balance anytime in your Dashboard under "Earnings."',
      },
      {
        question: 'What fees does Razorpay charge?',
        answer:
          'Razorpay charges a standard processing fee of 2.36% per transaction (varies by payment method). This is deducted automatically before funds are transferred to your account.',
      },
      {
        question: 'Is my payment information secure?',
        answer:
          'Yes, all payments are processed through Razorpay\'s secure, PCI-compliant infrastructure. Your sensitive payment information is never stored on our servers.',
      },
    ],
  },
  {
    category: 'Shipping & Tracking',
    items: [
      {
        question: 'How do I add shipping information to my listings?',
        answer:
          'When creating or editing a product, use the "Shipping" section to specify weight, dimensions, and delivery time. You can also set different shipping rates for different locations.',
      },
      {
        question: 'Can customers track their orders?',
        answer:
          'Yes! When you ship an order, add tracking information in the order details. Customers will receive a tracking link via email and can follow their package in real-time.',
      },
      {
        question: 'What if a customer doesn\'t receive their order?',
        answer:
          'Check the tracking status first. If the order was marked as delivered but not received, encourage the customer to check with neighbors or contact the courier. You can file a claim with the carrier if the package is lost.',
      },
      {
        question: 'Can I offer international shipping?',
        answer:
          'Yes, CraftHub supports international shipping. Go to your Shop Settings and configure which countries you ship to, along with rates for each region.',
      },
    ],
  },
  {
    category: 'Returns & Refunds',
    items: [
      {
        question: 'How do I set my return policy?',
        answer:
          'In your Shop Settings under "Policies," create your return policy. We recommend being clear about whether you accept returns, timeframe (e.g., 14 days), and conditions (unused, original packaging, etc.).',
      },
      {
        question: 'How do I process a refund?',
        answer:
          'Go to the order in your Dashboard, click "Issue Refund," and select the refund amount. The refund will be processed back to the customer\'s original payment method within 3-5 business days.',
      },
      {
        question: 'What\'s the difference between refund and return?',
        answer:
          'A refund is money returned to the customer; a return is when a customer ships the product back to you. Your policy should clarify whether you offer both, and if refunds are given before or after receiving returned items.',
      },
      {
        question: 'Can I offer partial refunds?',
        answer:
          'Yes, you can issue partial refunds when processing returns. For example, you might deduct original shipping costs or a small restocking fee, depending on your policy.',
      },
    ],
  },
  {
    category: 'Customer Ratings',
    items: [
      {
        question: 'How do customer ratings work?',
        answer:
          'After a purchase, customers can leave a 1-5 star rating and written review. These appear on your product pages and shop profile. Your average rating impacts visibility in search results.',
      },
      {
        question: 'Can I respond to negative reviews?',
        answer:
          'Yes, absolutely! We encourage you to respond professionally to reviews. Address concerns, offer solutions, and show future customers you care about feedback. Professional responses often lead to rating improvements.',
      },
      {
        question: 'How can I encourage more reviews?',
        answer:
          'Include a thank-you note in shipments asking customers to leave feedback. You can also send a gentle reminder email 1-2 weeks after delivery. Never offer incentives in exchange for positive reviews.',
      },
      {
        question: 'What if a review is unfair or inappropriate?',
        answer:
          'You can report reviews that violate our community guidelines. Include evidence of why the review should be reviewed. Our team investigates reports and removes content that violates policies.',
      },
    ],
  },
]

export default function FAQSupport() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  return (
    <section>
      <div className="flex items-center gap-2 mb-8">
        <HelpCircle className="w-6 h-6 text-primary" />
        <h2 className="text-3xl font-bold text-foreground">FAQ & Support</h2>
      </div>

      <div className="space-y-8">
        {faqItems.map((category, idx) => (
          <div key={idx}>
            <h3 className="text-xl font-semibold text-foreground mb-4">{category.category}</h3>
            <Accordion type="single" collapsible className="bg-muted/30 rounded-lg p-4">
              {category.items.map((item, itemIdx) => (
                <AccordionItem key={itemIdx} value={`${idx}-${itemIdx}`}>
                  <AccordionTrigger className="hover:no-underline hover:text-primary">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </section>
  )
}
