//app/api/epp/order/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { jwtVerify } from 'jose'
import { OrderFormData, orderSchema } from '@/lib/validation-schema'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY!)
const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

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

// ✅ Enhanced format order data for email with all new fields
function formatOrderEmail(orderData: OrderFormData, orderId: string): { text: string; html: string } {
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
    if (item.specs) itemLine += `\n   • Configuration: ${item.specs}`
    if (item.memory) itemLine += `\n   • Memory: ${item.memory}`
    if (item.charger) itemLine += `\n   • Charger: ${item.charger}`
    if (item.size) itemLine += `\n   • Size: ${item.size}`
    if (item.connectivity) itemLine += `\n   • Connectivity: ${item.connectivity}`
    
    if (item.band) {
      const bandDetails = []
      if (item.band?.material) bandDetails.push(item.band?.material)
      if (item.band?.style) bandDetails.push(item.band?.style)
      if (item.band?.color) bandDetails.push(item.band?.color)
      if (item.band?.size) bandDetails.push(item.band?.size)
      itemLine += `\n   • Band: ${bandDetails.join(' - ')}`
    }
    
    if (item.applePencil) itemLine += `\n   • Apple Pencil: ${item.applePencil}`
    if (item.magicKeyboard) itemLine += `\n   • Magic Keyboard: Yes`
    if (item.nanoTexture) itemLine += `\n   • Nano-texture Glass: Yes`
    
    // Existing fields
    if (item.appleCare) itemLine += `\n   • AppleCare+: Yes`
    if (item.tradeIn?.hasTradeIn) {
      itemLine += `\n   • Trade-in: ${item.tradeIn.model || 'Device'}`
      if (item.tradeIn.serialNumber) {
        itemLine += ` (SN: ${item.tradeIn.serialNumber})`
      }
    }    
    if (item.estimatedPrice) {
      itemLine += `\n   • Estimated Price: £${item.estimatedPrice.toLocaleString()}`
    }
    if (item.discountValue) {
      itemLine += `\n   • Employee Discount: £${item.discountValue.toLocaleString()}`
      itemLine += `\n   • Final Price: £${((item.estimatedPrice || 0) - (item.discountValue || 0)).toLocaleString()}`
    }
    
    lines.push(itemLine + '\n')
  })

  lines.push(`Delivery Information:`)
  lines.push(`• Method: ${delivery.method.charAt(0).toUpperCase() + delivery.method.slice(1)}`)

  if (delivery.method === 'delivery' && delivery.address) {
    const addr = delivery.address
    lines.push(`• Delivery Type: ${delivery.deliveryType || 'Standard'}`)
    lines.push(`• Address:`)
    lines.push(`  ${addr.line1}`)
    if (addr.line2) lines.push(`  ${addr.line2}`)
    lines.push(`  ${addr.city} ${addr.postcode}`)
  } else if (delivery.method === 'pickup' && delivery.storeLocation) {
    const storeNames: Record<string, string> = {
      'regent-street': 'Apple Regent Street',
      'covent-garden': 'Apple Covent Garden',
      'oxford-street': 'Apple Oxford Street',
      'stratford-city': 'Apple Stratford City',
      'bluewater': 'Apple Bluewater',
      'kingston': 'Apple Kingston'
    }
    lines.push(`• Pickup Store: ${storeNames[delivery.storeLocation] || delivery.storeLocation}`)
  }

  if (orderData.additionalComments && orderData.additionalComments.trim()) {
    lines.push(`\nAdditional Instructions:`)
    lines.push(orderData.additionalComments.trim())
  }

  const totalEstimated = basket.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0)
  const totalDiscount = basket.reduce((sum, item) => sum + (item.discountValue || 0), 0)
  const totalAfterDiscount = totalEstimated - totalDiscount

  lines.push(`\nOrder Summary:`)
  lines.push(`• Total Items: ${basket.length}`)
  if (totalEstimated > 0) {
    lines.push(`• Estimated Total: £${totalEstimated.toLocaleString()} (retail price)`)
    lines.push(`• Employee Discount: £${totalDiscount.toLocaleString()} (17%)`)
    lines.push(`• Final Total: £${totalAfterDiscount.toLocaleString()}`)
  }

  lines.push(`\n---`)
  lines.push(`Order submitted at: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}`)

  const textContent = lines.join('\n')

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; max-width: 700px; margin: 0 auto; padding: 30px; background: #ffffff;">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 3px solid #007bff; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #1a1a1a; margin: 0; font-size: 28px; font-weight: 600;">
          🍎 New Apple EPP Order
        </h1>
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-top: 15px; display: inline-block;">
          <strong>Order ID:</strong> ${orderId}<br>
          <strong>Submitted:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}
        </div>
      </div>

      <!-- Customer Information -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #333; margin-bottom: 15px; font-size: 20px; border-left: 4px solid #007bff; padding-left: 15px;">Customer Information</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div><strong>Email:</strong> ${contact.email}</div>
            <div><strong>Phone:</strong> ${contact.phone}</div>
            ${delivery.address ? `<div><strong>Name:</strong> ${delivery.address.title} ${delivery.address.firstName} ${delivery.address.surname}</div>` : ''}
          </div>
        </div>
      </div>

      <!-- Order Items -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #333; margin-bottom: 15px; font-size: 20px; border-left: 4px solid #007bff; padding-left: 15px;">Order Items</h2>
        <div style="border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden;">
          ${basket.map((item, index) => `
            <div style="padding: 25px; ${index < basket.length - 1 ? 'border-bottom: 1px solid #e9ecef;' : ''} background: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
              <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #007bff; font-size: 18px; flex: 1;">
                  ${index + 1}. ${item.category} - ${item.model}
                </h3>
              </div>
              
              <!-- Product Details Grid -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 15px; font-size: 14px;">
                <div><strong>Color:</strong> <span style="color: #6c757d;">${item.color}</span></div>
                ${item.storage ? `<div><strong>Storage:</strong> <span style="color: #6c757d;">${item.storage}</span></div>` : ''}
                ${item.specs ? `<div><strong>Configuration:</strong> <span style="color: #6c757d;">${item.specs}</span></div>` : ''}
                ${item.memory ? `<div><strong>Memory:</strong> <span style="color: #6c757d;">${item.memory}</span></div>` : ''}
                ${item.charger ? `<div><strong>Charger:</strong> <span style="color: #6c757d;">${item.charger}</span></div>` : ''}
                ${item.size ? `<div><strong>Size:</strong> <span style="color: #6c757d;">${item.size}</span></div>` : ''}
                ${item.connectivity ? `<div><strong>Connectivity:</strong> <span style="color: #6c757d;">${item.connectivity}</span></div>` : ''}
                ${item.applePencil ? `<div><strong>Apple Pencil:</strong> <span style="color: #6c757d;">${item.applePencil}</span></div>` : ''}
                ${item.magicKeyboard ? `<div><strong>Magic Keyboard:</strong> <span style="color: #28a745;">Yes</span></div>` : ''}
                ${item.nanoTexture ? `<div><strong>Nano-texture Glass:</strong> <span style="color: #28a745;">Yes</span></div>` : ''}
              </div>

              <!-- Apple Watch Band Details -->
              ${(item.band) ? `
                <div style="background: #e3f2fd; padding: 12px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #2196f3;">
                  <strong style="color: #1976d2;">Apple Watch Band:</strong>
                  <div style="margin-top: 5px; font-size: 14px;">
                    ${item.band.material ? `<span style="color: #424242;">Material: ${item.band.material}</span><br>` : ''}
                    ${item.band.style ? `<span style="color: #424242;">Style: ${item.band.style}</span><br>` : ''}
                    ${item.band.color ? `<span style="color: #424242;">Color: ${item.band.color}</span><br>` : ''}
                    ${item.band.style ? `<span style="color: #424242;">Size: ${item.band.style}</span>` : ''}
                  </div>
                </div>
              ` : ''}

              <!-- Additional Services -->
              <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px;">
                ${item.appleCare ? `<span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">🛡️ AppleCare+</span>` : ''}
                ${item.tradeIn?.hasTradeIn ? `<span style="background: #17a2b8; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">🔄 Trade-in</span>` : ''}
              </div>

              <!-- Trade-in Details -->
              ${item.tradeIn?.hasTradeIn ? `
                <div style="background: #e8f5e8; padding: 12px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #28a745;">
                  <strong style="color: #155724;">Trade-in Device:</strong>
                  <div style="margin-top: 5px; font-size: 14px; color: #155724;">
                    ${item.tradeIn.model ? `Model: ${item.tradeIn.model}<br>` : ''}
                    ${item.tradeIn.serialNumber ? `Serial: ${item.tradeIn.serialNumber}` : ''}
                  </div>
                </div>
              ` : ''}

              <!-- Pricing -->
              ${item.estimatedPrice ? `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #e9ecef;">
                  <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center;">
                    <span style="color: #6c757d;">Estimated Price:</span>
                    <span style="font-weight: bold; color: #495057;">£${item.estimatedPrice.toLocaleString()}</span>
                  </div>
                  ${item.discountValue ? `
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; margin-top: 8px;">
                      <span style="color: #dc3545;">Employee Discount:</span>
                      <span style="font-weight: bold; color: #dc3545;">-£${item.discountValue.toLocaleString()}</span>
                    </div>
                    <hr style="margin: 10px 0; border: none; border-top: 1px solid #dee2e6;">
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center;">
                      <span style="color: #28a745; font-weight: bold;">Final Price:</span>
                      <span style="font-weight: bold; color: #28a745; font-size: 16px;">£${((item.estimatedPrice || 0) - (item.discountValue || 0)).toLocaleString()}</span>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Delivery Information -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #333; margin-bottom: 15px; font-size: 20px; border-left: 4px solid #007bff; padding-left: 15px;">Delivery Information</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <div style="margin-bottom: 15px;">
            <strong>Method:</strong> ${delivery.method.charAt(0).toUpperCase() + delivery.method.slice(1)}
          </div>
          
          ${delivery.method === 'delivery' && delivery.address ? `
            <div style="margin-bottom: 10px;">
              <strong>Delivery Type:</strong> ${delivery.deliveryType || 'Standard'}
            </div>
            <div>
              <strong>Address:</strong><br>
              <div style="margin-left: 20px; color: #6c757d; line-height: 1.5;">
                ${delivery.address.line1}<br>
                ${delivery.address.line2 ? `${delivery.address.line2}<br>` : ''}
                ${delivery.address.city} ${delivery.address.postcode}
              </div>
            </div>
          ` : ''}
          
          ${delivery.method === 'pickup' && delivery.storeLocation ? `
            <div>
              <strong>Pickup Store:</strong> 
              <span style="color: #007bff;">${{
                'regent-street': 'Apple Regent Street',
                'covent-garden': 'Apple Covent Garden',
                'oxford-street': 'Apple Oxford Street',
                'stratford-city': 'Apple Stratford City',
                'bluewater': 'Apple Bluewater',
                'kingston': 'Apple Kingston'
              }[delivery.storeLocation] || delivery.storeLocation}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Additional Instructions -->
      ${orderData.additionalComments && orderData.additionalComments.trim() ? `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; margin-bottom: 15px; font-size: 20px; border-left: 4px solid #ffc107; padding-left: 15px;">Additional Instructions</h2>
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border: 1px solid #ffeaa7; border-left: 4px solid #ffc107;">
            <div style="color: #856404; line-height: 1.6; white-space: pre-line;">${orderData.additionalComments}</div>
          </div>
        </div>
      ` : ''}

      <!-- Order Summary -->
      <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 30px; border-radius: 8px; text-align: center;">
        <h2 style="margin: 0 0 20px 0; font-size: 24px;">Order Summary</h2>
        <div style="display: grid; gap: 12px; font-size: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>Total Items:</span>
            <strong>${basket.length}</strong>
          </div>
          ${totalEstimated > 0 ? `
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>Estimated Total:</span>
              <strong>£${totalEstimated.toLocaleString()}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; color: #90ee90;">
              <span>Employee Discount (17%):</span>
              <strong>-£${totalDiscount.toLocaleString()}</strong>
            </div>
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.3); margin: 10px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 20px;">
              <span>Final Total:</span>
              <strong>£${totalAfterDiscount.toLocaleString()}</strong>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; color: #6c757d; font-size: 14px;">
        <p style="margin: 0;">
          📧 This order will be processed manually. The customer will be contacted for final confirmation and payment.
        </p>
        <p style="margin: 10px 0 0 0;">
          <strong>Apple Employee Purchase Program</strong> • Order received ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}
        </p>
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

    console.log('Processing EPP Order submission...')
    
    // 2. Parse and validate request body
    const body = await request.json()
    console.log(body)
    const validatedData = orderSchema.parse(body)

    // 3. Generate order ID
    const orderId = generateOrderId()

    // 4. Send email notification using Resend
    const { text, html } = formatOrderEmail(validatedData, orderId)
    
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: [process.env.EMAIL_TO!],
      subject: `🍎 New Apple EPP Order ${orderId} - ${validatedData.delivery.contact.email}`,
      text,
      html
    })

    // 5. Optional: Send customer confirmation
    // try {
    //   await resend.emails.send({
    //     from: process.env.EMAIL_FROM!,
    //     to: [validatedData.delivery.contact.email],
    //     subject: `Apple EPP Order Confirmation - ${orderId}`,
    //     text: `Thank you for your Apple Employee Purchase Program order!\n\nOrder ID: ${orderId}\n\nYour order has been received and will be processed shortly. You will be contacted via email or phone to complete the purchase.\n\nOrder Summary:\n- ${validatedData.basket.length} item(s) requested\n- Delivery method: ${validatedData.delivery.method}\n- Estimated total: £${validatedData.basket.reduce((sum, item) => sum + ((item.estimatedPrice || 0) - (item.discountValue || 0)) * (item.quantity || 1), 0).toLocaleString()}\n\nThank you!`,
    //     html: `
    //       <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
    //         <h1 style="color: #007bff;">🍎 Order Confirmation</h1>
    //         <p>Thank you for your Apple Employee Purchase Program order!</p>
    //         <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
    //           <strong>Order ID:</strong> ${orderId}
    //         </div>
    //         <p>Your order has been received and will be processed shortly. You will be contacted via email or phone to complete the purchase.</p>
    //         <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
    //           <h3 style="margin-top: 0;">Order Summary:</h3>
    //           <ul style="margin-bottom: 0;">
    //             <li>${validatedData.basket.length} item(s) requested</li>
    //             <li>Delivery method: ${validatedData.delivery.method}</li>
    //             <li>Estimated total: £${validatedData.basket.reduce((sum, item) => sum + ((item.estimatedPrice || 0) - (item.discountValue || 0)), 0).toLocaleString()}</li>
    //           </ul>
    //         </div>
    //         <p>Thank you for choosing Apple!</p>
    //       </div>
    //     `
    //   })
    // } catch (confirmationError) {
    //   console.warn('Failed to send customer confirmation email:', confirmationError)
    // }

    // 6. Log successful submission
    console.log('EPP Order submitted successfully:', {
      orderId,
      resendId: emailResult.data?.id,
      customerEmail: validatedData.delivery.contact.email,
      itemCount: validatedData.basket.length,
      totalItems: validatedData.basket.length,
      estimatedTotal: validatedData.basket.reduce((sum, item) => sum + ((item.estimatedPrice || 0) - (item.discountValue || 0)), 0),
      hasComments: !!validatedData.additionalComments?.trim(),
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Order submitted successfully! You will receive confirmation via email.',
      orderId,
      resendId: emailResult.data?.id
    })

  } catch (error) {
    console.error('EPP Order submission error:', error)

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
