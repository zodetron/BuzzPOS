import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generateBill(cartItems, total) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' })
  const now = new Date().toLocaleString()

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('BAR POS', 74, 16, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${now}`, 14, 26)
  doc.text('Bill Receipt', 14, 31)

  autoTable(doc, {
    startY: 36,
    head: [['Item', 'Qty', 'Price', 'Amount']],
    body: cartItems.map(i => {
      const variantLabel = i.variantName && i.variantName !== 'Standard' ? ` (${i.variantName})` : ''
      const unitPrice = i.selling_price * i.ratio
      const lineTotal = i.cartQuantity * unitPrice
      return [
        `${i.name}${variantLabel}`,
        i.cartQuantity,
        `₹${unitPrice.toFixed(2)}`,
        `₹${lineTotal.toFixed(2)}`,
      ]
    }),
    foot: [['', '', 'TOTAL', `₹${total.toFixed(2)}`]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 30, 30] },
    footStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0, 0, 0] },
  })

  doc.save(`bill_${Date.now()}.pdf`)
}
