import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/customer/",
          "/employee/",
          "/planner/",
          "/account/",
          "/api/",
          "/e/",
          "/i/",
          "/login",
          "/register",
          "/forgot-password",
          "/update-password",
          "/auth/",
          "/unauthorized",
          "/platform/",
        ],
      },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
