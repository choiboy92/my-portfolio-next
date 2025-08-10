import { AuthGuard } from '@/components/auth/AuthGuard'

export default function AppleDiscountPage() {
  return (
    <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
            <div className="max-w-md w-full space-y-4">
            <h2 className="text-2xl font-bold text-center">Apple Discount Portal</h2>
            <p className="text-center">Work in progress... will be available soon</p>
            </div>
        </div>
    </AuthGuard>
  )
}