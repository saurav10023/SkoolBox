import jsPDF from "jspdf";
import logo from "../assets/logo.png";

// Same logo import used in the Navbar/Footer. If your logo lives somewhere
// else, change this import path — or pass a data URL / URL directly into
// generateInvoice(order, customLogoSrc) (see function signature below).
const LOGO_URL = logo;

const STORE_NAME  = "SkoolBox";
const STORE_EMAIL = "skoolboxgumla@gmail.com";
const STORE_PHONE = "+91 7004335880";
const STORE_ADDR  = "Gumla, Jharkhand, India";

// Modern palette
const COLORS = {
  primary:    [79, 70, 229],   // indigo-600
  primaryDk:  [55, 48, 163],   // indigo-800
  accent:     [245, 158, 11],  // amber-500
  dark:       [17, 24, 39],    // gray-900
  gray:       [107, 114, 128], // gray-500
  grayLt:     [156, 163, 175], // gray-400
  bgSoft:     [245, 246, 250], // soft indigo-tinted gray
  border:     [229, 231, 235], // gray-200
  white:      [255, 255, 255],
  success:    [22, 163, 74],   // green-600
  successBg:  [220, 252, 231], // green-100
  pendingBg:  [254, 243, 199], // amber-100
  pendingTx:  [180, 83, 9],    // amber-700
};

// Try to fetch the logo and convert it to a base64 data URL for jsPDF.
// Falls back gracefully (returns null) if it can't be loaded — the invoice
// will then just show a styled monogram badge instead.
const loadLogoAsDataUrl = (url) =>
  new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    } catch {
      resolve(null);
    }
  });

const statusPillColor = (status = "") => {
  const s = status.toLowerCase();
  if (["delivered", "paid", "completed", "success"].includes(s)) {
    return { bg: COLORS.successBg, tx: COLORS.success };
  }
  if (["cancelled", "failed", "refunded"].includes(s)) {
    return { bg: [254, 226, 226], tx: [220, 38, 38] };
  }
  return { bg: COLORS.pendingBg, tx: COLORS.pendingTx };
};

export const generateInvoice = async (order) => {
  const doc = new jsPDF();
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const logoDataUrl = await loadLogoAsDataUrl(LOGO_URL);

  /* ───────────────────────── Header ───────────────────────── */
  const headerH = 48;
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, headerH, "F");
  // subtle darker accent strip at the very top
  doc.setFillColor(...COLORS.primaryDk);
  doc.rect(0, 0, pageWidth, 3, "F");

  // Logo badge (white rounded square) — image if available, else monogram
  const badgeX = margin, badgeY = 11, badgeSize = 15;
  doc.setFillColor(...COLORS.white);
  doc.roundedRect(badgeX, badgeY, badgeSize, badgeSize, 3.5, 3.5, "F");
  if (logoDataUrl) {
    try {
      const pad = 1.6;
      doc.addImage(
        logoDataUrl, "PNG",
        badgeX + pad, badgeY + pad,
        badgeSize - pad * 2, badgeSize - pad * 2
      );
    } catch {
      /* fall through to monogram below if addImage fails */
    }
  }
  if (!logoDataUrl) {
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("SB", badgeX + badgeSize / 2, badgeY + badgeSize / 2 + 1.5, { align: "center" });
  }

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text(STORE_NAME, badgeX + badgeSize + 6, badgeY + 6.5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(219, 220, 253);
  doc.text(STORE_ADDR, badgeX + badgeSize + 6, badgeY + 12.5);
  doc.text(`${STORE_EMAIL}  |  ${STORE_PHONE}`, badgeX + badgeSize + 6, badgeY + 17.5);

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text("INVOICE", pageWidth - margin, 20, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(219, 220, 253);
  const orderRef = order.orderNumber || order._id?.slice(-6).toUpperCase() || "—";
  doc.text(`#${orderRef}`, pageWidth - margin, 27, { align: "right" });
  doc.text(
    new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    }),
    pageWidth - margin, 33, { align: "right" }
  );

  /* ───────────────────────── Info cards ───────────────────────── */
  const cardY = headerH + 8;
  const cardH = 30;
  const gap = 5;
  const cardW = (pageWidth - margin * 2 - gap * 2) / 3;

  const drawCard = (x, title, lines) => {
    doc.setFillColor(...COLORS.bgSoft);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(x, cardY, cardW, cardH, 3, 3, "FD");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(title.toUpperCase(), x + 5, cardY + 7);
    let ly = cardY + 13;
    lines.forEach(({ label, value, pill }) => {
      if (label) {
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.gray);
        doc.text(label, x + 5, ly);
        ly += 4.3;
      }
      if (pill) {
        const w = doc.getTextWidth(value) + 6;
        const { bg, tx } = statusPillColor(value);
        doc.setFillColor(...bg);
        doc.roundedRect(x + 5, ly - 3.6, w, 5, 2, 2, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...tx);
        doc.text(value.toUpperCase(), x + 5 + w / 2, ly, { align: "center" });
        ly += 6.5;
      } else {
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.dark);
        doc.text(String(value).slice(0, 26), x + 5, ly);
        ly += 6.5;
      }
    });
  };

  drawCard(margin, "Order Info", [
    { label: "ORDER DATE", value: new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
    { label: "PAYMENT METHOD", value: order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment" },
  ]);

  drawCard(margin + cardW + gap, "Status", [
    { label: null, value: order.orderStatus || "Pending", pill: true },
    { label: null, value: order.paymentStatus || "Pending", pill: true },
  ]);

  const customerName = order.user?.username || order.user?.userName || "Customer";
  drawCard(margin + (cardW + gap) * 2, "Customer", [
    { label: "NAME", value: customerName },
    { label: "CONTACT", value: order.user?.mobileNumber || order.phoneNumber || "—" },
  ]);

  // Address line under the customer card, full width, so it isn't clipped
  const addrY = cardY + cardH + 5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.gray);
  const fullAddress = `${order.deliveryAddress || ""}, ${order.city || ""}`.replace(/^,\s*|,\s*$/g, "");
  doc.text(`Deliver to: ${fullAddress || "—"}`, margin, addrY);

  /* ───────────────────────── Items table ───────────────────────── */
  const tableY = addrY + 8;
  const colX = { item: margin + 5, category: 92, size: 118, qty: 136, price: 152, total: pageWidth - margin - 2 };

  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(margin, tableY, pageWidth - margin * 2, 10, 2, 2, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text("ITEM", colX.item, tableY + 6.5);
  doc.text("CATEGORY", colX.category, tableY + 6.5);
  doc.text("SIZE", colX.size, tableY + 6.5);
  doc.text("QTY", colX.qty, tableY + 6.5);
  doc.text("PRICE", colX.price, tableY + 6.5);
  doc.text("TOTAL", colX.total, tableY + 6.5, { align: "right" });

  const items = order.orderItems || [];
  let rowY = tableY + 10;
  const rowH = 11;

  items.forEach((item, i) => {
    const total = (item.price || 0) * (item.quantity || 1);

    if (i % 2 === 0) {
      doc.setFillColor(...COLORS.bgSoft);
      doc.rect(margin, rowY, pageWidth - margin * 2, rowH, "F");
    }
    doc.setDrawColor(...COLORS.border);
    doc.line(margin, rowY + rowH, pageWidth - margin, rowY + rowH);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text((item.product?.name || "Product").slice(0, 28), colX.item, rowY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text((item.product?.category || "—").slice(0, 12), colX.category, rowY + 7);
    doc.text(item.size || "—", colX.size, rowY + 7);
    doc.text(String(item.quantity || 1), colX.qty, rowY + 7);

    doc.setTextColor(...COLORS.dark);
    doc.text(`Rs.${item.price || 0}`, colX.price, rowY + 7);
    doc.setFont("helvetica", "bold");
    doc.text(`Rs.${total}`, colX.total, rowY + 7, { align: "right" });

    rowY += rowH;
  });

  /* ───────────────────────── Totals ───────────────────────── */
  const totalsX = 128;
  let totalsY = rowY + 10;

  const subtotal = items.reduce((a, i) => a + (i.price || 0) * (i.quantity || 1), 0);
  const total = order.totalAmount || subtotal;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.gray);
  doc.text("Subtotal", totalsX, totalsY);
  doc.text(`Rs.${subtotal}`, pageWidth - margin, totalsY, { align: "right" });

  totalsY += 7;
  doc.text("Shipping", totalsX, totalsY);
  doc.setTextColor(...COLORS.success);
  doc.setFont("helvetica", "bold");
  doc.text("FREE", pageWidth - margin, totalsY, { align: "right" });

  totalsY += 4;
  doc.setDrawColor(...COLORS.border);
  doc.line(totalsX, totalsY, pageWidth - margin, totalsY);

  totalsY += 7;
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(totalsX - 4, totalsY - 6, pageWidth - margin - totalsX + 4, 12, 2, 2, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text("TOTAL", totalsX + 2, totalsY + 2);
  doc.text(`Rs.${total}`, pageWidth - margin - 4, totalsY + 2, { align: "right" });

  if (order.razorpayPaymentId) {
    totalsY += 12;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.grayLt);
    doc.text(`Transaction ID: ${order.razorpayPaymentId}`, pageWidth - margin, totalsY, { align: "right" });
  }

  /* ───────────────────────── Footer ───────────────────────── */
  const footerH = 20;
  const footerY = pageHeight - footerH;
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, footerY, pageWidth, footerH, "F");
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, footerY, pageWidth, 1.2, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text(`Thank you for shopping with ${STORE_NAME}!`, pageWidth / 2, footerY + 8.5, { align: "center" });

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(219, 220, 253);
  doc.text(`For queries: ${STORE_EMAIL}  |  ${STORE_PHONE}`, pageWidth / 2, footerY + 14.5, { align: "center" });

  const filename = `SkoolBox_Invoice_${orderRef}.pdf`;
  doc.save(filename);
};