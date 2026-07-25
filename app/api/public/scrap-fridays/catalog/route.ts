import { apiOk } from "@/lib/api/route-utils";
import { listActiveScrapItemTypes, listOpenScrapFridays } from "@/lib/db/scrap-fridays";
import {
  DETACHMENT_PAID_NOTE,
  DETACHMENT_RULE,
  NOT_ACCEPTED_ITEMS,
  SCRAP_CATEGORY_LABELS,
} from "@/lib/scrap-fridays/types";

export async function GET() {
  try {
    const [items, fridays] = await Promise.all([
      listActiveScrapItemTypes(),
      listOpenScrapFridays(),
    ]);
    return apiOk({
      items,
      fridays,
      categoryLabels: SCRAP_CATEGORY_LABELS,
      detachmentRule: DETACHMENT_RULE,
      detachmentPaidNote: DETACHMENT_PAID_NOTE,
      notAccepted: NOT_ACCEPTED_ITEMS,
    });
  } catch (e) {
    return apiOk({
      items: [],
      fridays: [],
      categoryLabels: SCRAP_CATEGORY_LABELS,
      detachmentRule: DETACHMENT_RULE,
      detachmentPaidNote: DETACHMENT_PAID_NOTE,
      notAccepted: NOT_ACCEPTED_ITEMS,
      warning: e instanceof Error ? e.message : "unavailable",
    });
  }
}
