import { RsvpForm } from "./RsvpForm";

export default async function GuestRsvpPage({
  params,
}: {
  params: Promise<{ publicId: string; token: string }>;
}) {
  const { publicId, token } = await params;
  return <RsvpForm publicId={publicId} token={token} />;
}
