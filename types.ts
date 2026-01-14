
export enum SchemaType {
  AUTO = 'Auto-Detect',
  ARTICLE = 'Article / BlogPosting',
  LOCAL_BUSINESS = 'Local Business',
  PRODUCT = 'Product',
  EVENT = 'Event',
  ORGANIZATION = 'Organization',
  FAQ = 'FAQPage',
  JOB_POSTING = 'JobPosting'
}

export interface Address {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
}

export interface OpeningHourEntry {
  dayOfWeek: string;
  opens: string;
  closes: string;
}

export interface LocalBusinessDetails {
  address?: Address;
  telephone?: string;
  openingHours?: OpeningHourEntry[];
  priceRange?: string;
}

export interface OrganizationDetails {
  name?: string;
  description?: string;
  logoUrl?: string;
  socialLinks?: string;
  address?: Address;
}

export interface SchemaGenerationRequest {
  content: string;
  type: SchemaType;
  targetGeo?: string;
  url?: string;
  localBusinessDetails?: LocalBusinessDetails;
  organizationDetails?: OrganizationDetails;
}

export interface SchemaGenerationResponse {
  jsonLd: string;
  detectedType: string;
  geoOptimizations: string[];
  tips: string[];
}

export const SAMPLE_HTML_TEMPLATE = `<body>
<article class="blog-post">
    <h1>Maximizing Trade Show ROI in 2025</h1>
    <p class="post-meta">Published on Oct 15, 2024 • By Be Unique Exhibits Editorial Team</p>
    <img src="https://www.beunique-exhibits.com/uploads/2024/10/featured.jpg" alt="Trade Show Booth Design">
    <p><strong>Learn how custom exhibit designs can transform your presence at major expos in Las Vegas and Orlando.</strong></p>
    
    <h2>Why Custom Designs Matter</h2>
    <p>In crowded venues like the Las Vegas Convention Center, standing out is critical.</p>

    <div class="cta-box">
        <h2>Need a Trade Show Booth?</h2>
        <p>We build premium exhibits in Las Vegas, Los Angeles, and Chicago.</p>
        <a href="/contact/">Request a Quote</a>
    </div>
</article>
</body>`;
