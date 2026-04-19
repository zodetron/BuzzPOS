import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const WIDTH = 58          // 58mm thermal roll width
const MARGIN = 4          // left/right margin
const CONTENT_W = WIDTH - MARGIN * 2  // 50mm usable width
const CENTER = WIDTH / 2  // 29mm center

export function generateBill(cartItems, total, dailyOrderNo = null) {
  // Round total up to nearest whole number (Math.ceil)
  const roundedTotal = Math.ceil(total)
  // Header block ~38mm + ~6mm per item row + footer ~20mm
  const itemRows = cartItems.length
  const estimatedHeight = Math.max(160, 38 + itemRows * 7 + 50)

  const doc = new jsPDF({
    unit: 'mm',
    format: [WIDTH, estimatedHeight],
    orientation: 'portrait',
  })

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

  // Bill number: DDMMYYYY-N  (e.g. 19042025-3 = 3rd order on 19 Apr 2025)
  const dd   = String(now.getDate()).padStart(2, '0')
  const mm   = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = now.getFullYear()
  const orderSuffix = dailyOrderNo != null ? dailyOrderNo : now.getTime().toString().slice(-4)
  const billNo = `${dd}${mm}${yyyy}-${orderSuffix}`

  let y = 6

  // ── Restaurant name ───────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Mehfil Bar & Restaurant', CENTER, y, { align: 'center' })
  y += 5

  // ── Tagline ───────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(80, 80, 80)
  doc.text('Fine Spirits · Premium Service', CENTER, y, { align: 'center' })
  y += 4

  // ── Divider ───────────────────────────────────────────────────────────────
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.2)
  doc.line(MARGIN, y, WIDTH - MARGIN, y)
  y += 3

  // ── Bill meta ─────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(0, 0, 0)
  doc.text(`Date: ${dateStr}`, MARGIN, y)
  doc.text(`Time: ${timeStr}`, WIDTH - MARGIN, y, { align: 'right' })
  y += 4
  doc.text(`Bill No: ${billNo}`, MARGIN, y)
  y += 3

  // ── Divider ───────────────────────────────────────────────────────────────
  doc.setLineDashPattern([1, 1], 0)
  doc.line(MARGIN, y, WIDTH - MARGIN, y)
  doc.setLineDashPattern([], 0)
  y += 3

  // ── Items table ───────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CONTENT_W,
    head: [['Item', 'Qty', 'Rate', 'Amt']],
    body: cartItems.map(i => {
      const variantLabel = i.variantName && i.variantName !== 'Standard' ? ` (${i.variantName})` : ''
      const unitPrice = i.selling_price * i.ratio
      const lineTotal = i.cartQuantity * unitPrice
      return [
        `${i.name}${variantLabel}`,
        i.cartQuantity,
        `${unitPrice.toFixed(0)}`,
        `${lineTotal.toFixed(0)}`,
      ]
    }),
    styles: {
      fontSize: 7,
      cellPadding: 1.2,
      overflow: 'linebreak',
      textColor: [0, 0, 0],
      lineWidth: 0,
    },
    headStyles: {
      fillColor: false,
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 7,
      lineWidth: 0,
    },
    columnStyles: {
      0: { cellWidth: 20 },   // Item name — widest
      1: { cellWidth: 7, halign: 'center' },   // Qty
      2: { cellWidth: 11, halign: 'right' },   // Rate
      3: { cellWidth: 12, halign: 'right' },   // Amount
    },
    theme: 'plain',
  })

  y = doc.lastAutoTable.finalY + 2

  // ── Dashed divider ────────────────────────────────────────────────────────
  doc.setLineDashPattern([1, 1], 0)
  doc.line(MARGIN, y, WIDTH - MARGIN, y)
  doc.setLineDashPattern([], 0)
  y += 4

  // ── Total ─────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('TOTAL', MARGIN, y)
  doc.text(`Rs. ${roundedTotal}`, WIDTH - MARGIN, y, { align: 'right' })
  y += 5

  // ── Solid divider ─────────────────────────────────────────────────────────
  doc.setLineWidth(0.4)
  doc.line(MARGIN, y, WIDTH - MARGIN, y)
  doc.setLineWidth(0.2)
  y += 5

  // ── Thank you note ────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(80, 80, 80)
  doc.text('Thank you for visiting!', CENTER, y, { align: 'center' })
  y += 4
  doc.text('Please visit again', CENTER, y, { align: 'center' })
  y += 6

  // ── Save ──────────────────────────────────────────────────────────────────
  doc.save(`Mehfil_Bill_${billNo}.pdf`)
}
