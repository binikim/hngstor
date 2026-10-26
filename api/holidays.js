const HOLIDAYS_API = 'https://kdata.kxxseop.workers.dev/api/v1/holidays';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const startYear = Number(request.query.startYear);
  const endYear = Number(request.query.endYear);
  if (
    !Number.isInteger(startYear) ||
    !Number.isInteger(endYear) ||
    startYear < 2004 ||
    endYear < startYear ||
    endYear - startYear > 2
  ) {
    return response.status(400).json({ error: 'Invalid holiday year range' });
  }

  try {
    const results = await Promise.all(
      Array.from({ length: endYear - startYear + 1 }, (_, index) =>
        fetch(`${HOLIDAYS_API}/${startYear + index}.json`).then(async (result) => {
          if (!result.ok) throw new Error('Holiday data service is unavailable');
          const payload = await result.json();
          return Array.isArray(payload.data) ? payload.data : [];
        }),
      ),
    );

    response.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return response.status(200).json({ data: results.flat() });
  } catch {
    return response.status(502).json({ error: 'Holiday data service is unavailable' });
  }
}
