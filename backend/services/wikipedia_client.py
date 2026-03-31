import httpx

WIKIPEDIA_HEADERS = {"User-Agent": "CleverPick-CBIT-Project/1.0 (academic research)"}

async def search_wikipedia(query: str) -> dict | None:
    """Search Wikipedia and return top result with content snippet."""
    async with httpx.AsyncClient(timeout=10, headers=WIKIPEDIA_HEADERS) as client:
        search = await client.get("https://en.wikipedia.org/w/api.php", params={
            "action": "query", "list": "search",
            "srsearch": query[:100], "srlimit": 2, "format": "json"
        })
        results = search.json().get("query", {}).get("search", [])
        if not results:
            return None

        title = results[0]["title"]
        content_resp = await client.get("https://en.wikipedia.org/w/api.php", params={
            "action": "query", "titles": title,
            "prop": "extracts", "exintro": True,
            "explaintext": True, "format": "json"
        })
        pages = content_resp.json().get("query", {}).get("pages", {})
        extract = list(pages.values())[0].get("extract", "")
        if not extract:
            return None

        return {
            "title": title,
            "content": extract[:800],
            "url": f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
        }
