import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { readFileSync } from "fs";
import { join } from "path";

export async function POST(req: NextRequest) {
  try {
    const record = await req.json();
    const today = new Date().toLocaleDateString("ja-JP", {
      year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Tokyo",
    });

    const replacements: Record<string, string> = {
      顧客名:          record.顧客名          ?? "—",
      案件番号:        record.案件番号        ?? "—",
      経路:            record.経路            ?? "—",
      件名:            record.件名            ?? "—",
      操作ステータス:   record.操作ステータス  ?? "—",
      担当者名:        record.担当者名        ?? "—",
      発行日:          today,
    };

    let html = readFileSync(
      join(process.cwd(), "app/api/generate/template.html"),
      "utf-8"
    );
    for (const [key, value] of Object.entries(replacements)) {
      html = html.replaceAll(`{{${key}}}`, value);
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdfUint8 = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    const filename = `見積書_${record.顧客名 ?? "unknown"}_${record.案件番号 ?? Date.now()}.pdf`;
    return new NextResponse(Buffer.from(pdfUint8), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
