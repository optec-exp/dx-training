import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { readFileSync } from "fs";
import { join } from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const replacements: Record<string, string> = body.replacements ?? {};
    const docTitle: string = body.title || `Document_${Date.now()}`;

    // Read HTML template and replace placeholders
    let html = readFileSync(
      join(process.cwd(), "app/api/generate/template.html"),
      "utf-8"
    );
    for (const [key, value] of Object.entries(replacements)) {
      html = html.replaceAll(`{{${key}}}`, value || "");
    }
    html = html.replaceAll("{{TITLE}}", docTitle);

    // Generate PDF with puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfUint8 = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();
    const pdfBuffer = Buffer.from(pdfUint8);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(docTitle)}.pdf"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
