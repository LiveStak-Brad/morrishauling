import {
  BeforeAfterGallery,
  MeetTheCrew,
  ProjectCards,
  FleetGallery,
} from "@/components/seo/AuthenticPhotoSections";

/**
 * Trust slots stay empty until real Morris photos/stories exist.
 * Components null-render when content arrays are empty.
 */
export function AuthenticTrustSlots() {
  return (
    <>
      <BeforeAfterGallery projects={[]} />
      <ProjectCards projects={[]} />
      <MeetTheCrew members={[]} />
      <FleetGallery items={[]} />
    </>
  );
}
