import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { jwtVerify } from 'jose'
import { basketItemSchema, deliverySchema, type BasketItemFormData, type DeliveryFormData } from '@/lib/validation-schema'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY!)
const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

// Complete order schema using your existing schemas
const orderSchema = z.object({
  basket: z.array(basketItemSchema.extend({
    //quantity: z.number().min(1).default(1), // Add quantity since it's not in your basketItemSchema
    estimatedPrice: z.number().optional(),
    discountValue: z.number().optional()
  })).min(1, 'At least one item required'),
  delivery: deliverySchema,
  specialInstructions: z.string().optional()
})

type OrderData = z.infer<typeof orderSchema>

// Authentication check
async function verifyAuth(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return false
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

// Generate order ID
function generateOrderId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `EPP-${timestamp}-${random}`.toUpperCase()
}

// Format order data for email
function formatOrderEmail(orderData: OrderData, orderId: string): { text: string; html: string } {
  const { basket, delivery } = orderData
  const contact = delivery.contact
  
  const lines = [
    `New Apple EPP Order from ${contact.email}`,
    `=====================================\n`,
    `Contact Information:`,
    `• Name: ${delivery.address?.title || ''} ${delivery.address?.firstName || ''} ${delivery.address?.surname || ''}`,
    `• Email: ${contact.email}`,
    `• Phone: ${contact.phone}\n`,
    `Order Items:`,
  ]

  basket.forEach((item, index) => {
    let itemLine = `${index + 1}. ${item.category} - ${item.model}`
    itemLine += `\n   • Color: ${item.color}`
    if (item.storage) itemLine += `\n   • Storage: ${item.storage}`
    if (item.specs) itemLine += `\n   • Specs: ${item.specs}`
    if (item.appleCare) itemLine += `\n   • AppleCare+: Yes`
    if (item.tradeIn?.hasTradeIn) {
      itemLine += `\n   • Trade-in: ${item.tradeIn.model} (SN: ${item.tradeIn.serialNumber})`
    }
    if (item.estimatedPrice) {
      itemLine += `\n   • Estimated Price: £${item.estimatedPrice.toLocaleString()}`
    }
    if (item.discountValue) {
      itemLine += `\n   • Estimated Discount: £${item.discountValue.toLocaleString()}`
    }
    lines.push(itemLine)
  })

  lines.push(`\nDelivery Information:`)
  lines.push(`• Method: ${delivery.method.charAt(0).toUpperCase() + delivery.method.slice(1)}`)

  if (delivery.method === 'delivery' && delivery.address) {
    const addr = delivery.address
    lines.push(`• Delivery Type: ${delivery.deliveryType || 'Standard'}`)
    lines.push(`• Address:`)
    lines.push(`  ${addr.line1}`)
    if (addr.line2) lines.push(`  ${addr.line2}`)
    lines.push(`  ${addr.city}`)
    lines.push(`  ${addr.postcode}`)
  } else if (delivery.method === 'pickup') {
    lines.push(`• Pickup Store: ${delivery.storeLocation || 'Not specified'}`)
  }

  if (orderData.specialInstructions) {
    lines.push(`\nSpecial Instructions:`)
    lines.push(orderData.specialInstructions)
  }

  const totalEstimated = basket.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0)
  const totalDiscount = basket.reduce((sum, item) => sum + (item.discountValue || 0), 0)
  const totalAfterDiscount = totalEstimated - totalDiscount

  lines.push(`\nOrder Summary:`)
  lines.push(`• Total Items: ${basket.length}`)
  if (totalEstimated > 0) {
    lines.push(`• Estimated Total: £${totalEstimated.toLocaleString()} (before employee discount)`)
  }
  if (totalDiscount > 0) {
    lines.push(`• Estimated Discount: £${totalDiscount.toLocaleString()}`)
  }
  if (totalAfterDiscount > 0) {
    lines.push(`• Total After Discount: £${totalAfterDiscount.toLocaleString()}`)
  }
  

  lines.push(`\n---`)
  lines.push(`Order submitted at: ${new Date().toLocaleString('en-GB')}`)

  const textContent = lines.join('\n')

  // HTML version with better formatting
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a1a1a; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
        New Apple EPP Order
      </h1>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <strong>Order ID:</strong> ${orderId}<br>
        <strong>Submitted:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}
      </div>

      <h2 style="color: #333; margin-top: 30px;">Customer Information</h2>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Email:</strong> ${contact.email}</li>
        <li><strong>Phone:</strong> ${contact.phone}</li>
        ${delivery.address ? `<li><strong>Name:</strong> ${delivery.address.title} ${delivery.address.firstName} ${delivery.address.surname}</li>` : ''}
      </ul>

      <h2 style="color: #333; margin-top: 30px;">Order Items</h2>
      <div style="border: 1px solid #ddd; border-radius: 5px;">
        ${basket.map((item, index) => `
          <div style="padding: 15px; border-bottom: 1px solid #eee;">
            <h3 style="margin: 0 0 10px 0; color: #007bff;">${index + 1}. ${item.category} - ${item.model}</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px;">
              <div><strong>Color:</strong> ${item.color}</div>
              ${item.storage ? `<div><strong>Storage:</strong> ${item.storage}</div>` : ''}
              ${item.specs ? `<div><strong>Specs:</strong> ${item.specs}</div>` : ''}
              ${item.size ? `<div><strong>Size:</strong> ${item.size}</div>` : ''}
              ${item.connectivity ? `<div><strong>Connectivity:</strong> ${item.connectivity}</div>` : ''}
              ${item.bands ? `<div><strong>Band:</strong> ${item.bands}</div>` : ''}
              ${item.appleCare ? `<div><strong>AppleCare+:</strong> <span style="color: #28a745;">Yes</span></div>` : ''}
              ${item.estimatedPrice ? `<div><strong>Est. Price:</strong> £${item.estimatedPrice.toLocaleString()}</div>` : ''}
            </div>
            ${item.tradeIn?.hasTradeIn ? `
              <div style="margin-top: 10px; padding: 10px; background: #e8f5e8; border-radius: 3px;">
                <strong>Trade-in:</strong> ${item.tradeIn.model || 'Device specified'}
                ${item.tradeIn.serialNumber ? `<br><strong>Serial:</strong> ${item.tradeIn.serialNumber}` : ''}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>

      <h2 style="color: #333; margin-top: 30px;">Delivery Information</h2>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
        <strong>Method:</strong> ${delivery.method.charAt(0).toUpperCase() + delivery.method.slice(1)}<br>
        
        ${delivery.method === 'delivery' && delivery.address ? `
          <strong>Delivery Type:</strong> ${delivery.deliveryType || 'Standard'}<br>
          <strong>Address:</strong><br>
          ${delivery.address.line1}<br>
          ${delivery.address.line2 ? `${delivery.address.line2}<br>` : ''}
          ${delivery.address.city} ${delivery.address.postcode}
        ` : ''}
        
        ${delivery.method === 'pickup' && delivery.storeLocation ? `
          <strong>Pickup Store:</strong> ${delivery.storeLocation}
        ` : ''}
      </div>

      ${orderData.specialInstructions ? `
        <h2 style="color: #333; margin-top: 30px;">Special Instructions</h2>
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
          ${orderData.specialInstructions}
        </div>
      ` : ''}

      <div style="background: #007bff; color: white; padding: 20px; border-radius: 5px; margin-top: 30px; text-align: center;">
        <h2 style="margin: 0 0 10px 0;">Order Summary</h2>
        <div style="font-size: 18px;">
          ${totalEstimated > 0 ? `<strong>Estimated Total:</strong> £${totalEstimated.toLocaleString()} <small>(before employee discount)</small>` : ''}
        </div>
        <div style="font-size: 18px;">
          ${totalDiscount > 0 ? `<strong>Estimated Discount:</strong> £${totalDiscount.toLocaleString()} <small></small>` : ''}
        </div>
        <div style="font-size: 18px;">
          ${totalAfterDiscount > 0 ? `<strong>Total after Discount:</strong> £${totalAfterDiscount.toLocaleString()} <small>(after discount)</small>` : ''}
        </div>
      </div>
    </div>
  `

  return { text: textContent, html: htmlContent }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const isAuthorized = await verifyAuth(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to submit orders.' },
        { status: 401 }
      )
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validatedData = orderSchema.parse(body)

    // 3. Generate order ID
    const orderId = generateOrderId()

    // 4. Send email notification using Resend
    const { text, html } = formatOrderEmail(validatedData, orderId)
    
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: [process.env.EMAIL_TO!],
      subject: `New Apple EPP Order - ${validatedData.delivery.contact.email}`,
      text,
      html
    })

    // 5. Log successful submission
    console.log('EPP Order submitted successfully:', {
      orderId,
      resendId: emailResult.data?.id,
      customerEmail: validatedData.delivery.contact.email,
      itemCount: validatedData.basket.length,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Order submitted successfully!',
      orderId,
      resendId: emailResult.data?.id
    })

  } catch (error) {
    console.error('Order submission error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid order data',
          details: error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process order. Please try again.' },
      { status: 500 }
    )
  }
}
