const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzhzix3Mw1LkhNhn653DQ2iRj1nHIcWorZp-Se-Me9xoKxcopjYBj_sx-A9aj7IKEWhuw/exec';

export async function GET() {
  const res = await fetch(APPS_SCRIPT_URL, { cache: 'no-store' });
  const json = await res.json();
  return Response.json(json);
}

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return Response.json(json);
}
