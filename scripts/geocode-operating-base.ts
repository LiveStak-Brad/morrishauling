/**
 * One-shot: geocode primary operating base via Google and print canonical fields.
 * Usage: npx tsx scripts/geocode-operating-base.ts
 * Requires GOOGLE_MAPS_API_KEY (does not print the key).
 */
import { resolveVerifiedAddress } from "../lib/geo/resolve-verified";
import { geocodeAddress } from "../lib/geo/geocode";

async function main() {
  if (!process.env.GOOGLE_MAPS_API_KEY?.trim()) {
    console.error("Set GOOGLE_MAPS_API_KEY to geocode the operating base.");
    process.exit(1);
  }

  const query = {
    street: "607 South State Highway 47",
    city: "Warrenton",
    state: "MO",
    zip: "63383",
  };

  console.log("Geocoding:", Object.values(query).join(", "));
  const geo = await geocodeAddress(query);
  console.log("Geocode:", {
    displayName: geo.displayName,
    lat: geo.location.lat,
    lng: geo.location.lng,
    precision: geo.precision,
    placeId: geo.placeId ?? null,
    provider: geo.provider,
  });

  if (geo.placeId) {
    const verified = await resolveVerifiedAddress(query);
    console.log("\nCanonical VerifiedAddress for morris-config:");
    console.log(
      JSON.stringify(
        {
          address: verified.line1,
          city: verified.city,
          state: verified.state,
          zip: verified.zip,
          formattedAddress: verified.formattedAddress,
          location: { lat: verified.lat, lng: verified.lng },
          placeId: verified.placeId,
        },
        null,
        2
      )
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
