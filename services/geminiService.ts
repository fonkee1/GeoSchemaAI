
import { GoogleGenAI } from "@google/genai";
import { SchemaGenerationRequest, SchemaGenerationResponse, Address, OpeningHourEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const CLEAN_JSON_REGEX = /^\s*```json\n([\s\S]*?)\n```\s*$/;

const formatAddress = (addr?: Address) => {
  if (!addr) return "Infer from content";
  const parts = [
    addr.streetAddress,
    addr.addressLocality,
    addr.addressRegion,
    addr.postalCode
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Infer from content";
};

const formatOpeningHours = (hours?: OpeningHourEntry[]) => {
  if (!hours || hours.length === 0) return "Infer from content";
  return hours.map(h => `${h.dayOfWeek} ${h.opens}-${h.closes}`).join(", ");
};

export const generateSchema = async (request: SchemaGenerationRequest): Promise<SchemaGenerationResponse> => {
  const { content, type, targetGeo, url, localBusinessDetails, organizationDetails } = request;

  const localBusinessInfo = localBusinessDetails ? `
    USER-SPECIFIED LOCAL BUSINESS DETAILS:
    - Address: ${formatAddress(localBusinessDetails.address)}
    - Telephone: ${localBusinessDetails.telephone || "Infer from content"}
    - Opening Hours: ${formatOpeningHours(localBusinessDetails.openingHours)}
    - Price Range: ${localBusinessDetails.priceRange || "Infer from content"}
  ` : "";

  const organizationInfo = organizationDetails ? `
    USER-SPECIFIED ORGANIZATION DETAILS:
    - Name: ${organizationDetails.name || "Infer from content"}
    - Description: ${organizationDetails.description || "Infer from content"}
    - Logo URL: ${organizationDetails.logoUrl || "Infer from content"}
    - Social Links (SameAs): ${organizationDetails.socialLinks || "Infer from content"}
    - Address: ${formatAddress(organizationDetails.address)}
  ` : "";

  const prompt = `
    Analyze this content and generate a valid JSON-LD schema markup block.
    Optimize for "AI Geo" search patterns (helping AI systems understand exact location relevance).
    
    Targeting:
    - Expected Schema Type: ${type}
    - Location Intent: ${targetGeo || "Infer from text"}
    - Canonical URL: ${url || "https://example.com/"}
    ${localBusinessInfo}
    ${organizationInfo}

    Content to Analyze:
    """
    ${content.substring(0, 15000)} 
    """

    Optimization Rules:
    1. If a city or region is mentioned, add 'areaServed' or 'location' with specific coordinates if possible.
    2. Ensure Article schema includes author, datePublished, and image if present.
    3. For LocalBusiness, prioritize the 'geo', 'address', and 'telephone' fields. Use structured address parts if provided.
    4. For Organization, ensure 'name', 'description', 'url', 'logo', and 'sameAs' are correctly populated using provided details.
    5. Provide 3 specific SEO tips based on the analysis.

    Return ONLY a JSON object in this format:
    {
      "jsonLd": { ...the full schema object... },
      "detectedType": "The primary schema class",
      "geoOptimizations": ["Optimization 1", "Optimization 2"],
      "tips": ["Tip 1", "Tip 2", "Tip 3"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2, 
      }
    });

    let text = response.text || '';
    
    if (text.includes('```')) {
      const match = text.match(CLEAN_JSON_REGEX);
      if (match) text = match[1];
    }

    const parsed = JSON.parse(text);
    return {
        jsonLd: JSON.stringify(parsed.jsonLd, null, 2), 
        detectedType: parsed.detectedType || "Unknown",
        geoOptimizations: parsed.geoOptimizations || [],
        tips: parsed.tips || []
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("AI failed to parse content. Please ensure the content is readable and try again.");
  }
};
