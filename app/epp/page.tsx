import { AuthGuard } from '@/components/auth/AuthGuard'
import { BasketForm } from '@/components/epp/BasketForm'

export default function AppleDiscountPage() {
  return (
    <AuthGuard>
        <div className="min-h-screen bg-portfolio-dark">
        {/* Header */}
        <div className="bg-portfolio-card border-b border-portfolio-border">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-portfolio-text mb-2">
                EPP Discount
              </h1>
              <p className="text-portfolio-muted">
                Submit your product requests for employee discount pricing
              </p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <BasketForm />
      </div>
    </AuthGuard>
  )
}