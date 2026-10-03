export const dynamic = 'force-dynamic';
export async function GET() { return new Response(JSON.stringify(Object.keys(process.env).filter(k => k.includes('TURN')))); }
