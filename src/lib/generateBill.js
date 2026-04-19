import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const WIDTH = 58
const MARGIN = 4
const CONTENT_W = WIDTH - MARGIN * 2
const CENTER = WIDTH / 2

export function generateBill(cartItems, total, dailyOrderNo = null) {
  const roundedTotal = Math.ceil(total)

  const itemRows = cartItems.length
  const estimatedHeight = Math.max(160, 38 + itemRows * 7 + 50)

  const doc = new jsPDF({
    unit: 'mm',
    format: [WIDTH, estimatedHeight],
    orientation: 'portrait',
  })

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = now.getFullYear()
  const orderSuffix =
    dailyOrderNo != null
      ? dailyOrderNo
      : now.getTime().toString().slice(-4)

  const billNo = `${dd}${mm}${yyyy}-${orderSuffix}`

  let y = 6

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Mehfil Bar & Restaurant', CENTER, y, { align: 'center' })
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(80, 80, 80)
  doc.text('Fine Spirits · Premium Service', CENTER, y, { align: 'center' })
  y += 4

  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.2)
  doc.line(MARGIN, y, WIDTH - MARGIN, y)
  y += 3

  doc.setFontSize(7)
  doc.setTextColor(0, 0, 0)
  doc.text(`Date: ${dateStr}`, MARGIN, y)
  doc.text(`Time: ${timeStr}`, WIDTH - MARGIN, y, { align: 'right' })
  y += 4
  doc.text(`Bill No: ${billNo}`, MARGIN, y)
  y += 3

  doc.setLineDashPattern([1, 1], 0)
  doc.line(MARGIN, y, WIDTH - MARGIN, y)
  doc.setLineDashPattern([], 0)
  y += 3

  // Table
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: CONTENT_W,
    head: [['Item', 'Qty', 'Rate', 'Amt']],
    body: cartItems.map(i => {
      const variantLabel =
        i.variantName && i.variantName !== 'Standard'
          ? ` (${i.variantName})`
          : ''
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
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 7, halign: 'center' },
      2: { cellWidth: 11, halign: 'right' },
      3: { cellWidth: 12, halign: 'right' },
    },
    theme: 'plain',
  })

  y = doc.lastAutoTable.finalY + 2

  doc.setLineDashPattern([1, 1], 0)
  doc.line(MARGIN, y, WIDTH - MARGIN, y)
  doc.setLineDashPattern([], 0)
  y += 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('TOTAL', MARGIN, y)
  doc.text(`Rs. ${roundedTotal}`, WIDTH - MARGIN, y, {
    align: 'right',
  })
  y += 5

  doc.setLineWidth(0.4)
  doc.line(MARGIN, y, WIDTH - MARGIN, y)
  doc.setLineWidth(0.2)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(80, 80, 80)
  doc.text('Thank you for visiting!', CENTER, y, { align: 'center' })
  y += 4
  doc.text('Please visit again', CENTER, y, { align: 'center' })
  y += 6

  // 🔥 FINAL OUTPUT (FIXED)
  const blob = doc.output('blob')

  const reader = new FileReader()

  reader.onloadend = function () {
    const base64data = reader.result

    console.log("Checking Android bridge...")

    try {
      if (
        window.Android &&
        typeof window.Android.openPdf === 'function'
      ) {
        console.log("✅ Sending to Android")
        window.Android.openPdf(base64data)
      } else {
        console.log("❌ Browser fallback")

        const url = URL.createObjectURL(blob)
        const win = window.open(url, '_blank')

        if (!win) {
          doc.save(`Mehfil_Bill_${billNo}.pdf`)
        }

        setTimeout(() => URL.revokeObjectURL(url), 10000)
      }
    } catch (e) {
      console.log("⚠️ Error fallback", e)
      doc.save(`Mehfil_Bill_${billNo}.pdf`)
    }
  }

  reader.readAsDataURL(blob)
}