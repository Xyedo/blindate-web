import axios from "axios";
import z from "zod";
export const geocodeURL = () => {
  if (!process.env?.["GOOGLE_MAP_API"]) {
    throw new Error("invalid env");
  }

  return `https://maps.googleapis.com/maps/api/geocode/json?key=${process.env["GOOGLE_MAP_API"]}`;
};

const reverseGeocodeSchema = z.object({
  results: z.array(
    z.object({
      formatted_address: z.string(),
      types: z.array(z.string()),
    })
  ),
});

export async function reverseGeocode(coords: {
  lat: number;
  lng: number;
}): Promise<string> {
  try {
    const res = await axios.get(geocodeURL(), {
      params: {
        latlng: `${coords.lat},${coords.lng}`,
        languange: "en",
      },
    });
    
    const data = reverseGeocodeSchema.parse(res.data);
    data.results
      .filter((v) =>
        v.types.some(
          (v) =>
            v === "administrative_area_level_1" ||
            v === "administrative_area_level_2"
        )
      )
      .sort((a, b) =>
        a.types.includes("administrative_area_level_2") ? -1 : 0
      );

    return data.results[0].formatted_address;
  } catch (e) {
    console.log(e);
    return "";
  }
}
